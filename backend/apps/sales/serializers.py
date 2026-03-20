from rest_framework import serializers
from .models import Order, OrderItem


class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    product_sku  = serializers.CharField(source="product.sku",  read_only=True)
    line_total   = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)
    tax_amount   = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)

    class Meta:
        model  = OrderItem
        fields = [
            "id", "product", "product_name", "product_sku",
            "quantity", "unit_price", "tax_rate", "line_total", "tax_amount",
        ]


class OrderItemWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model  = OrderItem
        fields = ["product", "quantity", "unit_price", "tax_rate"]

    def validate(self, data):
        product  = data["product"]
        quantity = data["quantity"]
        if product.stock < quantity:
            raise serializers.ValidationError(
                {"quantity": f"Only {product.stock} units of '{product.name}' in stock."}
            )
        return data


class OrderListSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source="customer.full_name", read_only=True, allow_null=True)
    cashier_name  = serializers.CharField(source="cashier.full_name",  read_only=True, allow_null=True)
    item_count    = serializers.IntegerField(source="items.count",     read_only=True)

    class Meta:
        model  = Order
        fields = [
            "id", "customer", "customer_name",
            "status", "payment_method",
            "subtotal", "discount", "tax_total", "grand_total",
            "amount_paid", "change_due",
            "item_count", "cashier", "cashier_name",
            "notes", "created_at",
        ]


class OrderDetailSerializer(OrderListSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta(OrderListSerializer.Meta):
        fields = OrderListSerializer.Meta.fields + ["items", "updated_at"]


class OrderCreateSerializer(serializers.ModelSerializer):
    """
    Create a full order with line items in a single POST.
    Automatically deducts stock and calculates all totals.
    """
    items = OrderItemWriteSerializer(many=True)

    class Meta:
        model  = Order
        fields = [
            "customer", "payment_method", "discount",
            "amount_paid", "notes", "items",
        ]

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError("An order must have at least one item.")
        return value

    def create(self, validated_data):
        from apps.inventory.models import StockAdjustment

        items_data  = validated_data.pop("items")
        cashier     = self.context["request"].user

        order = Order.objects.create(cashier=cashier, **validated_data)

        for item_data in items_data:
            product = item_data["product"]
            qty     = item_data["quantity"]

            OrderItem.objects.create(order=order, **item_data)

            # Deduct stock
            product.stock -= qty
            product.save(update_fields=["stock"])

            # Audit trail
            StockAdjustment.objects.create(
                product     = product,
                delta       = -qty,
                reason      = StockAdjustment.Reason.SALE,
                note        = f"Order #{order.pk}",
                adjusted_by = cashier,
            )

        # Calculate and persist totals
        order.calculate_totals()
        order.status = Order.Status.COMPLETED
        order.save()

        # Auto-recalculate customer tier
        if order.customer:
            order.customer.recalculate_tier()

        return order


class OrderRefundSerializer(serializers.Serializer):
    reason = serializers.CharField(required=False, default="Customer refund")

    def validate(self, data):
        order = self.context["order"]
        if order.status != Order.Status.COMPLETED:
            raise serializers.ValidationError(
                f"Only completed orders can be refunded. Current status: {order.status}."
            )
        return data
