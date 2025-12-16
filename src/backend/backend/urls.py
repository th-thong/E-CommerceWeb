from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from django.conf import settings
from django.conf.urls.static import static
from product import admin_views as pav
from feedback import admin_views as fav
from user import admin_views as uav

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('backend.api_urls')),
    path('shopadmin/banned-feedback/<int:product_id>/', fav.get_feedback, name="get_feedback"),
    path('shopadmin/approve-feedback/<int:feedback_id>/', fav.approve_feedback, name="approve_feedback"),
    path('shopadmin/product-list', pav.get_products, name='admin-product-list'),
    path('shopadmin/product/<int:product_id>/', pav.handle_admin_product_api, name='admin-product-get-detail-and-update'),
    path('shopadmin/users', uav.get_users, name='get_users'),
    path('shopadmin/pendingusers', uav.get_pending_users, name='get_pending_user'),
    path('shopadmin/user/<int:user_id>/', uav.handle_admin_user_api, name='handle_admin_user_api'),
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

