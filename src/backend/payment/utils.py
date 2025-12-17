from datetime import datetime, timedelta
from django.conf import settings
from .payment_provider.vnpay import vnpay
from .vnpay_view import get_client_ip


def create_vnpay_payment_url(order, request):
    """
    Hàm tạo URL thanh toán VNPAY từ Order object
    """
    # 1. Khởi tạo class VNPAY
    vnp = vnpay()
    vnp.requestData = {}

    # 2. Cấu hình các tham số bắt buộc
    vnp.requestData['vnp_Version'] = '2.1.0'
    vnp.requestData['vnp_Command'] = 'pay'
    vnp.requestData['vnp_TmnCode'] = settings.VNPAY_TMN_CODE
    vnp.requestData['vnp_Amount'] = int(order.total_price * 100) 
    vnp.requestData['vnp_CurrCode'] = 'VND'
    vnp.requestData['vnp_TxnRef'] = str(order.id)
    vnp.requestData['vnp_OrderInfo'] = f"Thanh toan don hang {order.id}"
    vnp.requestData['vnp_OrderType'] = 'billpayment'
    vnp.requestData['vnp_Locale'] = 'vn'
    
    # 3. Cấu hình thời gian (Tạo & Hết hạn sau 15 phút)
    curr_date = datetime.now()
    vnp.requestData['vnp_CreateDate'] = curr_date.strftime('%Y%m%d%H%M%S')
    
    expire_date = curr_date + timedelta(minutes=15)
    vnp.requestData['vnp_ExpireDate'] = expire_date.strftime('%Y%m%d%H%M%S')

    # 4. IP Address
    ipaddr = get_client_ip(request)
    vnp.requestData['vnp_IpAddr'] = ipaddr if ipaddr else '127.0.0.1'

    # 5. Thông tin khách hàng
    if order.user:
        vnp.requestData['vnp_Bill_Mobile'] = getattr(order.user, 'phone_number', '') or ''
        vnp.requestData['vnp_Bill_Email'] = getattr(order.user, 'email', '') or ''
        
        full_name = (getattr(order.user, 'first_name', '') + ' ' + getattr(order.user, 'last_name', '')).strip()
        if full_name:
            vnp.requestData['vnp_Bill_FirstName'] = getattr(order.user, 'first_name', '')
            vnp.requestData['vnp_Bill_LastName'] = getattr(order.user, 'last_name', '')

    # 6. URL Return (VNPAY sẽ redirect về đây sau khi thanh toán)
    vnp.requestData['vnp_ReturnUrl'] = settings.VNPAY_RETURN_URL

    # 7. Gọi hàm trong class vnpay của bạn để tạo URL cuối cùng
    payment_url = vnp.get_payment_url(settings.VNPAY_PAYMENT_URL, settings.VNPAY_HASH_SECRET_KEY)
    
    return payment_url