from django.urls import path
from . import views

urlpatterns = [
    path('my-shop/', views.ShopView.as_view(), name='shop_profile'),
]