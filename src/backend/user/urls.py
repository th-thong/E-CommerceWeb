from django.urls import path
from . import views

urlpatterns = [
    path('me/', views.get_user_profile, name='user-profile'),
    path('me/', views.change_user_profile, name='change-user-profile')

]