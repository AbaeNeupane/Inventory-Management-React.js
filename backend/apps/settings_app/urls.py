from django.urls import path
from . import views

app_name = "settings_app"

urlpatterns = [
    path("company/",       views.CompanyProfileView.as_view(),      name="company"),
    path("tax/",           views.TaxConfigView.as_view(),           name="tax"),
    path("notifications/", views.NotificationConfigView.as_view(),  name="notifications"),
]
