from django.db import transaction
from rest_framework import viewsets

from apps.accounts.permissions import CanDeleteAsAdminOnly
from apps.core.utils import create_audit_log
from apps.inventory.models import Category, Product, StockMovement
from apps.inventory.serializers import CategorySerializer, ProductSerializer


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategorySerializer
    permission_classes = [CanDeleteAsAdminOnly]

    def perform_create(self, serializer):
        category = serializer.save()
        create_audit_log(self.request.user, "create", "category", category.id, f"Categoria {category} criada")

    def perform_update(self, serializer):
        previous_name = serializer.instance.name
        with transaction.atomic():
            category = serializer.save()
            Product.objects.filter(category__iexact=previous_name).update(category=category.name)
        create_audit_log(self.request.user, "update", "category", category.id, f"Categoria {category} atualizada")

    def perform_destroy(self, instance):
        category_name = instance.name
        with transaction.atomic():
            Product.objects.filter(category__iexact=category_name).update(category=None)
            instance.soft_delete()
        create_audit_log(self.request.user, "soft_delete", "category", instance.id, f"Categoria {instance} inativada")


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.filter(is_active=True).prefetch_related("images", "movements")
    serializer_class = ProductSerializer
    permission_classes = [CanDeleteAsAdminOnly]

    def perform_create(self, serializer):
        product = serializer.save()
        StockMovement.objects.create(
            product=product,
            movement_type=StockMovement.Types.ENTRY,
            quantity=product.stock_quantity or 0,
            notes="Estoque inicial",
            actor=self.request.user,
        )
        create_audit_log(self.request.user, "create", "product", product.id, f"Produto {product} criado")

    def perform_update(self, serializer):
        product = serializer.save()
        create_audit_log(self.request.user, "update", "product", product.id, f"Produto {product} atualizado")

    def perform_destroy(self, instance):
        instance.soft_delete()
        create_audit_log(self.request.user, "soft_delete", "product", instance.id, f"Produto {instance} inativado")
