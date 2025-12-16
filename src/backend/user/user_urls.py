from django.urls import path
from . import views, admin_views

urlpatterns = [
    path('me/', views.user_profile, name='user_profile'),
]
