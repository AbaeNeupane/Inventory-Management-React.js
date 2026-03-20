from django.contrib import admin
from .models import Order, OrderItem


class OrderItemInline(admin.TabularInline):
    model         = OrderItem
    extra         = 0
    readonly_fields = ["line_total", "tax_amount"]
    fields        = ["product", "quantity", "unit_price", "tax_rate", "line_total", "tax_amount"]

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display    = ["id", "customer", "status", "payment_method", "grand_total", "cashier", "created_at"]
    list_filter     = ["status", "payment_method"]
    search_fields   = ["customer__full_name", "cashier__full_name"]
    readonly_fields = ["subtotal", "tax_total", "grand_total", "change_due", "created_at", "updated_at"]
    inlines         = [OrderItemInline]

    def has_delete_permission(self, request, obj=None):
        return False

    def has_change_permission(self, request, obj=None):
        return False
