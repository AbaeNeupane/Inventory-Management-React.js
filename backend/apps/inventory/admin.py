from django.contrib import admin
from .models import StockAdjustment


@admin.register(StockAdjustment)
class StockAdjustmentAdmin(admin.ModelAdmin):
    list_display  = ["product", "delta", "reason", "adjusted_by", "created_at"]
    list_filter   = ["reason"]
    search_fields = ["product__name", "product__sku"]
    readonly_fields = ["created_at"]

    def has_delete_permission(self, request, obj=None):
        return False  # audit records are immutable
