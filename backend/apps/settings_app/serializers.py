from rest_framework import serializers
from .models import CompanyProfile, TaxConfig, NotificationConfig


class CompanyProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model  = CompanyProfile
        fields = [
            "id", "name", "tagline", "address", "phone", "email",
            "website", "pan_no", "vat_no", "currency", "logo", "updated_at",
        ]
        read_only_fields = ["id", "updated_at"]


class TaxConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model  = TaxConfig
        fields = [
            "id", "default_vat_rate", "vat_enabled",
            "pan_on_receipt", "vat_on_receipt", "tax_inclusive", "updated_at",
        ]
        read_only_fields = ["id", "updated_at"]


class NotificationConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model  = NotificationConfig
        fields = [
            "id", "low_stock_alert", "low_stock_email",
            "daily_report", "daily_report_email",
            "order_confirm", "updated_at",
        ]
        read_only_fields = ["id", "updated_at"]
