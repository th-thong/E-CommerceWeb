from django.urls import path
from . import views

urlpatterns = [
    path('register/',views.register, name='user_register'),
    path('login/',views.login,name='user_login'),
    path('forgot-password/', views.ForgotPasswordView.as_view(), name='forgot_password'),
    path('reset-password/', views.ResetPasswordView.as_view(), name='reset_password'),
]