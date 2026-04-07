from django.conf import settings
from django.db import models

from apps.core.models import SoftDeleteModel, TimeStampedModel


class Category(SoftDeleteModel):
    name = models.CharField(max_length=120)

    class Meta:
        ordering = ["name", "id"]

    def __str__(self):
        return self.name


class Product(SoftDeleteModel):
    name = models.CharField(max_length=255, null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    purchase_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    stock_quantity = models.PositiveIntegerField(null=True, blank=True, default=0)
    category = models.CharField(max_length=120, null=True, blank=True)

    class Meta:
        ordering = ["name", "id"]

    def __str__(self):
        return self.name or f"Produto {self.pk}"


class ProductImage(TimeStampedModel):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="images")
    image = models.ImageField(upload_to="products/")

    def __str__(self):
        return f"Imagem {self.pk} - {self.product_id}"


class StockMovement(TimeStampedModel):
    class Types(models.TextChoices):
        ENTRY = "entry", "Entrada"
        SALE = "sale", "Venda"
        REVERSAL = "reversal", "Estorno"

    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="movements")
    movement_type = models.CharField(max_length=20, choices=Types.choices)
    quantity = models.IntegerField()
    notes = models.CharField(max_length=255, blank=True)
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="stock_movements",
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.product} - {self.movement_type}"
