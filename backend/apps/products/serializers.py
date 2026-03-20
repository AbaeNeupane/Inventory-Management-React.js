from rest_framework import serializers
from .models import Category, Brand, Product


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model  = Category
        fields = ["id", "name", "created_at"]
        read_only_fields = ["id", "created_at"]


class BrandSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Brand
        fields = ["id", "name", "created_at"]
        read_only_fields = ["id", "created_at"]


class ProductListSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    brand_name    = serializers.CharField(source="brand.name",    read_only=True, allow_null=True)
    is_low_stock  = serializers.BooleanField(read_only=True)
    margin        = serializers.FloatField(read_only=True)

    class Meta:
        model  = Product
        fields = [
            "id", "name", "sku", "category", "category_name",
            "brand", "brand_name", "price", "cost", "tax_rate",
            "stock", "reorder_level", "is_low_stock", "margin",
            "is_active", "image", "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class ProductDetailSerializer(ProductListSerializer):
    class Meta(ProductListSerializer.Meta):
        fields = ProductListSerializer.Meta.fields + ["description", "updated_at"]


class ProductWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Product
        fields = [
            "name", "sku", "description", "category", "brand",
            "price", "cost", "tax_rate", "stock", "reorder_level",
            "image", "is_active",
        ]

    def validate_sku(self, value):
        qs = Product.objects.filter(sku__iexact=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("A product with this SKU already exists.")
        return value.upper()
