from django.contrib import admin
from django.urls import path, include
from . import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('backend.api_urls')),
    path('user/',include('user.urls')),
    path('', views.home, name='home')
]