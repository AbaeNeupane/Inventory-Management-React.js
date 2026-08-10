from rest_framework.permissions import BasePermission
from apps.accounts.models import User


class IsBranchManager(BasePermission):
    """
    Only Owner or Manager can manage branches.
    Cashiers have read-only access to their own branch info.
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.method in ("GET", "HEAD", "OPTIONS"):
            return True
        return request.user.role in (User.Role.OWNER, User.Role.MANAGER)