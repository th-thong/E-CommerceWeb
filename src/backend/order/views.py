from rest_framework.decorators import api_view, authentication_classes, permission_classes, renderer_classes, throttle_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.renderers import JSONRenderer
from http.client import HTTPResponse
from rest_framework.response import Response
from .serializers import OrderSerializer, OrderDetailSerializer, NewOrderSerializer, OrderSimpleSerializer, ShopOrderDetailSerializer
from rest_framework import status
from rest_framework.views import APIView
from django.core.exceptions import ObjectDoesNotExist
from drf_spectacular.utils import extend_schema_view, extend_schema
from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import serializers
from .models import Order, OrderDetail
from .permissions import IsSeller
from shop.models import Shop

@api_view(['GET','POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
@renderer_classes([JSONRenderer])
def order_api(request):
    if request.method == 'GET':
        return get_order_history(request)    
        
    elif request.method == 'POST':
        return create_new_order(request)

def get_order_history(request) -> Response:
    try:
        order = Order.objects.filter(user_id=request.user.id)
        print(order)
    except Exception as e:
        print(e)
        return Response({'message':'Không có đơn hàng nào'}, status = status.HTTP_404_NOT_FOUND)
    return Response(OrderSimpleSerializer(order, many = True).data, status = status.HTTP_200_OK)
    
def create_new_order(request) -> Response:
    serializer = NewOrderSerializer(data = request.data, context={"request":request})

    if serializer.is_valid():
        try:
            order = serializer.save()
            return Response(OrderSerializer(order).data, status = status.HTTP_200_OK)
        except Exception as e:
            print(e)
            return Response({'message': 'Tạo đơn hàng không thành công'}, status = status.HTTP_400_BAD_REQUEST)
    return Response({'message' : serializer.errors}, status = status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
@renderer_classes([JSONRenderer])
def get_order_detail(request, order_id):
    try:
        order = Order.objects.get(id=order_id)
    except Exception as e:
        return Response({'message':'Không tìm thấy đơn hàng'}, status = status.HTTP_404_NOT_FOUND)
    return Response(OrderSerializer(order).data, status = status.HTTP_200_OK)


@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated, IsSeller])
@renderer_classes([JSONRenderer])
def get_shop_order(request):
    try:
        shop = Shop.objects.get(owner_id = request.user.id)
        details = OrderDetail.objects.filter(shop_id = shop.id)

    except Exception as e:
        return Response({'message':'Đã có lỗi xảy ra khi tìm shop'}, status = status.HTTP_404_NOT_FOUND)
    return Response(ShopOrderDetailSerializer(details, many = True).data, status = status.HTTP_200_OK)
