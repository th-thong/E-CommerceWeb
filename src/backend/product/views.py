from django.shortcuts import get_object_or_404
from django.core.exceptions import ObjectDoesNotExist
from django.db import transaction
from django.db.models import Sum, Count, OuterRef, Subquery, IntegerField
from django.db.models.functions import Coalesce
from django.utils import timezone
from datetime import timedelta
import json

from rest_framework.views import APIView
from rest_framework.decorators import api_view, renderer_classes, permission_classes, parser_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.renderers import JSONRenderer
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser
from rest_framework_simplejwt.authentication import JWTAuthentication

# Import các Models
from .models import Product, ProductImage
from order.models import OrderDetail 

# Import Serializer duy nhất
from .serializers import ProductSerializer 

# --- CONSTANTS ---
PRODUCT_NOT_FOUND_MSG = {"error": "Product not found or you do not have permission."}

# ============================================================================
#                               PUBLIC VIEWS
# ============================================================================

@api_view(['GET'])
@renderer_classes([JSONRenderer])
@permission_classes([AllowAny])
def get_list_of_public_product(request):
    """
    Lấy danh sách tất cả sản phẩm đang hoạt động (Mới nhất lên đầu).
    """
    product_list = Product.objects.filter(is_active=True).prefetch_related(
        'variants', 'images', 'category', 'shop'
    ).order_by('-created_at')
    
    serializer = ProductSerializer(product_list, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['GET'])
@renderer_classes([JSONRenderer])
@permission_classes([AllowAny])
def get_public_product_detail(request, product_id):
    """
    Xem chi tiết một sản phẩm cụ thể.
    """
    try:
        product = Product.objects.prefetch_related('variants', 'images', 'shop', 'category').get(
            id=product_id, 
            is_active=True
        )
        serializer = ProductSerializer(product)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Product.DoesNotExist:
        return Response({"error": "Product not found"}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@renderer_classes([JSONRenderer])
@permission_classes([AllowAny])
def get_trendy_product(request):
    """
    Top 10 sản phẩm bán chạy nhất trong 7 ngày qua.
    """
    # 1. Xác định mốc thời gian (7 ngày trước)
    last_week = timezone.now() - timedelta(days=7)

    # 2. Truy vấn
    trendy_products = Product.objects.filter(
        is_active=True,
        order_details__order__created_at__gte=last_week 
    ).annotate(
        total_sold=Sum('order_details__quantity') 
    ).order_by('-total_sold')[:10]

    # 3. Prefetch để lấy ảnh và variant
    trendy_products = trendy_products.prefetch_related('images', 'variants', 'shop', 'category')

    serializer = ProductSerializer(trendy_products, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['GET'])
@renderer_classes([JSONRenderer])
@permission_classes([AllowAny])
def get_flashsale_product(request):
    """
    Lấy các sản phẩm đang giảm giá sâu (>= 50%).
    """
    flashsale_product = Product.objects.filter(
        is_active=True,
        discount__gte=50
    ).prefetch_related(
        'variants', 'images', 'category', 'shop'
    ).order_by('-discount')
    
    serializer = ProductSerializer(flashsale_product, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK) 


@api_view(['GET'])
@renderer_classes([JSONRenderer])
@permission_classes([AllowAny])
def get_recommend_product(request):
    """
    Gợi ý sản phẩm:
    - Nếu đã đăng nhập: Ưu tiên Category người dùng hay mua nhất.
    - Nếu chưa đăng nhập: Trả về sản phẩm mới nhất.
    """
    base_query = Product.objects.filter(is_active=True).prefetch_related(
        'variants', 'images', 'category', 'shop'
    )

    if request.user.is_authenticated:
        # 1. Subquery: Đếm số lượng sản phẩm user đã mua theo từng Category
        # order__user: Truy cập ngược từ OrderDetail -> Order -> User
        category_purchase_count = OrderDetail.objects.filter(
            order__user=request.user,
            product__category=OuterRef('category') 
        ).values('product__category').annotate(
            cnt=Count('id')
        ).values('cnt')

        # 2. Gắn điểm (cat_score) cho Product dựa trên Subquery trên
        product_list = base_query.annotate(
            cat_score=Coalesce(Subquery(category_purchase_count, output_field=IntegerField()), 0)
        ).order_by('-cat_score', '-created_at')

    else:
        # Logic cho khách vãng lai
        product_list = base_query.order_by('-created_at')
    
    serializer = ProductSerializer(product_list, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


# ============================================================================
#                               SELLER VIEWS
# ============================================================================

class SellerProductListCreateView(APIView):
    """
    API dành cho chủ Shop:
    - GET: Lấy danh sách sản phẩm của Shop mình.
    - POST: Tạo sản phẩm mới (kèm Variants và Images).
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    renderer_classes = [JSONRenderer]
    parser_classes = [JSONParser, MultiPartParser, FormParser] 

    def get_shop(self, user):
        try:
            return user.shop
        except ObjectDoesNotExist:
            return None

    def get(self, request):
        shop = self.get_shop(request.user)
        if not shop:
             return Response({"error": "You do not have a shop yet."}, status=status.HTTP_400_BAD_REQUEST)

        products = Product.objects.filter(shop=shop).prefetch_related('variants', 'images', 'category')
        serializer = ProductSerializer(products, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):        
        shop = self.get_shop(request.user)
        if not shop:
             return Response({"error": "Please register a shop first."}, status=status.HTTP_403_FORBIDDEN)

        serializer = ProductSerializer(data=request.data)
        
        if serializer.is_valid():
            try:
                # Dùng atomic để đảm bảo nếu lưu ảnh/variant lỗi thì rollback cả Product
                with transaction.atomic():
                    serializer.save(shop=shop)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            except Exception as e:
                return Response(
                    {"error": "System error while creating product", "details": str(e)}, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class SellerProductDetailView(APIView):
    """
    API dành cho chủ Shop:
    - GET: Xem chi tiết SP của mình.
    - PUT: Cập nhật SP.
    - DELETE: Xóa SP.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    renderer_classes = [JSONRenderer]
    parser_classes = [JSONParser, MultiPartParser, FormParser]
    
    def get_object(self, request, product_id):
        # Chỉ lấy sản phẩm thuộc sở hữu của user đang đăng nhập
        try:
            return Product.objects.get(id=product_id, shop__owner=request.user)
        except Product.DoesNotExist:
            return None

    def get(self, request, product_id):
        product = self.get_object(request, product_id)
        if not product:
            return Response(PRODUCT_NOT_FOUND_MSG, status=status.HTTP_404_NOT_FOUND)
            
        serializer = ProductSerializer(product)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, product_id):
        product = self.get_object(request, product_id)
        if not product:
            return Response(PRODUCT_NOT_FOUND_MSG, status=status.HTTP_404_NOT_FOUND)

        serializer = ProductSerializer(product, data=request.data, partial=True)
        
        if serializer.is_valid():
            try:
                with transaction.atomic():
                    serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            except Exception as e:
                return Response(
                    {"error": "Error updating product", "details": str(e)}, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
                
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, product_id):
        product = self.get_object(request, product_id)
        if not product:
            return Response(PRODUCT_NOT_FOUND_MSG, status=status.HTTP_404_NOT_FOUND)
            
        product_name = product.product_name

        product.delete()

        return Response(
            {"message": f"Product '{product_name}' deleted successfully"}, 
            status=status.HTTP_204_NO_CONTENT
        )