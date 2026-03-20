import django_filters
from .models import Product


class ProductFilter(django_filters.FilterSet):
    min_price    = django_filters.NumberFilter(field_name="price", lookup_expr="gte")
    max_price    = django_filters.NumberFilter(field_name="price", lookup_expr="lte")
    low_stock    = django_filters.BooleanFilter(method="filter_low_stock")
    category     = django_filters.NumberFilter(field_name="category__id")
    brand        = django_filters.NumberFilter(field_name="brand__id")

    class Meta:
        model  = Product
        fields = ["is_active", "category", "brand", "min_price", "max_price", "low_stock"]

    def filter_low_stock(self, queryset, name, value):
        if value:
            from django.db.models import F
            return queryset.filter(stock__lte=F("reorder_level"))
        return queryset
