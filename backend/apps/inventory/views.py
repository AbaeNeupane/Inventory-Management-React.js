from rest_framework import viewsets, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import F, Sum

from apps.accounts.permissions import IsOwnerOrManagerOrReadOnly, IsOwnerOrManager
from apps.products.models import Product
from apps.products.serializers import ProductListSerializer
from .models import StockAdjustment
from .serializers import StockAdjustmentSerializer, StockAdjustmentWriteSerializer


class StockAdjustmentViewSet(viewsets.ModelViewSet):
    queryset = StockAdjustment.objects.select_related(
        "product", "adjusted_by"
    ).all()
    permission_classes = [IsOwnerOrManager]
    search_fields      = ["product__name", "product__sku", "reason"]
    filterset_fields   = ["reason", "product"]
    ordering_fields    = ["created_at", "delta"]

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return StockAdjustmentWriteSerializer
        return StockAdjustmentSerializer

    def perform_create(self, serializer):
        serializer.save(adjusted_by=self.request.user)

    # Disable delete — adjustments are immutable audit records
    def destroy(self, request, *args, **kwargs):
        from rest_framework.response import Response
        from rest_framework import status
        return Response(
            {"detail": "Stock adjustments cannot be deleted."},
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )


class LowStockListView(generics.ListAPIView):
    """GET /inventory/low-stock/ — all products at or below reorder level."""
    serializer_class   = ProductListSerializer
    permission_classes = [IsOwnerOrManagerOrReadOnly]

    def get_queryset(self):
        return Product.objects.filter(stock__lte=F("reorder_level"), is_active=True)


class InventorySummaryView(generics.GenericAPIView):
    """GET /inventory/summary/ — aggregate snapshot."""
    permission_classes = [IsOwnerOrManagerOrReadOnly]

    def get(self, request):
        products    = Product.objects.filter(is_active=True)
        total_stock = products.aggregate(s=Sum("stock"))["s"] or 0
        stock_value = sum(p.cost * p.stock for p in products)
        low_stock   = products.filter(stock__lte=F("reorder_level"))

        return Response({
            "total_products":  products.count(),
            "total_stock":     total_stock,
            "stock_value":     float(stock_value),
            "low_stock_count": low_stock.count(),
            "out_of_stock":    products.filter(stock=0).count(),
        })
