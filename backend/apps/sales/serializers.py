from decimal import Decimal

from rest_framework import serializers

from apps.inventory.models import Product
from apps.sales.models import Installment, Sale, SaleItem
from apps.sales.services import create_sale


class SaleItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)

    class Meta:
        model = SaleItem
        fields = ["id", "product", "product_name", "quantity", "sale_price", "purchase_price"]
        read_only_fields = ["purchase_price"]


class InstallmentSerializer(serializers.ModelSerializer):
    is_overdue = serializers.SerializerMethodField()
    customer_name = serializers.CharField(source="sale.customer.name", read_only=True)

    class Meta:
        model = Installment
        fields = [
            "id",
            "number",
            "due_date",
            "amount",
            "paid_amount",
            "status",
            "payment_method",
            "paid_at",
            "is_overdue",
            "customer_name",
        ]

    def get_is_overdue(self, obj):
        return obj.status == Installment.Status.PENDING and obj.due_date < self.context["today"]


class SaleSerializer(serializers.ModelSerializer):
    items = SaleItemSerializer(many=True)
    installments = serializers.SerializerMethodField()
    customer_name = serializers.CharField(source="customer.name", read_only=True)
    profit = serializers.SerializerMethodField()
    is_paid = serializers.BooleanField(write_only=True, required=False, default=False)
    payment_method = serializers.ChoiceField(
        choices=Installment.PaymentMethods.choices, write_only=True, required=False
    )

    class Meta:
        model = Sale
        fields = [
            "id",
            "customer",
            "customer_name",
            "status",
            "installments_count",
            "first_due_date",
            "total_amount",
            "total_cost",
            "profit",
            "items",
            "installments",
            "created_at",
            "is_paid",
            "payment_method",
        ]
        read_only_fields = ["status", "total_amount", "total_cost", "profit", "installments", "created_at"]

    def get_installments(self, obj):
        today = self.context.get("today")
        return InstallmentSerializer(obj.installments.all(), many=True, context={"today": today}).data

    def get_profit(self, obj):
        return obj.total_amount - obj.total_cost

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError("Informe ao menos um item.")
        return value

    def validate(self, attrs):
        for item in attrs["items"]:
            product = item["product"]
            if not product.is_active:
                raise serializers.ValidationError(f"O produto {product.name} está inativo.")
        return attrs

    def create(self, validated_data):
        actor = self.context["request"].user
        try:
            return create_sale(validated_data, actor)
        except ValueError as error:
            raise serializers.ValidationError({"items": [str(error)]}) from error


class InstallmentPaymentSerializer(serializers.Serializer):
    amount_paid = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=Decimal("0.01"))
    payment_method = serializers.ChoiceField(choices=Installment.PaymentMethods.choices)

    def validate(self, attrs):
        installment = self.context["installment"]
        if installment.status == Installment.Status.PAID:
            raise serializers.ValidationError("Esta parcela já foi quitada.")
        if attrs["amount_paid"] > installment.amount:
            raise serializers.ValidationError("O valor pago não pode ser maior que o valor em aberto da parcela.")
        return attrs
