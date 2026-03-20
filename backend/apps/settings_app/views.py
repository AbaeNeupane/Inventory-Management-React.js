from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from apps.accounts.permissions import IsOwner
from .models import CompanyProfile, TaxConfig, NotificationConfig
from .serializers import (
    CompanyProfileSerializer,
    TaxConfigSerializer,
    NotificationConfigSerializer,
)


class CompanyProfileView(generics.RetrieveUpdateAPIView):
    """
    GET  /settings/company/  — retrieve company profile
    PATCH /settings/company/ — update company profile (Owner only)
    """
    serializer_class = CompanyProfileSerializer

    def get_permissions(self):
        if self.request.method in ("PUT", "PATCH"):
            return [IsOwner()]
        return [IsAuthenticated()]

    def get_object(self):
        return CompanyProfile.get_solo()


class TaxConfigView(generics.RetrieveUpdateAPIView):
    """
    GET  /settings/tax/  — retrieve tax configuration
    PATCH /settings/tax/ — update tax configuration (Owner only)
    """
    serializer_class = TaxConfigSerializer

    def get_permissions(self):
        if self.request.method in ("PUT", "PATCH"):
            return [IsOwner()]
        return [IsAuthenticated()]

    def get_object(self):
        return TaxConfig.get_solo()


class NotificationConfigView(generics.RetrieveUpdateAPIView):
    """
    GET  /settings/notifications/  — retrieve notification preferences
    PATCH /settings/notifications/ — update notification preferences (Owner only)
    """
    serializer_class = NotificationConfigSerializer

    def get_permissions(self):
        if self.request.method in ("PUT", "PATCH"):
            return [IsOwner()]
        return [IsAuthenticated()]

    def get_object(self):
        return NotificationConfig.get_solo()
