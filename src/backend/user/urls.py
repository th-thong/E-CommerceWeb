from django.urls import path
from . import views

urlpatterns = [
    path('user/',views.get_user_list,name='get_user_list'),
]
