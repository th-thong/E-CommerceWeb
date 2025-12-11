from django.urls import path, include
from . import views

urlpatterns = [
    path('public/list/', views.get_list_of_public_product, name='public-product-list'),
    path('public/<int:product_id>/', views.get_public_product_detail, name='public-product-detail'),
    path('public/trendy/', views.get_trendy_product, name='public-product-trendy'),
    path('public/flash-sale/', views.get_flashsale_product, name='public-product-flashsale'),
    path('public/recommend/', views.get_recommend_product, name='public-product-recommend'),
    path('seller/my-products/', views.SellerProductListCreateView.as_view(), name='seller-product-list-create'),
    path('seller/my-products/<int:product_id>/', views.SellerProductDetailView.as_view(), name='seller-product-detail'),
]