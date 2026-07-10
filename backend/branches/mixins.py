class BranchScopedMixin:
    """
    Mixin for ViewSets that need branch-aware querysets.

    Usage:
        class OrderViewSet(BranchScopedMixin, viewsets.ModelViewSet):
            def get_queryset(self):
                return self.filter_by_branch(
                    Order.objects.select_related("branch")
                )
    """
    branch_field = "branch"  # override if the FK has a different name

    def filter_by_branch(self, queryset):
        branch = getattr(self.request, "branch", None)
        if branch is not None:
            return queryset.filter(**{self.branch_field: branch})
        return queryset

    def get_branch(self):
        """Returns current branch or raises if cashier has none."""
        branch = getattr(self.request, "branch", None)
        if self.request.user.role == "cashier" and branch is None:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied(
                "Your account is not assigned to a branch. "
                "Contact your administrator."
            )
        return branch