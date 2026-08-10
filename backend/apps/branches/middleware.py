import logging
from .models import Branch

logger = logging.getLogger(__name__)


class BranchMiddleware:
    """
    Injects request.branch based on the authenticated user:

    - Cashier      → locked to their assigned branch
    - Manager/Owner → can pass ?branch_id=X to scope to one branch,
                       or omit it to see all branches (request.branch = None)

    Must be placed AFTER AuthenticationMiddleware in settings.MIDDLEWARE.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request.branch = None  # safe default

        user = getattr(request, "user", None)
        if user is None or not user.is_authenticated:
            return self.get_response(request)

        if user.role == "cashier":
            # Cashier is always locked to their branch
            request.branch = getattr(user, "branch", None)
            if request.branch is None:
                logger.warning(
                    "Cashier user %s has no branch assigned.", user.email
                )

        else:
            # Manager / Owner — optional branch scoping
            branch_id = request.GET.get("branch_id")
            if branch_id:
                try:
                    request.branch = Branch.objects.get(
                        pk=int(branch_id), is_active=True
                    )
                except (Branch.DoesNotExist, ValueError, TypeError):
                    logger.warning(
                        "Invalid branch_id=%s requested by user %s.",
                        branch_id,
                        user.email,
                    )
                    request.branch = None

        return self.get_response(request)