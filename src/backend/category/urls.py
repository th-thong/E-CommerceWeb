from django.urls import path
from . import views

urlpatterns = [
    path('', views.get_category_list, name='get_category_list')
]