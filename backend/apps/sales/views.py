from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.accounts.permissions import IsOwnerOrManagerOrReadOnly, IsOwnerOrManager
from apps.inventory.models import StockAdjustment
from .models import Order, OrderItem
from .serializers import (
    OrderListSerializer,
    OrderDetailSerializer,
    OrderCreateSerializer,
    OrderRefundSerializer,
)


class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.select_related(
        "customer", "cashier"
    ).prefetch_related("items__product").all()
    permission_classes = [IsOwnerOrManagerOrReadOnly]
    filterset_fields   = ["status", "payment_method", "customer", "cashier"]
    search_fields      = ["customer__full_name", "cashier__full_name"]
    ordering_fields    = ["created_at", "grand_total"]

    def get_serializer_class(self):
        if self.action == "create":
            return OrderCreateSerializer
        if self.action == "list":
            return OrderListSerializer
        return OrderDetailSerializer

    def get_permissions(self):
        # Creating orders (POS checkout) is allowed for all authenticated users
        if self.action == "create":
            from rest_framework.permissions import IsAuthenticated
            return [IsAuthenticated()]
        return super().get_permissions()

    # Orders are immutable after creation — no PUT/PATCH
    def update(self, request, *args, **kwargs):
        return Response(
            {"detail": "Orders cannot be edited. Use /refund/ to reverse a sale."},
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )

    def partial_update(self, request, *args, **kwargs):
        return self.update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        return Response(
            {"detail": "Orders cannot be deleted. Use /refund/ to reverse a sale."},
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )

    @action(detail=True, methods=["post"], url_path="refund")
    def refund(self, request, pk=None):
        """
        POST /sales/orders/{id}/refund/
        Reverses a completed order — restores stock and marks order as refunded.
        Only Owner/Manager can refund.
        """
        if request.user.role not in ("owner", "manager"):
            return Response(
                {"detail": "Only owners and managers can issue refunds."},
                status=status.HTTP_403_FORBIDDEN,
            )

        order = self.get_object()
        serializer = OrderRefundSerializer(
            data=request.data, context={"order": order}
        )
        serializer.is_valid(raise_exception=True)
        reason = serializer.validated_data["reason"]

        # Restore stock for each line item
        for item in order.items.select_related("product").all():
            product        = item.product
            product.stock += item.quantity
            product.save(update_fields=["stock"])

            StockAdjustment.objects.create(
                product     = product,
                delta       = item.quantity,
                reason      = StockAdjustment.Reason.RETURN,
                note        = f"Refund for Order #{order.pk} — {reason}",
                adjusted_by = request.user,
            )

        order.status = Order.Status.REFUNDED
        order.save(update_fields=["status"])

        # Recalculate customer tier after refund
        if order.customer:
            order.customer.recalculate_tier()

        return Response(OrderDetailSerializer(order, context={"request": request}).data)
