from django.db import models


class CompanyProfile(models.Model):
    """Singleton — only ever one row."""
    name              = models.CharField(max_length=255, default="My Store")
    tagline           = models.CharField(max_length=255, blank=True)
    address           = models.TextField(blank=True)
    phone             = models.CharField(max_length=30, blank=True)
    email             = models.EmailField(blank=True)
    website           = models.URLField(blank=True)
    pan_no            = models.CharField(max_length=20, blank=True, verbose_name="PAN Number")
    vat_no            = models.CharField(max_length=20, blank=True, verbose_name="VAT Number")
    currency          = models.CharField(max_length=10, default="NPR")
    logo              = models.ImageField(upload_to="company/", blank=True, null=True)
    updated_at        = models.DateTimeField(auto_now=True)

    class Meta:
        db_table    = "settings_companyprofile"
        verbose_name        = "Company Profile"
        verbose_name_plural = "Company Profile"

    def __str__(self):
        return self.name

    @classmethod
    def get_solo(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj


class TaxConfig(models.Model):
    """Singleton tax configuration."""
    default_vat_rate  = models.DecimalField(max_digits=5, decimal_places=2, default=13.00)
    vat_enabled       = models.BooleanField(default=True)
    pan_on_receipt    = models.BooleanField(default=True)
    vat_on_receipt    = models.BooleanField(default=True)
    tax_inclusive     = models.BooleanField(
        default=False,
        help_text="If True, prices include tax; otherwise tax is added on top.",
    )
    updated_at        = models.DateTimeField(auto_now=True)

    class Meta:
        db_table    = "settings_taxconfig"
        verbose_name        = "Tax Configuration"
        verbose_name_plural = "Tax Configuration"

    def __str__(self):
        return f"Tax Config (VAT {self.default_vat_rate}%)"

    @classmethod
    def get_solo(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj


class NotificationConfig(models.Model):
    """Singleton notification preferences."""
    low_stock_alert   = models.BooleanField(default=True)
    low_stock_email   = models.EmailField(blank=True)
    daily_report      = models.BooleanField(default=False)
    daily_report_email= models.EmailField(blank=True)
    order_confirm     = models.BooleanField(default=True)
    updated_at        = models.DateTimeField(auto_now=True)

    class Meta:
        db_table    = "settings_notificationconfig"
        verbose_name        = "Notification Config"
        verbose_name_plural = "Notification Config"

    def __str__(self):
        return "Notification Settings"

    @classmethod
    def get_solo(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj
