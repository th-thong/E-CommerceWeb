from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.renderers import JSONRenderer
from rest_framework.response import Response
from .serializers import ShopSerializer, ShopRegisterSerializer
from rest_framework import status
from rest_framework.views import APIView
from django.core.exceptions import ObjectDoesNotExist
from drf_spectacular.utils import extend_schema_view, extend_schema, inline_serializer
from rest_framework import serializers

@extend_schema_view(
    get=extend_schema(responses=ShopSerializer, summary="Lấy thông tin shop của tôi"),
    put=extend_schema(request=inline_serializer(
        name = 'ChangeShopInfo',
        fields={
            'shop_name': serializers.CharField(),
        }
    ), responses=ShopSerializer, summary="Cập nhật thông tin shop"),
    post=extend_schema(request=ShopRegisterSerializer, responses=ShopSerializer, summary="Đăng ký shop mới")
)
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