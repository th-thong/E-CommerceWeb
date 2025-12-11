from django.urls import path
from . import views

urlpatterns = [
    path('', views.handle_feedback, name="feedback_api"),
]