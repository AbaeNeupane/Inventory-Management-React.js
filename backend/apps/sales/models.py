from django.db import models
from django.core.validators import MinValueValidator


class Order(models.Model):
    class Status(models.TextChoices):
        PENDING   = "pending",   "Pending"
        COMPLETED = "completed", "Completed"
        REFUNDED  = "refunded",  "Refunded"
        CANCELLED = "cancelled", "Cancelled"

    class PaymentMethod(models.TextChoices):
        CASH       = "cash",        "Cash"
        CARD       = "card",        "Card"
        ESEWA      = "esewa",       "eSewa"
        KHALTI     = "khalti",      "Khalti"
        BANK       = "bank",        "Bank Transfer"
        CREDIT     = "credit",      "Store Credit"

    customer       = models.ForeignKey(
        "customers.Customer",
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="orders",
    )
    status         = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    payment_method = models.CharField(max_length=20, choices=PaymentMethod.choices, default=PaymentMethod.CASH)
    subtotal       = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    discount       = models.DecimalField(max_digits=14, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    tax_total      = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    grand_total    = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    amount_paid    = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    change_due     = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    notes          = models.TextField(blank=True)
    cashier        = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        related_name="orders_as_cashier",
    )
    created_at     = models.DateTimeField(auto_now_add=True)
    updated_at     = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "sales_order"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Order #{self.pk} [{self.status}]"

    def calculate_totals(self):
        """Recalculate subtotal, tax_total and grand_total from line items."""
        subtotal  = sum(item.line_total for item in self.items.all())
        tax_total = sum(item.tax_amount  for item in self.items.all())
        self.subtotal   = subtotal
        self.tax_total  = tax_total
        self.grand_total = max(subtotal + tax_total - self.discount, 0)
        self.change_due  = max(self.amount_paid - self.grand_total, 0)


class OrderItem(models.Model):
    order     = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    product   = models.ForeignKey("products.Product", on_delete=models.PROTECT, related_name="order_items")
    quantity  = models.PositiveIntegerField()
    unit_price= models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])
    tax_rate  = models.DecimalField(max_digits=5,  decimal_places=2, default=0)

    class Meta:
        db_table = "sales_orderitem"

    def __str__(self):
        return f"{self.product.name} x{self.quantity}"

    @property
    def line_total(self):
        return self.unit_price * self.quantity

    @property
    def tax_amount(self):
        return (self.line_total * self.tax_rate) / 100
