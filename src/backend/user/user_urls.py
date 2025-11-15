from django.urls import path
from . import views

urlpatterns = [
    path('me/', views.user_profile_view, name='user_profile'),
]
