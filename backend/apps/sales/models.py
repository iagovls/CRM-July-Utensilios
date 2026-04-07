from django.conf import settings
from django.db import models

from apps.clients.models import Client
from apps.core.models import TimeStampedModel
from apps.inventory.models import Product


class Sale(TimeStampedModel):
    class Status(models.TextChoices):
        PENDING = "pending", "Pendente"
        PAID = "paid", "Paga"
        CANCELED = "canceled", "Cancelada"

    customer = models.ForeignKey(
        Client,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="sales",
    )
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    installments_count = models.PositiveIntegerField(default=1)
    first_due_date = models.DateField()
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_sales",
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Venda {self.pk}"


class SaleItem(models.Model):
    sale = models.ForeignKey(Sale, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name="sale_items")
    quantity = models.PositiveIntegerField()
    sale_price = models.DecimalField(max_digits=10, decimal_places=2)
    purchase_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    def __str__(self):
        return f"Item {self.sale_id} - {self.product_id}"


class Installment(TimeStampedModel):
    class Status(models.TextChoices):
        PENDING = "pending", "Pendente"
        PAID = "paid", "Paga"

    class PaymentMethods(models.TextChoices):
        CASH = "cash", "Dinheiro"
        CARD = "card", "Cartão"
        PIX = "pix", "Pix"
        TRANSFER = "transfer", "Transferência"
        OTHER = "other", "Outro"

    sale = models.ForeignKey(Sale, on_delete=models.CASCADE, related_name="installments")
    number = models.PositiveIntegerField()
    due_date = models.DateField()
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    payment_method = models.CharField(
        max_length=20,
        choices=PaymentMethods.choices,
        default=PaymentMethods.OTHER,
    )
    paid_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["due_date", "number"]
        unique_together = ("sale", "number")

    def __str__(self):
        return f"Parcela {self.sale_id}-{self.number}"
