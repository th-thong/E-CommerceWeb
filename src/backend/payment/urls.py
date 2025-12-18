from django.urls import path
from .vnpay_view import (
    VNPAYCreatePaymentView, 
    VNPAYIPNView, 
    VNPAYReturnView, 
    VNPAYQueryView
)
from .cod_view import cod

urlpatterns = [
    path('vnpay/create-payment-url/', VNPAYCreatePaymentView.as_view(), name='vnpay_create_url'),
    path('vnpay_ipn/', VNPAYIPNView.as_view(), name='vnpay_ipn'),
    path('vnpay/return/', VNPAYReturnView.as_view(), name='vnpay_return'),
    path('vnpay/query/', VNPAYQueryView.as_view(), name='vnpay_query'),
    path('cod/',cod,name='cod')
]