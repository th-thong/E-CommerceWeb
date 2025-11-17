from rest_framework.decorators import api_view, authentication_classes, permission_classes, renderer_classes, throttle_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.renderers import JSONRenderer
from http.client import HTTPResponse
from rest_framework.response import Response
from .serializers import ShopSerializer, ShopRegisterSerializer
from rest_framework import status
from rest_framework.views import APIView
from django.core.exceptions import ObjectDoesNotExist
from drf_spectacular.utils import extend_schema_view, extend_schema
from drf_spectacular.utils import extend_schema, inline_serializer
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

    def get(self, request):
        shop = self.get_object(request.user)
        if shop is None:
            return Response({"error": "You do not own any shop"}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = ShopSerializer(shop)
        return Response(serializer.data)

    def put(self, request):
        shop = self.get_object(request.user)
        if shop is None:
            return Response({"error": "You do not own any shop"}, status=status.HTTP_404_NOT_FOUND)

        serializer = ShopSerializer(shop, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
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