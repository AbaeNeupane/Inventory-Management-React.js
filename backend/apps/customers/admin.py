from django.contrib import admin
from .models import Customer


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display   = ["full_name", "phone", "email", "tier", "is_active", "created_at"]
    list_filter    = ["tier", "is_active"]
    search_fields  = ["full_name", "phone", "email"]
    readonly_fields = ["created_at", "updated_at"]
