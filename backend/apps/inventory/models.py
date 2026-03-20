from django.db import models
from django.conf import settings


class StockAdjustment(models.Model):
    """Audit log for every stock change (manual or from a sale)."""

    class Reason(models.TextChoices):
        MANUAL     = "manual",     "Manual Adjustment"
        SALE       = "sale",       "Sale"
        PURCHASE   = "purchase",   "Purchase / Restock"
        RETURN     = "return",     "Customer Return"
        DAMAGE     = "damage",     "Damage / Write-off"
        CORRECTION = "correction", "Stock Correction"

    product     = models.ForeignKey(
        "products.Product",
        on_delete=models.CASCADE,
        related_name="stock_adjustments",
    )
    delta       = models.IntegerField(help_text="Positive = stock in, negative = stock out")
    reason      = models.CharField(max_length=50, choices=Reason.choices, default=Reason.MANUAL)
    note        = models.TextField(blank=True)
    adjusted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="stock_adjustments",
    )
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "inventory_stockadjustment"
        ordering = ["-created_at"]

    def __str__(self):
        direction = "+" if self.delta >= 0 else ""
        return f"{self.product.name}: {direction}{self.delta} ({self.reason})"
