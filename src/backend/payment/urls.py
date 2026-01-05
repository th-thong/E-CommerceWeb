from django.urls import path
from .online_providers.vnpay.views import (
    VNPAYIPNView, 
    VNPAYReturnView, 
    VNPAYQueryView
)
from .cod.views import cod

urlpatterns = [
    path('vnpay_ipn/', VNPAYIPNView.as_view(), name='vnpay_ipn'),
    path('vnpay/return/', VNPAYReturnView.as_view(), name='vnpay_return'),
    path('vnpay/query/', VNPAYQueryView.as_view(), name='vnpay_query'),
    path('cod/',cod,name='cod')
]