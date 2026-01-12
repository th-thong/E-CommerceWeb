from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.renderers import JSONRenderer
from rest_framework.response import Response
from .serializers import ShopSerializer, ShopRegisterSerializer,UpdateOrderStatusSerializer
from rest_framework import status
from rest_framework.views import APIView
from django.core.exceptions import ObjectDoesNotExist
from drf_spectacular.utils import extend_schema_view, extend_schema, inline_serializer
from rest_framework import serializers
from .permissions import IsSeller
from rest_framework.decorators import api_view
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from .models import Shop
from order.models import OrderDetail, Order
from django.db import transaction



class ShopView(APIView):
    renderer_classes=[JSONRenderer]
    authentication_classes=[JWTAuthentication]

    def get_permissions(self):
        return [IsAuthenticated()]

    def get_object(self, user):
        try:
            return user.shop
        except ObjectDoesNotExist:
            return None

    @extend_schema(
        tags=['Shop'],
        summary="Lấy thông tin Shop của tôi",
        description="Trả về thông tin chi tiết Shop của User đang đăng nhập.",
        responses={
            200: ShopSerializer,
            404: inline_serializer(
                name='ShopNotFound', 
                fields={'error': serializers.CharField(default='You do not own any shop')}
            )
        }
    )
    def get(self, request):
        shop = self.get_object(request.user)
        if shop is None:
            return Response({"error": "You do not own any shop"}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = ShopSerializer(shop)
        return Response(serializer.data)

    @extend_schema(
        tags=['Shop'],
        request=ShopSerializer, 
        summary="Cập nhật thông tin Shop",
        description="Cho phép User chỉnh sửa thông tin Shop (Tên, mô tả, địa chỉ...).",
        responses={
            200: ShopSerializer,
            400: inline_serializer(
                name='ShopUpdateError', 
                fields={'detail': serializers.CharField()}
            ),
            404: inline_serializer(
                name='ShopNotFoundUpdate', 
                fields={'error': serializers.CharField()}
            )
        }
    )
    def put(self, request):
        shop = self.get_object(request.user)
        if shop is None:
            return Response({"error": "You do not own any shop"}, status=status.HTTP_404_NOT_FOUND)

        serializer = ShopSerializer(shop, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @extend_schema(
        tags=['Shop'],
        request=ShopRegisterSerializer,
        summary="Đăng ký Shop mới",
        description="Đăng ký mở Shop bán hàng. Mỗi User chỉ được tạo duy nhất 1 Shop.",
        responses={
            201: inline_serializer(
                name='ShopCreateSuccess', 
                fields={'message': serializers.CharField(default='Successfully created shop')}
            ),
            400: inline_serializer(
                name='ShopCreateError', 
                fields={'error': serializers.CharField(default='You cannot create more shops')}
            )
        }
    )
    def post(self, request):
        if self.get_object(request.user) is not None:
            return Response(
                {"error": "You cannot create more shops"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        serializer=ShopRegisterSerializer(data=request.data)
        if serializer.is_valid():
            try:
                serializer.save(owner=request.user)
                return Response({"message":"Successfully created shop"}, status=status.HTTP_201_CREATED)
            except Exception as e:
                return Response({"error":str(e)},status=status.HTTP_400_BAD_REQUEST)
        
        return Response(serializer.errors,status=status.HTTP_400_BAD_REQUEST)
    
    
    
@extend_schema(
    tags=['Order (Seller)'],
    summary="Cập nhật trạng thái đơn hàng",
    description="Dành cho Shop. Cập nhật trạng thái xử lý (Pending -> Confirmed -> Shipped) hoặc thanh toán.",
    request=UpdateOrderStatusSerializer,
    responses={
        200: inline_serializer(
            name='UpdateStatusSuccess',
            fields={'message': serializers.CharField(), 'data': UpdateOrderStatusSerializer()}
        ),
        403: inline_serializer(name='Forbidden', fields={'detail': serializers.CharField()}),
        404: inline_serializer(name='NotFound', fields={'message': serializers.CharField()})
    }
)
@api_view(['PATCH'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated, IsSeller])
def update_order_status(request, detail_id):
    try:
        shop = Shop.objects.get(owner=request.user)
        order_detail = OrderDetail.objects.get(id=detail_id, shop=shop)
        
    except Shop.DoesNotExist:
        return Response({'message': 'Bạn chưa có Shop.'}, status=status.HTTP_403_FORBIDDEN)
    except OrderDetail.DoesNotExist:
        return Response({'message': 'Không tìm thấy dòng đơn hàng này hoặc không thuộc Shop của bạn.'}, status=status.HTTP_404_NOT_FOUND)

    # 2. Validate và Update
    serializer = UpdateOrderStatusSerializer(order_detail, data=request.data, partial=True)
    
    if serializer.is_valid():
        serializer.save()
        return Response({
            'message': 'Cập nhật trạng thái thành công',
            'data': serializer.data
        }, status=status.HTTP_200_OK)
        
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(
    tags=['Order (Seller)'],
    summary="Từ chối/Xóa đơn hàng",
    description="Dành cho Shop. Từ chối đơn hàng sẽ xóa OrderDetail và hoàn trả số lượng sản phẩm về kho. Nếu Order không còn OrderDetail nào, sẽ xóa luôn Order.",
    responses={
        200: inline_serializer(
            name='RejectOrderSuccess',
            fields={'message': serializers.CharField()}
        ),
        403: inline_serializer(name='Forbidden', fields={'detail': serializers.CharField()}),
        404: inline_serializer(name='NotFound', fields={'message': serializers.CharField()})
    }
)
@api_view(['DELETE'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated, IsSeller])
def reject_order(request, detail_id):
    """
    Xóa OrderDetail khi shop từ chối đơn hàng.
    - Hoàn trả số lượng sản phẩm về kho
    - Xóa OrderDetail
    - Nếu Order không còn OrderDetail nào, xóa luôn Order
    """
    try:
        shop = Shop.objects.get(owner=request.user)
        order_detail = OrderDetail.objects.select_related('order', 'product', 'variant').get(id=detail_id, shop=shop)
        
    except Shop.DoesNotExist:
        return Response({'message': 'Bạn chưa có Shop.'}, status=status.HTTP_403_FORBIDDEN)
    except OrderDetail.DoesNotExist:
        return Response({'message': 'Không tìm thấy dòng đơn hàng này hoặc không thuộc Shop của bạn.'}, status=status.HTTP_404_NOT_FOUND)

    try:
        with transaction.atomic():
            # 1. Hoàn trả số lượng sản phẩm về kho
            if order_detail.variant:
                # Hoàn trả cho variant
                order_detail.variant.quantity += order_detail.quantity
                order_detail.variant.save()
            else:
                # Hoàn trả cho product
                product = order_detail.product
                if hasattr(product, 'quantity'):
                    product.quantity += order_detail.quantity
                    product.save()
            
            # 2. Lưu thông tin order trước khi xóa để kiểm tra sau
            order = order_detail.order
            order_id = order.id
            
            # 3. Xóa OrderDetail
            order_detail.delete()
            
            # 4. Kiểm tra xem Order còn OrderDetail nào không
            remaining_details = OrderDetail.objects.filter(order_id=order_id)
            
            if not remaining_details.exists():
                # Nếu không còn OrderDetail nào, xóa luôn Order
                order.delete()
                return Response({
                    'message': 'Đã từ chối đơn hàng. Đơn hàng đã được xóa hoàn toàn.'
                }, status=status.HTTP_200_OK)
            else:
                # Nếu còn OrderDetail, cập nhật lại total_price của Order
                total = sum(detail.price * detail.quantity for detail in remaining_details)
                order.total_price = total
                order.save()
                return Response({
                    'message': 'Đã từ chối đơn hàng. Sản phẩm đã được hoàn trả về kho.'
                }, status=status.HTTP_200_OK)
                
    except Exception as e:
        return Response({
            'message': f'Lỗi khi xử lý từ chối đơn hàng: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)