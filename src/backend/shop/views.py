from rest_framework.decorators import api_view, authentication_classes, permission_classes, renderer_classes, throttle_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.renderers import JSONRenderer
from http.client import HTTPResponse
from rest_framework.response import Response
from .serializers import ShopSerializer
from .permissions import IsOwner


@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated, IsOwner])
@renderer_classes([JSONRenderer])
def get_shop_info(request):
    shop=request.user.shop
    shop=ShopSerializer(shop)
    return Response(shop.data)

