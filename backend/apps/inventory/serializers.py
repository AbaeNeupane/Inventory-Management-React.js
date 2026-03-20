from rest_framework import serializers
from .models import StockAdjustment


class StockAdjustmentSerializer(serializers.ModelSerializer):
    product_name      = serializers.CharField(source="product.name",            read_only=True)
    product_sku       = serializers.CharField(source="product.sku",             read_only=True)
    adjusted_by_name  = serializers.CharField(source="adjusted_by.full_name",   read_only=True, allow_null=True)

    class Meta:
        model  = StockAdjustment
        fields = [
            "id", "product", "product_name", "product_sku",
            "delta", "reason", "note",
            "adjusted_by", "adjusted_by_name", "created_at",
        ]
        read_only_fields = ["id", "adjusted_by", "created_at"]


class StockAdjustmentWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model  = StockAdjustment
        fields = ["product", "delta", "reason", "note"]

    def validate(self, data):
        product   = data["product"]
        new_stock = product.stock + data["delta"]
        if new_stock < 0:
            raise serializers.ValidationError(
                {"delta": f"Stock would go negative ({new_stock}). Current stock: {product.stock}."}
            )
        return data

    def create(self, validated_data):
        product = validated_data["product"]
        delta   = validated_data["delta"]
        product.stock += delta
        product.save(update_fields=["stock"])
        return super().create(validated_data)
