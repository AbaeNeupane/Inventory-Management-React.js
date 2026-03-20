from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

app_name = "accounts"

router = DefaultRouter()
router.register("users", views.UserViewSet, basename="user")

urlpatterns = [
    path("login/",           views.LoginView.as_view(),          name="login"),
    path("logout/",          views.LogoutView.as_view(),         name="logout"),
    path("token/refresh/",   TokenRefreshView.as_view(),         name="token_refresh"),
    path("me/",              views.MeView.as_view(),             name="me"),
    path("change-password/", views.ChangePasswordView.as_view(), name="change_password"),
    path("",                 include(router.urls)),
]
