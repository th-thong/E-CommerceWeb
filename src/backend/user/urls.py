from django.urls import path
from . import views

urlpatterns = [
    # GET /api/user/me/
    path('user/me/', views.get_user_profile, name='user-profile')
]