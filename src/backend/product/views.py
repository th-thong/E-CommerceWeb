from rest_framework.decorators import api_view, authentication_classes, permission_classes, renderer_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.renderers import JSONRenderer
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from django.core.exceptions import ObjectDoesNotExist
from django.db import transaction
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from .serializers import PublicProductSerializer, ProductImageSerializer, PrivateProductSerializer
from .models import Product
from .serializers import PublicProductSerializer, PrivateProductSerializer


PRODUCT_NOT_FOUND_MSG = {"error": "Product not found or you do not have permission."}


@api_view(['GET'])
@renderer_classes([JSONRenderer])
@permission_classes([AllowAny])
def get_list_of_public_product(request):
    product_list = Product.objects.filter(is_active=True).prefetch_related(
        'variants', 
        'images',
        'category',
        'shop'
    ).order_by('-created_at')
    
    serializer = PublicProductSerializer(product_list, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['GET'])
@renderer_classes([JSONRenderer])
@permission_classes([AllowAny])
def get_public_product_detail(request, product_id):
    try:
        product = Product.objects.prefetch_related('variants', 'images').get(
            id=product_id, 
            is_active=True
        )
        serializer = PublicProductSerializer(product)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Product.DoesNotExist:
        return Response({"error": "Product not found"}, status=status.HTTP_404_NOT_FOUND)



class SellerProductListCreateView(APIView):
    """
    GET: Lấy danh sách sản phẩm của chính shop mình.
    POST: Tạo mới sản phẩm (kèm variants).
    """
    
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    renderer_classes = [JSONRenderer]
    parser_classes = [JSONParser, MultiPartParser, FormParser] 

    def get(self, request):
        try:
            shop = request.user.shop
        except ObjectDoesNotExist:
             return Response({"error": "You do not have a shop yet."}, status=status.HTTP_400_BAD_REQUEST)

        products = Product.objects.filter(shop=shop).prefetch_related('variants', 'images')
        serializer = PrivateProductSerializer(products, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):        
        try:
            shop = request.user.shop
        except ObjectDoesNotExist:
             return Response({"error": "Please register a shop first."}, status=status.HTTP_403_FORBIDDEN)

        serializer = PrivateProductSerializer(data=request.data)
        
        if serializer.is_valid():
            try:
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
    GET: Xem chi tiết 1 sản phẩm của mình.
    PUT: Cập nhật thông tin (chung + variants).
    DELETE: Xóa sản phẩm.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    renderer_classes = [JSONRenderer]
    
    def get_object(self, request, product_id):
        try:
            return Product.objects.get(id=product_id, shop__owner=request.user)
        except Product.DoesNotExist:
            return None

    def get(self, request, product_id):
        product = self.get_object(request, product_id)
        if not product:
            return Response(PRODUCT_NOT_FOUND_MSG, status=status.HTTP_404_NOT_FOUND)
            
        serializer = PrivateProductSerializer(product)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, product_id):
        product = self.get_object(request, product_id)
        if not product:
            return Response(PRODUCT_NOT_FOUND_MSG, status=status.HTTP_404_NOT_FOUND)

        serializer = PrivateProductSerializer(product, data=request.data, partial=True)
        
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

def get_public_trendy_product(request):
    pass

def get_public_recommend_product(request):
    pass