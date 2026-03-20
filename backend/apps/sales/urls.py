from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = "sales"

router = DefaultRouter()
router.register("orders", views.OrderViewSet, basename="order")

urlpatterns = [path("", include(router.urls))]
