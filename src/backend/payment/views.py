from rest_framework.views import APIView
from rest_framework.response import Response
from django.conf import settings
from .payment_provider.vnpay import VNPAY
from datetime import datetime
import uuid

class Payment(APIView):
    def post(self, request):
        pass

class PaymentReturnView(APIView):
    def get(self, request):
        pass

