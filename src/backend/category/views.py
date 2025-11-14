from rest_framework.decorators import api_view, authentication_classes, permission_classes, renderer_classes, throttle_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.renderers import JSONRenderer
from http.client import HTTPResponse
from rest_framework.response import Response
from .models import Category
from .serializers import CategorySeriallizer

@api_view(['GET'])
@renderer_classes([JSONRenderer])
def get_category_list(request):
    caterories = Category.objects.all()
    categories = CategorySeriallizer(categories, many=True)
    return Response(categories.data)