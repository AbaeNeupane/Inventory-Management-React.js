from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.accounts.permissions import IsOwnerOrManagerOrReadOnly, IsOwnerOrManager
from apps.inventory.models import StockAdjustment
from .models import Supplier, PurchaseOrder
from .serializers import (
    SupplierSerializer, SupplierWriteSerializer,
    PurchaseOrderSerializer, PurchaseOrderWriteSerializer,
)


class SupplierViewSet(viewsets.ModelViewSet):
    queryset           = Supplier.objects.select_related("category").all()
    permission_classes = [IsOwnerOrManagerOrReadOnly]
    search_fields      = ["name", "contact_name", "email", "phone"]
    filterset_fields   = ["is_active", "payment_terms", "category"]
    ordering_fields    = ["name", "rating", "outstanding", "created_at"]

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return SupplierWriteSerializer
        return SupplierSerializer


class PurchaseOrderViewSet(viewsets.ModelViewSet):
    queryset = PurchaseOrder.objects.select_related(
        "supplier", "created_by"
    ).prefetch_related("items__product").all()
    permission_classes = [IsOwnerOrManager]
    filterset_fields   = ["status", "supplier"]
    ordering_fields    = ["created_at", "ordered_at"]

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return PurchaseOrderWriteSerializer
        return PurchaseOrderSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=["post"], url_path="receive")
    def receive(self, request, pk=None):
        """
        POST /suppliers/purchase-orders/{id}/receive/
        Mark PO as received — increments product stock for every line item
        and logs StockAdjustments.
        """
        order = self.get_object()

        if order.status == PurchaseOrder.Status.RECEIVED:
            return Response(
                {"detail": "This purchase order has already been received."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if order.status == PurchaseOrder.Status.CANCELLED:
            return Response(
                {"detail": "Cannot receive a cancelled purchase order."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        for item in order.items.select_related("product").all():
            product        = item.product
            product.stock += item.quantity
            product.save(update_fields=["stock"])

            StockAdjustment.objects.create(
                product     = product,
                delta       = item.quantity,
                reason      = StockAdjustment.Reason.PURCHASE,
                note        = f"PO-{order.pk} received from {order.supplier.name}",
                adjusted_by = request.user,
            )

        order.status      = PurchaseOrder.Status.RECEIVED
        order.received_at = timezone.now()
        order.save(update_fields=["status", "received_at"])

        serializer = PurchaseOrderSerializer(order, context={"request": request})
        return Response(serializer.data)

    @action(detail=True, methods=["post"], url_path="cancel")
    def cancel(self, request, pk=None):
        """POST /suppliers/purchase-orders/{id}/cancel/"""
        order = self.get_object()
        if order.status in (PurchaseOrder.Status.RECEIVED, PurchaseOrder.Status.CANCELLED):
            return Response(
                {"detail": f"Cannot cancel an order with status '{order.status}'."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        order.status = PurchaseOrder.Status.CANCELLED
        order.save(update_fields=["status"])
        return Response({"detail": "Purchase order cancelled.", "status": order.status})
