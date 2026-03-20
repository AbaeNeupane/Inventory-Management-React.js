from django.contrib import admin
from .models import CompanyProfile, TaxConfig, NotificationConfig


@admin.register(CompanyProfile)
class CompanyProfileAdmin(admin.ModelAdmin):
    list_display  = ["name", "phone", "email", "currency", "updated_at"]
    readonly_fields = ["updated_at"]

    def has_add_permission(self, request):
        return not CompanyProfile.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(TaxConfig)
class TaxConfigAdmin(admin.ModelAdmin):
    list_display  = ["default_vat_rate", "vat_enabled", "tax_inclusive", "updated_at"]
    readonly_fields = ["updated_at"]

    def has_add_permission(self, request):
        return not TaxConfig.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(NotificationConfig)
class NotificationConfigAdmin(admin.ModelAdmin):
    list_display  = ["low_stock_alert", "daily_report", "order_confirm", "updated_at"]
    readonly_fields = ["updated_at"]

    def has_add_permission(self, request):
        return not NotificationConfig.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False
