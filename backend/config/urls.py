from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)

api = "api/v1/"

urlpatterns = [
    # Django admin
    path("admin/", admin.site.urls),

    # OpenAPI schema + docs
    path(f"{api}schema/", SpectacularAPIView.as_view(), name="schema"),
    path(f"{api}docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path(f"{api}redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),

    # App routers
    path(f"{api}auth/",       include("apps.accounts.urls",     namespace="accounts")),
    path(f"{api}products/",   include("apps.products.urls",     namespace="products")),
    path(f"{api}inventory/",  include("apps.inventory.urls",    namespace="inventory")),
    path(f"{api}customers/",  include("apps.customers.urls",    namespace="customers")),
    path(f"{api}suppliers/",  include("apps.suppliers.urls",    namespace="suppliers")),
    path(f"{api}sales/",      include("apps.sales.urls",        namespace="sales")),
    path(f"{api}reports/",    include("apps.reports.urls",      namespace="reports")),
    path(f"{api}settings/",   include("apps.settings_app.urls", namespace="settings_app")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
