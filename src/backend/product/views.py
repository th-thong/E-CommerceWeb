from rest_framework.decorators import api_view, authentication_classes, permission_classes, renderer_classes, throttle_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.renderers import JSONRenderer
from http.client import HTTPResponse
from rest_framework.response import Response
from .serializers import PublicProductSerializer, PrivateProductSerializer
from rest_framework import status
from rest_framework.views import APIView
from django.core.exceptions import ObjectDoesNotExist
from drf_spectacular.utils import extend_schema_view, extend_schema
from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import serializers
from .models import Product


ProductNotExistedResponse={"error":"Product with this id is not existed"}


"""
Các api liên quan đến product cho tất cả, kể cả guest
"""
@api_view(['GET'])
@renderer_classes([JSONRenderer])
def get_list_of_public_product(request):
    product_list=Product.objects.all()
    serializer  = PublicProductSerializer(product_list, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)

@api_view(['GET'])
@renderer_classes([JSONRenderer])
def get_public_product_detail(request, product_id):
    try:
        product=Product.objects.get(id=product_id)
        serializer = PublicProductSerializer(product)
        return Response(serializer.data,status=status.HTTP_200_OK)
    except Exception as e:
        return Response(ProductNotExistedResponse, status=status.HTTP_404_NOT_FOUND)



"""
Các api liên quan đến product cho seller
"""

@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
@renderer_classes([JSONRenderer])
def get_list_of_private_product(request):
    product_list = Product.objects.filter(shop__owner=request.user)
    serializer  = PrivateProductSerializer(product_list, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)

class PrivateProduct(APIView):
    renderer_classes=[JSONRenderer]
    authentication_classes=[JWTAuthentication]
    permission_classes=[IsAuthenticated]
    
    def get(self,request, product_id):
        try:
            product=Product.objects.get(id=product_id)
            serializer = PrivateProductSerializer(product)
            return Response(serializer.data,status=status.HTTP_200_OK)
        except Exception as e:
            return Response(ProductNotExistedResponse, status=status.HTTP_404_NOT_FOUND)
        
    def post(self, request):
        serializer = PrivateProductSerializer(data=request.data)
        
        if serializer.is_valid():
            try:
                serializer.save(shop=request.user.shop)
                
                return Response(
                    serializer.data, 
                    status=status.HTTP_201_CREATED
                )
                
            except Exception as e:
                
                return Response(
                    {"error": "An error occurred while adding the product.", "details": str(e)}, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        return Response(
            serializer.errors, 
            status=status.HTTP_400_BAD_REQUEST
        )
        
    def put(self,request, product_id):
        try:
            product=Product.objects.get(id=product_id)
            serializer = PrivateProductSerializer(product, data=request)
            serializer.save()
        except Exception as e:
            return Response(ProductNotExistedResponse, status=status.HTTP_404_NOT_FOUND)
        
    def delete(self, request, product_id):

        try:
            product =Product.objects.get(id=product_id)
            
            product_name = product.product_name
            product.delete()
            
            return Response(
                {"message": f"'{product_name}' has been deleted successfully"},
                status=status.HTTP_204_NO_CONTENT
            )
        
        except ObjectDoesNotExist: 
             return Response(
                 {"error": "This product does not existed"},
                 status=status.HTTP_404_NOT_FOUND
             )
    
    
def get_public_trendy_product(request):
    pass

def get_public_recommend_product(request):
    pass

