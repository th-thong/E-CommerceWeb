import hashlib
import hmac
import urllib.parse
from django.conf import settings
from payment.payment_interface import PaymentProvider
import pytz
from datetime import datetime, timedelta
from payment.utils import get_client_ip
from payment.models import PaymentTransaction


class VNPAYProvider(PaymentProvider):

    def __init__(self):
        self.requestData = {}
        self.responseData = {}
        self.vnpay_payment_url=settings.VNPAY_PAYMENT_URL
        self.secret_key = settings.SECRET_KEY

    def save_transaction(self, order, payment_type):
        PaymentTransaction.objects.update_or_create(
            transaction_no=str(order.id),
            defaults={
                'order': order,
                'amount': order.total_price,
                'raw_response': self.responseData,
                'status': PaymentTransaction.PaymentStatus.PENDING,
                'payment_source': payment_type
            }
        )


    def get_payment_url(self,order, request):
        """
        Tạo URL thanh toán
        """
        vnp_params = {}

        # 1. Cấu hình các tham số cơ bản của VNPAY
        vnp_params['vnp_Version'] = '2.1.0'
        vnp_params['vnp_Command'] = 'pay'
        vnp_params['vnp_TmnCode'] = settings.VNPAY_TMN_CODE
        vnp_params['vnp_Amount'] = int(order.total_price * 100) # VNPAY dùng đơn vị xu (vnđ * 100)
        vnp_params['vnp_CurrCode'] = 'VND'
        vnp_params['vnp_TxnRef'] = str(order.id)
        vnp_params['vnp_OrderInfo'] = f"Thanh toan don hang {order.id}"
        vnp_params['vnp_OrderType'] = 'billpayment'
        vnp_params['vnp_Locale'] = 'vn'
        vnp_params['vnp_ReturnUrl'] = settings.VNPAY_RETURN_URL

        # 2. Cấu hình thời gian (Tạo & Hết hạn)
        tz_vietnam = pytz.timezone('Asia/Ho_Chi_Minh')
        curr_date = datetime.now(tz_vietnam)
        vnp_params['vnp_CreateDate'] = curr_date.strftime('%Y%m%d%H%M%S')
        
        expire_date = curr_date + timedelta(minutes=15)
        vnp_params['vnp_ExpireDate'] = expire_date.strftime('%Y%m%d%H%M%S')

        # 3. Thông tin mạng (IP khách hàng)
        ipaddr = get_client_ip(request)
        vnp_params['vnp_IpAddr'] = ipaddr if ipaddr else '127.0.0.1'

        # 4. Thông tin khách hàng (nếu có)
        if order.user:
            vnp_params['vnp_Bill_Mobile'] = getattr(order.user, 'phone_number', '') or ''
            vnp_params['vnp_Bill_Email'] = getattr(order.user, 'email', '') or ''
            vnp_params['vnp_Bill_FirstName'] = getattr(order.user, 'first_name', '')
            vnp_params['vnp_Bill_LastName'] = getattr(order.user, 'last_name', '')

        # Sắp xếp tham số theo alphabet (bắt buộc đối với VNPAY)
        input_data = sorted(vnp_params.items())
        
        query_parts = []
        for key, val in input_data:
            if val is not None and str(val) != '':
                query_parts.append(f"{key}={urllib.parse.quote_plus(str(val))}")

        query_string = "&".join(query_parts)

        # Tạo chữ ký HMAC-SHA512
        secret_key = settings.VNPAY_HASH_SECRET_KEY
        hash_value = hmac.new(
            secret_key.encode('utf-8'),
            query_string.encode('utf-8'),
            hashlib.sha512
        ).hexdigest()

        # Trả về URL cuối cùng
        return f"{settings.VNPAY_PAYMENT_URL}?{query_string}&vnp_SecureHash={hash_value}"

    def validate_response(self, secret_key):
        vnp_SecureHash = self.responseData['vnp_SecureHash']
        # Remove hash params
        if 'vnp_SecureHash' in self.responseData.keys():
            self.responseData.pop('vnp_SecureHash')

        if 'vnp_SecureHashType' in self.responseData.keys():
            self.responseData.pop('vnp_SecureHashType')

        inputData = sorted(self.responseData.items())
        hasData = ''
        seq = 0
        for key, val in inputData:
            if str(key).startswith('vnp_'):
                if seq == 1:
                    hasData = hasData + "&" + str(key) + '=' + urllib.parse.quote_plus(str(val))
                else:
                    seq = 1
                    hasData = str(key) + '=' + urllib.parse.quote_plus(str(val))
        hashValue = self.__hmacsha512(secret_key, hasData)

        return vnp_SecureHash == hashValue

    @staticmethod
    def __hmacsha512(key, data):
        byteKey = key.encode('utf-8')
        byteData = data.encode('utf-8')
        return hmac.new(byteKey, byteData, hashlib.sha512).hexdigest()
