from django.urls import path
from . import views

urlpatterns = [
    path('public/list/', views.get_list_of_public_product, name='get_list_of_public_product'),
    path('public/<int:product_id>/', views.get_public_product_detail, name='get_public_product_detail'),
    path('private/list-and-create/', views.SellerProductListCreateView.as_view(), name='manage_private_product'),
    path('private/detail-and-mng/', views.SellerProductDetailView.as_view(), name='manage_private_detail'),
]