from django.urls import path
from . import views

app_name = "reports"

urlpatterns = [
    path("dashboard/",            views.DashboardView.as_view(),              name="dashboard"),
    path("sales-summary/",        views.SalesSummaryView.as_view(),           name="sales_summary"),
    path("sales-by-period/",      views.SalesByPeriodView.as_view(),          name="sales_by_period"),
    path("top-products/",         views.TopProductsView.as_view(),            name="top_products"),
    path("payment-methods/",      views.PaymentMethodBreakdownView.as_view(), name="payment_methods"),
    path("inventory-valuation/",  views.InventoryValuationView.as_view(),     name="inventory_valuation"),
    path("customer-analytics/",   views.CustomerAnalyticsView.as_view(),      name="customer_analytics"),
]
