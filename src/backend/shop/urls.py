from django.urls import path
from . import views

urlpatterns = [
    path('my-shop/', views.get_shop_info, name='get_shop_info')
]