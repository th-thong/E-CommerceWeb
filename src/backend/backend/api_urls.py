from django.urls import path, include

urlpatterns = [
    path('users/', include('user.user_urls')),
    path('shops/', include('shop.urls')),
    path('categories/',include('category.urls')),
    path('auth/', include('user.auth_urls')),
    path('products/', include('product.urls'))
]