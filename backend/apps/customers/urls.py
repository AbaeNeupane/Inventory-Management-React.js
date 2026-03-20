from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = "customers"

router = DefaultRouter()
router.register("", views.CustomerViewSet, basename="customer")

urlpatterns = [path("", include(router.urls))]
