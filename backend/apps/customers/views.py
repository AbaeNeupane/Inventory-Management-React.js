from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.accounts.permissions import IsOwnerOrManagerOrReadOnly
from .models import Customer
from .serializers import CustomerSerializer, CustomerWriteSerializer


class CustomerViewSet(viewsets.ModelViewSet):
    queryset           = Customer.objects.all()
    permission_classes = [IsOwnerOrManagerOrReadOnly]
    search_fields      = ["full_name", "phone", "email"]
    filterset_fields   = ["tier", "is_active"]
    ordering_fields    = ["full_name", "created_at"]

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return CustomerWriteSerializer
        return CustomerSerializer

    @action(detail=True, methods=["get"], url_path="orders")
    def orders(self, request, pk=None):
        """GET /customers/{id}/orders/ — purchase history for a customer."""
        customer = self.get_object()
        from apps.sales.models import Order
        from apps.sales.serializers import OrderListSerializer
        qs = Order.objects.filter(customer=customer).order_by("-created_at")
        serializer = OrderListSerializer(qs, many=True, context={"request": request})
        return Response(serializer.data)

    @action(detail=True, methods=["post"], url_path="recalculate-tier")
    def recalculate_tier(self, request, pk=None):
        """POST /customers/{id}/recalculate-tier/ — refresh loyalty tier."""
        customer = self.get_object()
        customer.recalculate_tier()
        return Response({"id": customer.id, "tier": customer.tier})
