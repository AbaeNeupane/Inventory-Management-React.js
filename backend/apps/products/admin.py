from django.contrib import admin
from .models import Category, Brand, Product


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display  = ["name", "created_at"]
    search_fields = ["name"]


@admin.register(Brand)
class BrandAdmin(admin.ModelAdmin):
    list_display  = ["name", "created_at"]
    search_fields = ["name"]


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display   = ["name", "sku", "category", "brand", "price", "cost", "stock", "reorder_level", "is_active"]
    list_filter    = ["is_active", "category", "brand"]
    search_fields  = ["name", "sku"]
    ordering       = ["-created_at"]
    readonly_fields = ["created_at", "updated_at"]
    fieldsets = (
        ("Identity",  {"fields": ("name", "sku", "description", "image")}),
        ("Catalogue", {"fields": ("category", "brand", "is_active")}),
        ("Pricing",   {"fields": ("price", "cost", "tax_rate")}),
        ("Stock",     {"fields": ("stock", "reorder_level")}),
        ("Meta",      {"fields": ("created_at", "updated_at"), "classes": ("collapse",)}),
    )
