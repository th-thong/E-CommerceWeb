from rest_framework.decorators import api_view,renderer_classes
from rest_framework.renderers import JSONRenderer
from rest_framework.response import Response
from .models import Category
from .serializers import CategorySerializer
from rest_framework import status
from drf_spectacular.utils import extend_schema


@extend_schema(
    responses={200: CategorySerializer(many=True)},
    summary="Lấy danh sách danh mục",
    description="API trả về toàn bộ danh mục sản phẩm có trong hệ thống."
)
@api_view(['GET'])
@renderer_classes([JSONRenderer])
def get_category_list(request):
    categories = Category.objects.all()
    serializer = CategorySerializer(categories, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)