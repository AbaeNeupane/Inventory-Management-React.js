from django.db import models


class Branch(models.Model):
    """
    Represents a physical store location (e.g. Kathmandu, Pokhara).
    All operational data (orders, stock, adjustments) is scoped to a branch.
    """
    name       = models.CharField(max_length=255, unique=True)
    address    = models.TextField(blank=True)
    phone      = models.CharField(max_length=20, blank=True)
    email      = models.EmailField(blank=True)
    is_active  = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table  = "branches_branch"
        ordering  = ["name"]
        verbose_name_plural = "branches"

    def __str__(self):
        return self.name