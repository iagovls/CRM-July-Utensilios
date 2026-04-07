from datetime import timedelta
from decimal import Decimal, ROUND_HALF_UP

from django.db import transaction
from django.utils import timezone

from apps.core.utils import create_audit_log
from apps.inventory.models import StockMovement
from apps.sales.models import Installment, Sale, SaleItem


def next_month(date_value):
    month = date_value.month + 1
    year = date_value.year
    if month > 12:
        month = 1
        year += 1
    day = min(date_value.day, 28)
    return date_value.replace(year=year, month=month, day=day)


@transaction.atomic
def create_sale(validated_data, actor):
    items_data = validated_data.pop("items")
    sale = Sale.objects.create(created_by=actor, **validated_data)
    total_amount = Decimal("0")
    total_cost = Decimal("0")

    for item_data in items_data:
        product = item_data["product"]
        quantity = item_data["quantity"]
        if (product.stock_quantity or 0) < quantity:
            raise ValueError(f"Estoque insuficiente para {product.name}.")
        purchase_price = product.purchase_price or Decimal("0")
        line_total = item_data["sale_price"] * quantity
        total_amount += line_total
        total_cost += purchase_price * quantity
        SaleItem.objects.create(
            sale=sale,
            product=product,
            quantity=quantity,
            sale_price=item_data["sale_price"],
            purchase_price=purchase_price,
        )
        product.stock_quantity = (product.stock_quantity or 0) - quantity
        product.save(update_fields=["stock_quantity", "updated_at"])
        StockMovement.objects.create(
            product=product,
            movement_type=StockMovement.Types.SALE,
            quantity=-quantity,
            notes=f"Venda {sale.id}",
            actor=actor,
        )

    sale.total_amount = total_amount.quantize(Decimal("0.01"))
    sale.total_cost = total_cost.quantize(Decimal("0.01"))
    sale.save(update_fields=["total_amount", "total_cost", "updated_at"])

    installments_count = sale.installments_count or 1
    base_amount = (sale.total_amount / installments_count).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    current_due_date = sale.first_due_date

    for number in range(1, installments_count + 1):
        amount = base_amount
        if number == installments_count:
            previous_total = base_amount * (installments_count - 1)
            amount = sale.total_amount - previous_total
        Installment.objects.create(
            sale=sale,
            number=number,
            due_date=current_due_date,
            amount=amount,
        )
        current_due_date = next_month(current_due_date)

    create_audit_log(actor, "create", "sale", sale.id, f"Venda {sale.id} criada")
    return sale


@transaction.atomic
def cancel_sale(sale, actor):
    if sale.status == Sale.Status.CANCELED:
        return sale
    for item in sale.items.select_related("product"):
        product = item.product
        product.stock_quantity = (product.stock_quantity or 0) + item.quantity
        product.save(update_fields=["stock_quantity", "updated_at"])
        StockMovement.objects.create(
            product=product,
            movement_type=StockMovement.Types.REVERSAL,
            quantity=item.quantity,
            notes=f"Estorno da venda {sale.id}",
            actor=actor,
        )
    sale.status = Sale.Status.CANCELED
    sale.save(update_fields=["status", "updated_at"])
    create_audit_log(actor, "cancel", "sale", sale.id, f"Venda {sale.id} cancelada")
    return sale


@transaction.atomic
def pay_installment(installment, payment_method, amount_paid, actor):
    if installment.status == Installment.Status.PAID:
        raise ValueError("Esta parcela já foi quitada.")
    if amount_paid > installment.amount:
        raise ValueError("O valor pago não pode ser maior que o valor em aberto da parcela.")
    remaining_amount = (installment.amount - amount_paid).quantize(Decimal("0.01"))
    installment.amount = remaining_amount
    installment.paid_amount = (installment.paid_amount + amount_paid).quantize(Decimal("0.01"))
    installment.status = Installment.Status.PAID if remaining_amount == Decimal("0.00") else Installment.Status.PENDING
    installment.payment_method = payment_method
    installment.paid_at = timezone.now()
    installment.save(update_fields=["amount", "paid_amount", "status", "payment_method", "paid_at", "updated_at"])
    sale = installment.sale
    if not sale.installments.filter(status=Installment.Status.PENDING).exists():
        sale.status = Sale.Status.PAID
        sale.save(update_fields=["status", "updated_at"])
    create_audit_log(actor, "payment", "installment", installment.id, f"Pagamento de {amount_paid} na parcela {installment.id}")
    return installment
