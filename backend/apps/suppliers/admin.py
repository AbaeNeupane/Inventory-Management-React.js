from django.contrib import admin
from .models import Supplier, PurchaseOrder, PurchaseOrderItem


@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display  = ["name", "contact_name", "phone", "category", "payment_terms", "rating", "outstanding", "is_active"]
    list_filter   = ["is_active", "payment_terms", "category"]
    search_fields = ["name", "contact_name", "email"]
    readonly_fields = ["created_at", "updated_at"]


class PurchaseOrderItemInline(admin.TabularInline):
    model  = PurchaseOrderItem
    extra  = 1
    fields = ["product", "quantity", "unit_cost"]


@admin.register(PurchaseOrder)
class PurchaseOrderAdmin(admin.ModelAdmin):
    list_display  = ["__str__", "supplier", "status", "created_by", "created_at"]
    list_filter   = ["status"]
    search_fields = ["supplier__name"]
    inlines       = [PurchaseOrderItemInline]
    readonly_fields = ["created_at", "updated_at"]
