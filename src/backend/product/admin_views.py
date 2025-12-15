from rest_framework.decorators import api_view, authentication_classes, permission_classes, renderer_classes
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework.renderers import JSONRenderer
from rest_framework.response import Response
from rest_framework import status
from product.models import Product
from product.serializers import ProductSerializer, ProductVariantSerializer, ProductImageSerializer
from drf_spectacular.utils import extend_schema, OpenApiParameter, inline_serializer
from rest_framework import serializers
from rest_framework.permissions import IsAdminUser


@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAdminUser]) 
@renderer_classes([JSONRenderer])
def get_products(request):
    try:
        products = Product.objects.filter(is_active = False)
        serializer = ProductSerializer(products, many = True)
        return Response(serializer.data, status = status.HTTP_200_OK)
    except Exception as e:
        return Response({"error":str(e)}, status=status.HTTP_200_OK)
    
@api_view(['GET','PUT'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAdminUser]) 
@renderer_classes([JSONRenderer])
def handle_admin_product_api(request, product_id):
    if request.method == 'GET':
        return get_product(request, product_id)
    elif request.method == 'PUT':
        return approve_product(request,product_id)

def get_product(request, product_id):
    try:
        product = Product.objects.get(id = product_id)
        serializer = ProductSerializer(product)
        return Response(serializer.data, status = status.HTTP_200_OK)
    except Exception as e:
        return Response({"error":str(e)}, status=status.HTTP_200_OK)
    
def approve_product(request, product_id):
    try:
        Product.objects.filter(id = product_id).update(is_active = True)
        product = Product.objects.get(id = product_id)
        serializer = ProductSerializer(product)
        return Response(serializer.data, status = status.HTTP_200_OK)
    except Exception as e:
        return Response({"error":str(e)}, status=status.HTTP_200_OK)
    