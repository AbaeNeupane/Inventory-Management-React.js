from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = "inventory"

router = DefaultRouter()
router.register("adjustments", views.StockAdjustmentViewSet, basename="adjustment")

urlpatterns = [
    path("low-stock/", views.LowStockListView.as_view(),      name="low_stock"),
    path("summary/",   views.InventorySummaryView.as_view(),  name="summary"),
    path("",           include(router.urls)),
]
