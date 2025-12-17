from django.urls import path
from . import views

urlpatterns = [
    path('my-shop/', views.ShopView.as_view(), name='shop_profile'),
    path('my-shop/orders/<int:detail_id>/update/', views.update_order_status, name='update_order_status')
]