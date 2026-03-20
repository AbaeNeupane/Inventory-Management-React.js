from rest_framework.permissions import BasePermission
from .models import User


class IsOwner(BasePermission):
    """Only Owner-role users."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == User.Role.OWNER


class IsOwnerOrManager(BasePermission):
    """Owner or Manager role."""
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role in (User.Role.OWNER, User.Role.MANAGER)
        )


class IsOwnerOrManagerOrReadOnly(BasePermission):
    """Cashiers can read; managers/owners can write."""
    SAFE_METHODS = ("GET", "HEAD", "OPTIONS")

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.method in self.SAFE_METHODS:
            return True
        return request.user.role in (User.Role.OWNER, User.Role.MANAGER)
