from django.urls import path
from . import views

urlpatterns = [
    path('shops/my-shop/', views.get, name='user-profile')
]