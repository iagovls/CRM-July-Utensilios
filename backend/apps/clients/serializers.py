from rest_framework import serializers

from apps.clients.models import Client
from apps.core.utils import validate_document


class ClientSerializer(serializers.ModelSerializer):
    purchase_history = serializers.SerializerMethodField()

    class Meta:
        model = Client
        fields = [
            "id",
            "name",
            "document",
            "email",
            "phone",
            "address",
            "is_active",
            "purchase_history",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["is_active", "purchase_history", "created_at", "updated_at"]

    def validate_document(self, value):
        if value and not validate_document(value):
            raise serializers.ValidationError("CPF/CNPJ inválido.")
        return value

    def get_purchase_history(self, obj):
        return [
            {
                "sale_id": sale.id,
                "status": sale.status,
                "total_amount": sale.total_amount,
                "created_at": sale.created_at,
            }
            for sale in obj.sales.all()[:10]
        ]
