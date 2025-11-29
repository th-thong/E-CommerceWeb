from django.urls import path
from .views import (
    VNPAYCreatePaymentView, 
    VNPAYIPNView, 
    VNPAYReturnView, 
    VNPAYQueryView
)

urlpatterns = [
    path('vnpay/create-payment-url/', VNPAYCreatePaymentView.as_view(), name='vnpay_create_url'),
    path('vnpay/ipn/', VNPAYIPNView.as_view(), name='vnpay_ipn'),
    path('vnpay/return/', VNPAYReturnView.as_view(), name='vnpay_return'),
    path('vnpay/query/', VNPAYQueryView.as_view(), name='vnpay_query'),
]