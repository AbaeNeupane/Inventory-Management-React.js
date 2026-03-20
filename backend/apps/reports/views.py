from django.db.models import Sum, Count, Avg, F, DecimalField, ExpressionWrapper
from django.db.models.functions import TruncMonth, TruncDay, TruncWeek
from django.utils import timezone
from datetime import timedelta

from rest_framework import generics
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema, OpenApiParameter

from apps.accounts.permissions import IsOwnerOrManager
from apps.sales.models import Order, OrderItem
from apps.products.models import Product
from apps.customers.models import Customer


def date_range_from_request(request, default_days=30):
    """Parse ?from_date and ?to_date query params; default to last N days."""
    from datetime import datetime
    fmt = "%Y-%m-%d"
    to_date   = request.query_params.get("to_date")
    from_date = request.query_params.get("from_date")
    try:
        to_dt   = datetime.strptime(to_date,   fmt).date() if to_date   else timezone.now().date()
        from_dt = datetime.strptime(from_date, fmt).date() if from_date else (to_dt - timedelta(days=default_days))
    except ValueError:
        to_dt   = timezone.now().date()
        from_dt = to_dt - timedelta(days=default_days)
    return from_dt, to_dt


class SalesSummaryView(APIView):
    """
    GET /reports/sales-summary/
    Overall sales KPIs for a date range.
    Query params: from_date, to_date (YYYY-MM-DD)
    """
    permission_classes = [IsOwnerOrManager]

    def get(self, request):
        from_dt, to_dt = date_range_from_request(request)
        orders = Order.objects.filter(
            status=Order.Status.COMPLETED,
            created_at__date__gte=from_dt,
            created_at__date__lte=to_dt,
        )
        agg = orders.aggregate(
            total_revenue = Sum("grand_total"),
            total_orders  = Count("id"),
            avg_order     = Avg("grand_total"),
            total_tax     = Sum("tax_total"),
            total_discount= Sum("discount"),
        )

        refunded = Order.objects.filter(
            status=Order.Status.REFUNDED,
            created_at__date__gte=from_dt,
            created_at__date__lte=to_dt,
        ).aggregate(total=Sum("grand_total"))["total"] or 0

        return Response({
            "from_date":      str(from_dt),
            "to_date":        str(to_dt),
            "total_revenue":  float(agg["total_revenue"]  or 0),
            "total_orders":   agg["total_orders"]  or 0,
            "avg_order_value":float(agg["avg_order"]       or 0),
            "total_tax":      float(agg["total_tax"]       or 0),
            "total_discount": float(agg["total_discount"]  or 0),
            "total_refunded": float(refunded),
        })


class SalesByPeriodView(APIView):
    """
    GET /reports/sales-by-period/?period=day|week|month
    Aggregated revenue and order count grouped by period.
    """
    permission_classes = [IsOwnerOrManager]

    def get(self, request):
        from_dt, to_dt = date_range_from_request(request, default_days=90)
        period  = request.query_params.get("period", "day")

        trunc_fn = {"day": TruncDay, "week": TruncWeek, "month": TruncMonth}.get(period, TruncDay)

        data = (
            Order.objects
            .filter(status=Order.Status.COMPLETED,
                    created_at__date__gte=from_dt,
                    created_at__date__lte=to_dt)
            .annotate(period=trunc_fn("created_at"))
            .values("period")
            .annotate(
                revenue     = Sum("grand_total"),
                order_count = Count("id"),
            )
            .order_by("period")
        )

        return Response([
            {
                "period":      row["period"].strftime("%Y-%m-%d"),
                "revenue":     float(row["revenue"]),
                "order_count": row["order_count"],
            }
            for row in data
        ])


class TopProductsView(APIView):
    """
    GET /reports/top-products/?limit=10
    Best-selling products by revenue within a date range.
    """
    permission_classes = [IsOwnerOrManager]

    def get(self, request):
        from_dt, to_dt = date_range_from_request(request)
        limit  = int(request.query_params.get("limit", 10))

        data = (
            OrderItem.objects
            .filter(
                order__status=Order.Status.COMPLETED,
                order__created_at__date__gte=from_dt,
                order__created_at__date__lte=to_dt,
            )
            .values("product__id", "product__name", "product__sku")
            .annotate(
                units_sold = Sum("quantity"),
                revenue    = Sum(
                    ExpressionWrapper(
                        F("unit_price") * F("quantity"),
                        output_field=DecimalField(max_digits=14, decimal_places=2),
                    )
                ),
            )
            .order_by("-revenue")[:limit]
        )

        return Response([
            {
                "product_id":  row["product__id"],
                "product_name":row["product__name"],
                "product_sku": row["product__sku"],
                "units_sold":  row["units_sold"],
                "revenue":     float(row["revenue"]),
            }
            for row in data
        ])


class PaymentMethodBreakdownView(APIView):
    """
    GET /reports/payment-methods/
    Revenue split by payment method.
    """
    permission_classes = [IsOwnerOrManager]

    def get(self, request):
        from_dt, to_dt = date_range_from_request(request)
        data = (
            Order.objects
            .filter(status=Order.Status.COMPLETED,
                    created_at__date__gte=from_dt,
                    created_at__date__lte=to_dt)
            .values("payment_method")
            .annotate(
                order_count = Count("id"),
                revenue     = Sum("grand_total"),
            )
            .order_by("-revenue")
        )
        return Response([
            {
                "payment_method": row["payment_method"],
                "order_count":    row["order_count"],
                "revenue":        float(row["revenue"]),
            }
            for row in data
        ])


class InventoryValuationView(APIView):
    """
    GET /reports/inventory-valuation/
    Stock value and margin analysis per product.
    """
    permission_classes = [IsOwnerOrManager]

    def get(self, request):
        products = Product.objects.filter(is_active=True).select_related("category", "brand")
        rows = []
        total_cost_value   = 0
        total_retail_value = 0

        for p in products:
            cost_val   = float(p.cost  * p.stock)
            retail_val = float(p.price * p.stock)
            total_cost_value   += cost_val
            total_retail_value += retail_val
            rows.append({
                "product_id":   p.id,
                "product_name": p.name,
                "sku":          p.sku,
                "category":     p.category.name if p.category else None,
                "stock":        p.stock,
                "cost":         float(p.cost),
                "price":        float(p.price),
                "cost_value":   cost_val,
                "retail_value": retail_val,
                "margin_pct":   p.margin,
                "is_low_stock": p.is_low_stock,
            })

        return Response({
            "summary": {
                "total_cost_value":        round(total_cost_value,   2),
                "total_retail_value":      round(total_retail_value, 2),
                "gross_margin_potential":  round(total_retail_value - total_cost_value, 2),
            },
            "products": rows,
        })


class CustomerAnalyticsView(APIView):
    """
    GET /reports/customer-analytics/
    Customer spending breakdown and tier distribution.
    """
    permission_classes = [IsOwnerOrManager]

    def get(self, request):
        tier_dist = (
            Customer.objects.values("tier")
            .annotate(count=Count("id"))
            .order_by("tier")
        )

        top_customers = (
            Order.objects
            .filter(status=Order.Status.COMPLETED)
            .values("customer__id", "customer__full_name", "customer__tier")
            .annotate(
                total_orders = Count("id"),
                total_spent  = Sum("grand_total"),
            )
            .order_by("-total_spent")[:10]
        )

        return Response({
            "tier_distribution": list(tier_dist),
            "top_customers": [
                {
                    "customer_id":   row["customer__id"],
                    "full_name":     row["customer__full_name"],
                    "tier":          row["customer__tier"],
                    "total_orders":  row["total_orders"],
                    "total_spent":   float(row["total_spent"]),
                }
                for row in top_customers
            ],
        })


class DashboardView(APIView):
    """
    GET /reports/dashboard/
    All KPIs needed for the dashboard in a single call.
    """
    permission_classes = [IsOwnerOrManager]

    def get(self, request):
        from django.db.models import F as DBF
        today      = timezone.now().date()
        month_start = today.replace(day=1)

        completed = Order.objects.filter(status=Order.Status.COMPLETED)

        today_stats = completed.filter(created_at__date=today).aggregate(
            revenue=Sum("grand_total"), orders=Count("id")
        )
        month_stats = completed.filter(created_at__date__gte=month_start).aggregate(
            revenue=Sum("grand_total"), orders=Count("id")
        )

        products     = Product.objects.filter(is_active=True)
        low_stock    = products.filter(stock__lte=DBF("reorder_level"))
        out_of_stock = products.filter(stock=0)

        return Response({
            "today": {
                "revenue": float(today_stats["revenue"] or 0),
                "orders":  today_stats["orders"] or 0,
            },
            "this_month": {
                "revenue": float(month_stats["revenue"] or 0),
                "orders":  month_stats["orders"] or 0,
            },
            "inventory": {
                "total_products":  products.count(),
                "low_stock_count": low_stock.count(),
                "out_of_stock":    out_of_stock.count(),
                "stock_value":     float(sum(p.cost * p.stock for p in products)),
            },
            "customers": {
                "total":   Customer.objects.count(),
                "active":  Customer.objects.filter(is_active=True).count(),
            },
        })
