from django.urls import path
from . import views

urlpatterns = [
    path('<int:product_id>/', views.handle_feedback, name="feedback_api"),
]