from django.urls import path
from . import views, admin_views

urlpatterns = [
    path('<int:product_id>/', views.handle_feedback, name="feedback_api"),
    path('<int:product_id>/<int:feedback_id>/', views.handle_reply, name="reply-api")
]