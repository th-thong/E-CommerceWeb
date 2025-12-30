from rest_framework.decorators import api_view, authentication_classes, permission_classes, renderer_classes, throttle_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.renderers import JSONRenderer
from rest_framework.response import Response
from .serializers import OrderSerializer, NewOrderSerializer, ShopOrderDetailSerializer,OrderHistorySerializer
from rest_framework import status
from drf_spectacular.utils import  extend_schema, inline_serializer, OpenApiParameter, OpenApiTypes
from rest_framework import serializers
from .models import Order, OrderDetail
from .permissions import IsSeller
from shop.models import Shop
from payment.utils import create_vnpay_payment_url
from payment.models import PaymentTransaction
from django.db import transaction


@extend_schema(
    tags=['Order'],
    methods=['GET'],
    summary="Lấy lịch sử mua hàng",
    description="Trả về danh sách chi tiết các đơn hàng mà user hiện tại đã mua (bao gồm cả trạng thái và sản phẩm bên trong).",
    responses={
        200: OrderHistorySerializer(many=True),
        404: inline_serializer(name='NoOrderFound', fields={'message': serializers.CharField()})
    }
)
@extend_schema(
    tags=['Order'],
    methods=['POST'],
    summary="Tạo đơn hàng mới",
    description="User gửi danh sách sản phẩm để tạo đơn. Hỗ trợ thanh toán COD và VNPAY.",
    request=NewOrderSerializer,
    responses={
        200: inline_serializer(
            name='VNPAYResponse',
            fields={
                'message': serializers.CharField(),
                'order_id': serializers.IntegerField(),
                'payment_type': serializers.CharField(default='VNPAY'),
                'payment_url': serializers.URLField()
            }
        ),
        201: inline_serializer(
            name='CODResponse',
            fields={
                'message': serializers.CharField(),
                'order_id': serializers.IntegerField(),
                'payment_type': serializers.CharField(default='COD'),
                'data': OrderSerializer()
            }
        ),
        400: inline_serializer(
            name='OrderCreateError',
            fields={'message': serializers.CharField(), 'error_detail': serializers.CharField()}
        )
    }
)
@api_view(['GET','POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
@renderer_classes([JSONRenderer])
def order_api(request):
    if request.method == 'GET':
        return get_order_history(request)    
        
    elif request.method == 'POST':
        return create_new_order(request)

def get_order_history(request):
    try:
        orders = Order.objects.filter(user=request.user)\
                              .prefetch_related('items', 'items__product', 'items__variant')\
                              .order_by('-created_at')

        if not orders.exists():
             return Response({'message': 'Bạn chưa có đơn hàng nào.', 'data': []}, status=status.HTTP_200_OK)

        serializer = OrderHistorySerializer(orders, many=True)

        return Response(serializer.data, status=status.HTTP_200_OK)

    except Exception as e:
        print(f"Lỗi lấy lịch sử: {e}")
        return Response({'message': 'Lỗi hệ thống'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def create_new_order(request):
    serializer = NewOrderSerializer(data=request.data, context={"request": request})

    if serializer.is_valid():
        try:
            with transaction.atomic():
                order = serializer.save()
                payment_type = serializer.validated_data.get('payment_type', 'COD')

                if payment_type == 'VNPAY':
                    PaymentTransaction.objects.create(
                        order=order,
                        amount=order.total_price,
                        transaction_no=str(order.id),
                        status=PaymentTransaction.PaymentStatus.PENDING,
                        payment_source='VNPAY'
                    )

                    try:
                        payment_url = create_vnpay_payment_url(order, request)
                        return Response({
                                "message": "Đơn hàng đã tạo. Vui lòng thanh toán.",
                                "order_id": order.id,
                                "payment_type": "VNPAY",
                                "payment_url": payment_url
                            }, status=status.HTTP_200_OK)
                    except Exception as e:
                        return Response({"error": f"Lỗi tạo link VNPAY: {str(e)}"}, status=400)
                
                else:
                    return Response({
                        "message": "Đặt hàng thành công",
                        "order_id": order.id,
                        "payment_type": "COD",
                        "data": OrderSerializer(order).data
                    }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({
                'message': 'Tạo đơn hàng thất bại', 
                'error_detail': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
            
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(
    tags=['Order'],
    summary="Xem chi tiết đơn hàng",
    description="Lấy thông tin chi tiết một đơn hàng cụ thể. Chỉ chủ sở hữu đơn hàng mới xem được.",
    parameters=[
        OpenApiParameter(
            name='order_id', 
            description='ID của đơn hàng cần xem', 
            required=True, 
            type=OpenApiTypes.INT,
            location=OpenApiParameter.PATH
        ),
    ],
    responses={
        200: OrderSerializer,
        404: inline_serializer(
            name='OrderNotFound', 
            fields={'message': serializers.CharField()}
        ),
        500: inline_serializer(
            name='OrderSystemError', 
            fields={'message': serializers.CharField(), 'details': serializers.CharField()}
        )
    }
)
@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
@renderer_classes([JSONRenderer])
def get_order_detail(request, order_id):
    try:
        order = Order.objects.prefetch_related(
            'items',              # Load danh sách OrderDetail
            'items__product',     # Load thông tin Product bên trong
            'items__variant',     # Load thông tin Variant (nếu có dùng)
            'items__shop'         # Load thông tin Shop
        ).get(id=order_id, user=request.user)
        
    except Order.DoesNotExist:
        # Trả về 404 nếu không tìm thấy hoặc đơn hàng đó không phải của user này
        return Response(
            {'message': 'Không tìm thấy đơn hàng hoặc bạn không có quyền truy cập.'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        # Bắt các lỗi hệ thống khác (DB lỗi, code lỗi...)
        return Response(
            {'message': 'Lỗi hệ thống', 'details': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    return Response(OrderSerializer(order).data, status=status.HTTP_200_OK)


@extend_schema(
    tags=['Order'],
    summary="Lấy đơn hàng của Shop (Kênh người bán)",
    description="Dành cho người bán. Trả về danh sách các sản phẩm mà khách đã đặt từ Shop của bạn.",
    responses={
        200: ShopOrderDetailSerializer(many=True),
        404: inline_serializer(name='ShopNotFound', fields={'message': serializers.CharField()}),
        500: inline_serializer(name='ShopSystemError', fields={'message': serializers.CharField(), 'details': serializers.CharField()})
    }
)
@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated, IsSeller])
@renderer_classes([JSONRenderer])
def get_shop_order(request):
    try:
        # 1. Tìm Shop của user hiện tại
        shop = Shop.objects.get(owner=request.user)
        
        # 2. Lấy danh sách OrderDetail
        details = OrderDetail.objects.filter(shop=shop)\
            .select_related('product', 'variant', 'order', 'order__user')\
            .order_by('-id') # Sắp xếp đơn mới nhất lên đầu
            
    except Shop.DoesNotExist:
        return Response(
            {'message': 'Bạn chưa đăng ký Shop hoặc Shop không tồn tại.'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'message': 'Lỗi hệ thống', 'details': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
        
    return Response(ShopOrderDetailSerializer(details, many=True).data, status=status.HTTP_200_OK)
