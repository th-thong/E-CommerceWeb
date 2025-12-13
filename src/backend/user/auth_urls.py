from django.urls import path
from . import views
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('register/',views.register, name='user_register'),
    path('login/',views.login,name='user_login'),
    path('forgot-password/', views.ForgotPasswordView.as_view(), name='forgot_password'),
    path('reset-password/', views.ResetPasswordView.as_view(), name='reset_password'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh')
]