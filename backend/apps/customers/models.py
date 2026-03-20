from django.db import models
from django.core.validators import RegexValidator


class Customer(models.Model):
    class Tier(models.TextChoices):
        BRONZE   = "bronze",   "Bronze"
        SILVER   = "silver",   "Silver"
        GOLD     = "gold",     "Gold"
        PLATINUM = "platinum", "Platinum"

    full_name  = models.CharField(max_length=200)
    phone      = models.CharField(
        max_length=20,
        blank=True,
        validators=[RegexValidator(r"^\+?[\d\s\-]{7,20}$", "Enter a valid phone number.")],
    )
    email      = models.EmailField(blank=True)
    address    = models.TextField(blank=True)
    tier       = models.CharField(max_length=20, choices=Tier.choices, default=Tier.BRONZE)
    notes      = models.TextField(blank=True)
    is_active  = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "customers_customer"
        ordering = ["full_name"]

    def __str__(self):
        return self.full_name

    def recalculate_tier(self):
        """Auto-upgrade tier based on lifetime spend from completed sales."""
        from apps.sales.models import Order
        total = (
            Order.objects.filter(customer=self, status=Order.Status.COMPLETED)
            .aggregate(s=models.Sum("grand_total"))["s"]
            or 0
        )
        if total >= 100_000:
            self.tier = self.Tier.PLATINUM
        elif total >= 30_000:
            self.tier = self.Tier.GOLD
        elif total >= 10_000:
            self.tier = self.Tier.SILVER
        else:
            self.tier = self.Tier.BRONZE
        self.save(update_fields=["tier"])
