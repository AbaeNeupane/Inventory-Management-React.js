from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator


class Supplier(models.Model):
    class PaymentTerms(models.TextChoices):
        COD    = "cod",    "Cash on Delivery"
        NET_15 = "net15",  "Net 15"
        NET_30 = "net30",  "Net 30"
        NET_45 = "net45",  "Net 45"
        NET_60 = "net60",  "Net 60"

    name          = models.CharField(max_length=255)
    contact_name  = models.CharField(max_length=150, blank=True)
    phone         = models.CharField(max_length=20,  blank=True)
    email         = models.EmailField(blank=True)
    address       = models.TextField(blank=True)
    category      = models.ForeignKey(
        "products.Category",
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="suppliers",
    )
    payment_terms = models.CharField(
        max_length=10, choices=PaymentTerms.choices, default=PaymentTerms.NET_30
    )
    rating        = models.PositiveSmallIntegerField(
        default=3,
        validators=[MinValueValidator(1), MaxValueValidator(5)],
    )
    outstanding   = models.DecimalField(
        max_digits=14, decimal_places=2, default=0,
        validators=[MinValueValidator(0)],
        help_text="Current outstanding payable amount (Rs).",
    )
    notes         = models.TextField(blank=True)
    is_active     = models.BooleanField(default=True)
    created_at    = models.DateTimeField(auto_now_add=True)
    updated_at    = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "suppliers_supplier"
        ordering = ["name"]

    def __str__(self):
        return self.name


class PurchaseOrder(models.Model):
    class Status(models.TextChoices):
        DRAFT     = "draft",     "Draft"
        ORDERED   = "ordered",   "Ordered"
        RECEIVED  = "received",  "Received"
        CANCELLED = "cancelled", "Cancelled"

    supplier    = models.ForeignKey(Supplier, on_delete=models.PROTECT, related_name="purchase_orders")
    status      = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    notes       = models.TextField(blank=True)
    ordered_at  = models.DateTimeField(null=True, blank=True)
    received_at = models.DateTimeField(null=True, blank=True)
    created_by  = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, null=True, related_name="purchase_orders"
    )
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "suppliers_purchaseorder"
        ordering = ["-created_at"]

    def __str__(self):
        return f"PO-{self.pk} | {self.supplier.name} [{self.status}]"

    @property
    def total(self):
        return sum(item.line_total for item in self.items.all())


class PurchaseOrderItem(models.Model):
    order      = models.ForeignKey(PurchaseOrder, on_delete=models.CASCADE, related_name="items")
    product    = models.ForeignKey("products.Product", on_delete=models.PROTECT, related_name="po_items")
    quantity   = models.PositiveIntegerField()
    unit_cost  = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])

    class Meta:
        db_table = "suppliers_purchaseorderitem"

    def __str__(self):
        return f"{self.product.name} x{self.quantity}"

    @property
    def line_total(self):
        return self.unit_cost * self.quantity
