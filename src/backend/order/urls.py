from django.urls import path
from . import views

urlpatterns = [
    path('', views.order_api, name = 'order_api'),
    path('<int:order_id>', views.get_order_detail, name = 'get_order_detail'),
    path('my-shop', views.get_shop_order, name = 'get_shop_order')
   ]
