from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import F

from apps.accounts.permissions import IsOwnerOrManagerOrReadOnly
from .models import Category, Brand, Product
from .serializers import (
    CategorySerializer,
    BrandSerializer,
    ProductListSerializer,
    ProductDetailSerializer,
    ProductWriteSerializer,
)
from .filters import ProductFilter


class CategoryViewSet(viewsets.ModelViewSet):
    queryset           = Category.objects.all()
    serializer_class   = CategorySerializer
    permission_classes = [IsOwnerOrManagerOrReadOnly]
    search_fields      = ["name"]


class BrandViewSet(viewsets.ModelViewSet):
    queryset           = Brand.objects.all()
    serializer_class   = BrandSerializer
    permission_classes = [IsOwnerOrManagerOrReadOnly]
    search_fields      = ["name"]


class ProductViewSet(viewsets.ModelViewSet):
    queryset           = Product.objects.select_related("category", "brand").all()
    permission_classes = [IsOwnerOrManagerOrReadOnly]
    filterset_class    = ProductFilter
    search_fields      = ["name", "sku", "description", "category__name", "brand__name"]
    ordering_fields    = ["name", "price", "stock", "created_at"]
    ordering           = ["-created_at"]

    def get_serializer_class(self):
        if self.action == "list":
            return ProductListSerializer
        if self.action in ("create", "update", "partial_update"):
            return ProductWriteSerializer
        return ProductDetailSerializer

    @action(detail=False, methods=["get"], url_path="low-stock")
    def low_stock(self, request):
        """GET /products/low-stock/ — products at or below reorder level."""
        qs = self.get_queryset().filter(stock__lte=F("reorder_level"))
        serializer = ProductListSerializer(qs, many=True, context={"request": request})
        return Response(serializer.data)

    @action(detail=True, methods=["post"], url_path="adjust-stock")
    def adjust_stock(self, request, pk=None):
        """POST /products/{id}/adjust-stock/ — manually add or subtract stock."""
        product  = self.get_object()
        delta    = request.data.get("delta")
        reason   = request.data.get("reason", "Manual adjustment")

        try:
            delta = int(delta)
        except (TypeError, ValueError):
            return Response({"detail": "delta must be an integer."}, status=status.HTTP_400_BAD_REQUEST)

        new_stock = product.stock + delta
        if new_stock < 0:
            return Response({"detail": "Stock cannot go below 0."}, status=status.HTTP_400_BAD_REQUEST)

        product.stock = new_stock
        product.save(update_fields=["stock"])

        # Log to inventory adjustment
        from apps.inventory.models import StockAdjustment
        StockAdjustment.objects.create(
            product=product,
            delta=delta,
            reason=reason,
            adjusted_by=request.user,
        )

        return Response({"id": product.id, "stock": product.stock})
