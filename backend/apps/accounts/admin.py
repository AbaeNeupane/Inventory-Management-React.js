from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display  = ["email", "full_name", "role", "is_active", "is_staff", "created_at"]
    list_filter   = ["role", "is_active", "is_staff"]
    search_fields = ["email", "full_name"]
    ordering      = ["full_name"]

    fieldsets = (
        (None,           {"fields": ("email", "password")}),
        ("Personal",     {"fields": ("full_name",)}),
        ("Role",         {"fields": ("role",)}),
        ("Permissions",  {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
        ("Timestamps",   {"fields": ("last_login", "created_at"), "classes": ("collapse",)}),
    )
    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields":  ("email", "full_name", "role", "password1", "password2"),
        }),
    )
    readonly_fields = ["last_login", "created_at"]
