from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema, extend_schema_view

from apps.accounts.permissions import IsOwner, IsOwnerOrManager
from .models import Branch
from .serializers import BranchSerializer, BranchWriteSerializer
from .permissions import IsBranchManager


@extend_schema_view(
    list=extend_schema(summary="List all branches"),
    create=extend_schema(summary="Create a new branch"),
    retrieve=extend_schema(summary="Get a branch"),
    update=extend_schema(summary="Update a branch"),
    destroy=extend_schema(summary="Delete a branch"),
)
class BranchViewSet(viewsets.ModelViewSet):
    """
    CRUD for branches.
    - Owner/Manager: full access
    - Cashier: read-only (their own branch)
    """
    queryset           = Branch.objects.all()
    permission_classes = [IsAuthenticated, IsBranchManager]
    search_fields      = ["name", "address", "email", "phone"]
    filterset_fields   = ["is_active"]
    ordering_fields    = ["name", "created_at"]

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return BranchWriteSerializer
        return BranchSerializer

    def get_queryset(self):
        user = self.request.user
        # Cashier can only see their own branch
        if user.role == "cashier" and user.branch:
            return Branch.objects.filter(pk=user.branch.pk)
        return Branch.objects.all()

    def destroy(self, request, *args, **kwargs):
        branch = self.get_object()
        # Prevent deleting a branch that has users assigned
        if branch.users.filter(is_active=True).exists():
            return Response(
                {
                    "detail": (
                        "Cannot delete a branch with active users. "
                        "Reassign or deactivate users first."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        return super().destroy(request, *args, **kwargs)

    @action(
        detail=True,
        methods=["get"],
        url_path="users",
        permission_classes=[IsOwnerOrManager],
    )
    def users(self, request, pk=None):
        """GET /branches/{id}/users/ — list users assigned to this branch."""
        branch = self.get_object()
        from apps.accounts.serializers import UserSerializer
        users = branch.users.all()
        return Response(UserSerializer(users, many=True).data)

    @action(
        detail=True,
        methods=["post"],
        url_path="deactivate",
        permission_classes=[IsOwner],
    )
    def deactivate(self, request, pk=None):
        """POST /branches/{id}/deactivate/ — soft-disable a branch."""
        branch = self.get_object()
        branch.is_active = False
        branch.save(update_fields=["is_active"])
        return Response(
            {"detail": f"Branch '{branch.name}' has been deactivated."}
        )

    @action(
        detail=True,
        methods=["post"],
        url_path="activate",
        permission_classes=[IsOwner],
    )
    def activate(self, request, pk=None):
        """POST /branches/{id}/activate/ — re-enable a branch."""
        branch = self.get_object()
        branch.is_active = True
        branch.save(update_fields=["is_active"])
        return Response(
            {"detail": f"Branch '{branch.name}' has been activated."}
        )