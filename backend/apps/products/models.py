from django.db import models
from django.core.validators import MinValueValidator


class Category(models.Model):
    name       = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table  = "products_category"
        ordering  = ["name"]
        verbose_name_plural = "categories"

    def __str__(self):
        return self.name


class Brand(models.Model):
    name       = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "products_brand"
        ordering = ["name"]

    def __str__(self):
        return self.name


class Product(models.Model):
    name          = models.CharField(max_length=255)
    sku           = models.CharField(max_length=100, unique=True)
    description   = models.TextField(blank=True)
    category      = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name="products")
    brand         = models.ForeignKey(Brand, on_delete=models.SET_NULL, null=True, blank=True, related_name="products")
    price         = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])
    cost          = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])
    tax_rate      = models.DecimalField(max_digits=5, decimal_places=2, default=13.00)
    stock         = models.PositiveIntegerField(default=0)
    reorder_level = models.PositiveIntegerField(default=10)
    image         = models.ImageField(upload_to="products/", blank=True, null=True)
    is_active     = models.BooleanField(default=True)
    created_at    = models.DateTimeField(auto_now_add=True)
    updated_at    = models.DateTimeField(auto_now=True)

    class Meta:
        db_table  = "products_product"
        ordering  = ["-created_at"]

    def __str__(self):
        return f"{self.name} ({self.sku})"

    @property
    def is_low_stock(self):
        return self.stock <= self.reorder_level

    @property
    def stock_value(self):
        return self.cost * self.stock

    @property
    def margin(self):
        if self.price > 0:
            return round(((self.price - self.cost) / self.price) * 100, 2)
        return 0
