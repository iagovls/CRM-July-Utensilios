from rest_framework import serializers

from apps.inventory.models import Category, Product, ProductImage, StockMovement


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ["id", "image"]


class StockMovementSerializer(serializers.ModelSerializer):
    actor_name = serializers.CharField(source="actor.username", read_only=True)

    class Meta:
        model = StockMovement
        fields = ["id", "movement_type", "quantity", "notes", "actor_name", "created_at"]


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "is_active", "created_at", "updated_at"]
        read_only_fields = ["is_active", "created_at", "updated_at"]

    def validate_name(self, value):
        normalized_name = value.strip()
        if not normalized_name:
            raise serializers.ValidationError("Informe o nome da categoria.")
        queryset = Category.objects.filter(name__iexact=normalized_name, is_active=True)
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)
        if queryset.exists():
            raise serializers.ValidationError("Essa categoria já existe.")
        return normalized_name

    def create(self, validated_data):
        normalized_name = validated_data["name"]
        category = Category.objects.filter(name__iexact=normalized_name).first()
        if category:
            category.name = normalized_name
            category.is_active = True
            category.deleted_at = None
            category.save(update_fields=["name", "is_active", "deleted_at", "updated_at"])
            return category
        return Category.objects.create(**validated_data)


def ensure_category(category_name):
    if not category_name:
        return
    normalized_name = category_name.strip()
    if not normalized_name:
        return
    category = Category.objects.filter(name__iexact=normalized_name).first()
    if category:
        if not category.is_active:
            category.is_active = True
            category.deleted_at = None
            category.save(update_fields=["is_active", "deleted_at", "updated_at"])
        if category.name != normalized_name:
            category.name = normalized_name
            category.save(update_fields=["name", "updated_at"])
        return
    Category.objects.create(name=normalized_name)


class ProductSerializer(serializers.ModelSerializer):
    images = ProductImageSerializer(many=True, read_only=True)
    uploaded_images = serializers.ListField(
        child=serializers.ImageField(),
        required=False,
        write_only=True,
    )
    movements = StockMovementSerializer(many=True, read_only=True)

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "description",
            "purchase_price",
            "stock_quantity",
            "category",
            "is_active",
            "images",
            "uploaded_images",
            "movements",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["is_active", "movements", "created_at", "updated_at"]

    def validate_category(self, value):
        if value is None:
            return None
        normalized_value = value.strip()
        return normalized_value or None

    def create(self, validated_data):
        images = validated_data.pop("uploaded_images", [])
        product = Product.objects.create(**validated_data)
        ensure_category(product.category)
        for image in images:
            ProductImage.objects.create(product=product, image=image)
        return product

    def update(self, instance, validated_data):
        images = validated_data.pop("uploaded_images", [])
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        ensure_category(instance.category)
        for image in images:
            ProductImage.objects.create(product=instance, image=image)
        return instance
