from rest_framework import serializers
from .models import Supplier, PurchaseOrder, PurchaseOrderItem


class SupplierSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True, allow_null=True)

    class Meta:
        model  = Supplier
        fields = [
            "id", "name", "contact_name", "phone", "email", "address",
            "category", "category_name", "payment_terms", "rating",
            "outstanding", "notes", "is_active", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class SupplierWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Supplier
        fields = [
            "name", "contact_name", "phone", "email", "address",
            "category", "payment_terms", "rating", "outstanding", "notes", "is_active",
        ]


# ── Purchase Orders ───────────────────────────────────────────────────────────

class PurchaseOrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    product_sku  = serializers.CharField(source="product.sku",  read_only=True)
    line_total   = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)

    class Meta:
        model  = PurchaseOrderItem
        fields = ["id", "product", "product_name", "product_sku", "quantity", "unit_cost", "line_total"]


class PurchaseOrderItemWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model  = PurchaseOrderItem
        fields = ["product", "quantity", "unit_cost"]


class PurchaseOrderSerializer(serializers.ModelSerializer):
    items          = PurchaseOrderItemSerializer(many=True, read_only=True)
    supplier_name  = serializers.CharField(source="supplier.name",         read_only=True)
    created_by_name= serializers.CharField(source="created_by.full_name",  read_only=True, allow_null=True)
    total          = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)

    class Meta:
        model  = PurchaseOrder
        fields = [
            "id", "supplier", "supplier_name", "status", "notes",
            "items", "total",
            "ordered_at", "received_at",
            "created_by", "created_by_name", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_by", "created_at", "updated_at"]


class PurchaseOrderWriteSerializer(serializers.ModelSerializer):
    items = PurchaseOrderItemWriteSerializer(many=True)

    class Meta:
        model  = PurchaseOrder
        fields = ["supplier", "status", "notes", "ordered_at", "received_at", "items"]

    def create(self, validated_data):
        items_data = validated_data.pop("items", [])
        order      = PurchaseOrder.objects.create(**validated_data)
        for item in items_data:
            PurchaseOrderItem.objects.create(order=order, **item)
        return order

    def update(self, instance, validated_data):
        items_data = validated_data.pop("items", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if items_data is not None:
            instance.items.all().delete()
            for item in items_data:
                PurchaseOrderItem.objects.create(order=instance, **item)
        return instance
