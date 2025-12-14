import hashlib
import hmac
import requests
from datetime import datetime
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from .payment_provider.vnpay import vnpay 
from .serializers import CreatePaymentSerializer
from order.models import Order
from decimal import Decimal
from django.db import transaction
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from drf_spectacular.utils import extend_schema, OpenApiParameter, inline_serializer, OpenApiTypes
from rest_framework import serializers

# Hàm lấy IP Client (Helper function)
def get_client_ip(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip

class VNPAYCreatePaymentView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    @extend_schema(
        summary="Tạo URL thanh toán VNPAY",
        description="Gửi thông tin đơn hàng (ID, số tiền) để nhận về đường link chuyển hướng sang cổng thanh toán VNPAY.",
        request=CreatePaymentSerializer,
        responses={
            200: inline_serializer(
                name='VNPAYUrlResponse',
                fields={'payment_url': serializers.URLField(help_text="Đường dẫn redirect sang VNPAY")}
            ),
            400: inline_serializer(
                name='VNPAYCreateError',
                fields={'detail': serializers.CharField()}
            )
        }
    )
    def post(self, request):
        serializer = CreatePaymentSerializer(data=request.data)
        if serializer.is_valid():
            data = serializer.validated_data
            
            # 1. Lấy thông tin từ request
            order_type = 'billpayment'
            order_id = data.get('order_id')
            amount = data['amount']
            bank_code = data.get('bank_code', '')
            language = data.get('language', 'vn')
            ipaddr = get_client_ip(request)
            
            

            # 2. Build URL Payment
            vnp = vnpay()
            vnp.requestData['vnp_Version'] = '2.1.0'
            vnp.requestData['vnp_Command'] = 'pay'
            vnp.requestData['vnp_TmnCode'] = settings.VNPAY_TMN_CODE
            vnp.requestData['vnp_Amount'] = int(amount * 100) # VNPAY yêu cầu nhân 100
            vnp.requestData['vnp_CurrCode'] = 'VND'
            vnp.requestData['vnp_TxnRef'] = order_id
            vnp.requestData['vnp_OrderInfo'] = f"Thanh toan don hang {order_id}"
            vnp.requestData['vnp_OrderType'] = order_type
            
            if language:
                vnp.requestData['vnp_Locale'] = language
            else:
                vnp.requestData['vnp_Locale'] = 'vn'
                
            if bank_code:
                vnp.requestData['vnp_BankCode'] = bank_code

            vnp.requestData['vnp_CreateDate'] = datetime.now().strftime('%Y%m%d%H%M%S')
            if ipaddr:
                vnp.requestData['vnp_IpAddr'] = ipaddr
            else:
                vnp.requestData['vnp_IpAddr'] = '127.0.0.1'
            vnp.requestData['vnp_ReturnUrl'] = settings.VNPAY_RETURN_URL

            # 3. Tạo URL
            payment_url = vnp.get_payment_url(settings.VNPAY_PAYMENT_URL, settings.VNPAY_HASH_SECRET_KEY)
            
            return Response({'payment_url': payment_url}, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class VNPAYIPNView(APIView):
    """
    API này để VNPAY gọi server-to-server (Callback) báo kết quả giao dịch.
    Không yêu cầu Authentication vì VNPAY gọi từ ngoài vào.
    """
    permission_classes = [AllowAny] 

    @extend_schema(
        summary="IPN (Webhook từ VNPAY)",
        description="API này chỉ dành cho Server VNPAY gọi tự động để cập nhật trạng thái đơn hàng (Pending -> Paid). Người dùng không gọi trực tiếp.",
        parameters=[
            OpenApiParameter(name='vnp_SecureHash', type=str, required=True, description='Mã kiểm tra toàn vẹn'),
            OpenApiParameter(name='vnp_TxnRef', type=str, required=True, description='Mã đơn hàng (Order ID)'),
            OpenApiParameter(name='vnp_Amount', type=str, required=True, description='Số tiền (đã nhân 100)'),
            OpenApiParameter(name='vnp_ResponseCode', type=str, required=True, description='Mã phản hồi (00 là thành công)'),
        ],
        responses={
            200: inline_serializer(
                name='IPNResponse',
                fields={
                    'RspCode': serializers.CharField(),
                    'Message': serializers.CharField()
                }
            )
        }
    )
    def get(self, request):
            inputData = request.GET
            if inputData:
                vnp = vnpay()
                vnp.responseData = inputData.dict()
                
                order_id = inputData.get('vnp_TxnRef')
                vnp_amount = inputData.get('vnp_Amount')
                vnp_ResponseCode = inputData.get('vnp_ResponseCode')
                
                # Validate checksum
                if vnp.validate_response(settings.VNPAY_HASH_SECRET_KEY):
                    try:
                        order = Order.objects.get(id=order_id)
                    except Order.DoesNotExist:
                        return Response({'RspCode': '01', 'Message': 'Order not found'})

                    # Kiểm tra số tiền (VNPAY trả về amount * 100)
                    vnp_amount_decimal = Decimal(vnp_amount) / 100
                    if order.total_price != vnp_amount_decimal:
                        return Response({'RspCode': '04', 'Message': 'Invalid amount'})

                    # Kiểm tra trạng thái đơn hàng (Đã cập nhật trước đó chưa?)
                    first_item = order.items.first()
                    if first_item and first_item.payment_status == 'paid':
                        return Response({'RspCode': '02', 'Message': 'Order Already Update'})

                    # Xử lý kết quả giao dịch
                    if vnp_ResponseCode == '00':
                        # --- Giao dịch thành công ---
                        try:
                            with transaction.atomic():
                                order.items.all().update(payment_status='paid')
                                
                            print(f"Thanh toán thành công Order {order_id}")
                            return Response({'RspCode': '00', 'Message': 'Confirm Success'})
                        except Exception as e:
                            print(f"Lỗi khi update DB: {e}")
                            return Response({'RspCode': '99', 'Message': 'Unknown error'})
                    else:
                        # --- Giao dịch thất bại / User hủy ---
                        print(f"Giao dịch thất bại Order {order_id}")
                        return Response({'RspCode': '00', 'Message': 'Confirm Success'})
                else:
                    return Response({'RspCode': '97', 'Message': 'Invalid Checksum'})
            else:
                return Response({'RspCode': '99', 'Message': 'Invalid request'})


class VNPAYReturnView(APIView):
    """
    API này để Frontend gọi sau khi VNPAY redirect user về website.
    Dùng để xác thực lại checksum một lần nữa trước khi hiển thị "Thành công" cho user.
    """
    permission_classes = [AllowAny]
    
    @extend_schema(
        summary="VNPAY Return URL",
        description="Frontend gọi API này sau khi user được redirect từ VNPAY về, để xác thực lại checksum và hiển thị kết quả.",
        parameters=[
            OpenApiParameter(name='vnp_ResponseCode', type=str, description='00: Thành công'),
            OpenApiParameter(name='vnp_TxnRef', type=str, description='Mã đơn hàng'),
            OpenApiParameter(name='vnp_SecureHash', type=str, description='Checksum'),
        ],
        responses={
            200: inline_serializer(
                name='ReturnSuccess',
                fields={
                    'status': serializers.CharField(),
                    'message': serializers.CharField(),
                    'data': serializers.DictField()
                }
            )
        }
    )
    def get(self, request):
        inputData = request.GET
        if inputData:
            vnp = vnpay()
            vnp.responseData = inputData.dict()
            
            if vnp.validate_response(settings.VNPAY_HASH_SECRET_KEY):
                if inputData.get('vnp_ResponseCode') == "00":
                    return Response({
                        'status': 'success',
                        'message': 'Giao dịch thành công',
                        'data': inputData.dict()
                    })
                else:
                    return Response({
                        'status': 'error',
                        'message': 'Giao dịch không thành công',
                        'data': inputData.dict()
                    })
            else:
                return Response({'status': 'error', 'message': 'Sai checksum - Dữ liệu bị giả mạo'}, status=status.HTTP_400_BAD_REQUEST)
        return Response({'status': 'error', 'message': 'Invalid request'}, status=status.HTTP_400_BAD_REQUEST)


class VNPAYQueryView(APIView):
    """
    API kiểm tra trạng thái giao dịch (QueryDR)
    """
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        summary="Truy vấn trạng thái giao dịch (QueryDR)",
        description="Chủ động hỏi VNPAY xem giao dịch này đã thành công chưa (Dùng để đối soát hoặc khi IPN bị lỗi).",
        request=inline_serializer(
            name='VNPAYQueryRequest',
            fields={
                'order_id': serializers.CharField(help_text="Mã đơn hàng đã gửi sang VNPAY"),
                'trans_date': serializers.CharField(help_text="Thời gian tạo giao dịch (Format: YYYYMMDDHHmmss)")
            }
        ),
        responses={
            200: OpenApiTypes.OBJECT # Trả về JSON thô từ VNPAY
        }
    )
    def post(self, request):
        order_id = request.data.get('order_id')
        trans_date = request.data.get('trans_date') # Format: YYYYMMDDHHmmss

        if not order_id or not trans_date:
            return Response({'error': 'Missing order_id or trans_date'}, status=status.HTTP_400_BAD_REQUEST)

        # Config VNPAY
        url = settings.VNPAY_API_URL
        secret_key = settings.VNPAY_HASH_SECRET_KEY
        vnp_TmnCode = settings.VNPAY_TMN_CODE
        vnp_Version = '2.1.0'

        vnp_RequestId = datetime.now().strftime('%H%M%S') # Random ID
        vnp_Command = 'querydr'
        vnp_TxnRef = order_id
        vnp_OrderInfo = f'Query order {order_id}'
        vnp_TransactionDate = trans_date
        vnp_CreateDate = datetime.now().strftime('%Y%m%d%H%M%S')
        vnp_IpAddr = get_client_ip(request)
        if vnp_IpAddr:
            pass
        else:
            vnp_IpAddr = '127.0.0.1'

        hash_data = "|".join([
            str(vnp_RequestId), str(vnp_Version), str(vnp_Command), str(vnp_TmnCode),
            str(vnp_TxnRef), str(vnp_TransactionDate), str(vnp_CreateDate),
            str(vnp_IpAddr), str(vnp_OrderInfo)
        ])

        secure_hash = hmac.new(secret_key.encode(), hash_data.encode(), hashlib.sha512).hexdigest()

        data = {
            "vnp_RequestId": vnp_RequestId,
            "vnp_TmnCode": vnp_TmnCode,
            "vnp_Command": vnp_Command,
            "vnp_TxnRef": vnp_TxnRef,
            "vnp_OrderInfo": vnp_OrderInfo,
            "vnp_TransactionDate": vnp_TransactionDate,
            "vnp_CreateDate": vnp_CreateDate,
            "vnp_IpAddr": vnp_IpAddr,
            "vnp_Version": vnp_Version,
            "vnp_SecureHash": secure_hash
        }

        response = requests.post(url, json=data)

        if response.status_code == 200:
            return Response(response.json())
        return Response({'error': 'Failed to query VNPAY'}, status=response.status_code)
