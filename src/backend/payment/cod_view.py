from rest_framework.decorators import api_view, authentication_classes, permission_classes, renderer_classes, throttle_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.renderers import JSONRenderer
from http.client import HTTPResponse
from rest_framework.response import Response
from rest_framework import status
from .serializers import CODSerializers
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import AuthenticationFailed
from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import serializers
from order.models import Order, OrderDetail

from django.contrib.auth import get_user_model
User = get_user_model()

@extend_schema(
    summary="Xác nhận thanh toán COD",
    description="Xác nhận phương thức thanh toán khi nhận hàng (Cash On Delivery). Hệ thống sẽ chuyển trạng thái thanh toán của các sản phẩm trong đơn hàng sang 'Pending'.",
    request=CODSerializers,
    responses={
        200: inline_serializer(
            name='CODSuccessResponse',
            fields={'message': serializers.CharField(default='Thanh toán COD thành công')}
        ),
        400: inline_serializer(
            name='CODErrorResponse',
            fields={'message': serializers.CharField(default='Thanh toán COD không thành công')}
        ),
        404: inline_serializer(
            name='CODNotFoundResponse',
            fields={'error': serializers.CharField(default='Order not found')}
        )
    }
)
@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
@renderer_classes([JSONRenderer])
def cod(request):
    serializer = CODSerializers(data=request.data)
    
    if serializer.is_valid():
        try:
            order_id = request.data.get('order_id')
            order = Order.objects.get(id=order_id)
            order.items.all().update(payment_status='pending')
            return Response({"message":"Thanh toán COD thành công"}, status=status.HTTP_200_OK)
        except Exception as e:
            order.items.all().update(payment_status='pending')
            return Response({"message":"Thanh toán COD không thành công"}, status=status.HTTP_400_BAD_REQUEST)