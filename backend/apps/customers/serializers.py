from rest_framework import serializers
from .models import Customer


class CustomerSerializer(serializers.ModelSerializer):
    total_orders = serializers.SerializerMethodField()
    total_spent  = serializers.SerializerMethodField()

    class Meta:
        model  = Customer
        fields = [
            "id", "full_name", "phone", "email", "address",
            "tier", "notes", "is_active",
            "total_orders", "total_spent",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "tier", "created_at", "updated_at"]

    def get_total_orders(self, obj):
        return obj.orders.filter(status="completed").count()

    def get_total_spent(self, obj):
        from django.db.models import Sum
        result = obj.orders.filter(status="completed").aggregate(s=Sum("grand_total"))["s"]
        return float(result) if result else 0.0


class CustomerWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Customer
        fields = ["full_name", "phone", "email", "address", "notes", "is_active"]
