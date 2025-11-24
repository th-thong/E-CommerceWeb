from django.urls import path
from . import views

urlpatterns = [
    path('public/list/', views.get_list_of_public_product, name='get_list_of_public_product'),
    path('public/<int:product_id>/', views.get_public_product_detail, name='get_public_product_detail'),
    path('private/list/', views.get_list_of_private_product, name='get_list_of_private_product'),
    path('private/', views.PrivateProduct.as_view(), name='private_product'),
]