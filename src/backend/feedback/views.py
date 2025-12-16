from rest_framework.decorators import api_view, authentication_classes, permission_classes, renderer_classes
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework.renderers import JSONRenderer
from rest_framework.response import Response
from rest_framework import status
from .models import Feedback
from .serializers import FeedbackSerializer, NewFeedbackSerializer
from drf_spectacular.utils import extend_schema, OpenApiParameter, inline_serializer
from rest_framework import serializers

@extend_schema(
    tags=['Feedback'],
    methods=['GET'],
    summary="Xem danh sách đánh giá",
    description="Lấy danh sách các đánh giá đã được duyệt (status='normal') của một sản phẩm cụ thể.",
    parameters=[
        OpenApiParameter(
            name='product_id', 
            type=int, 
            location=OpenApiParameter.PATH, 
            description='ID của sản phẩm cần xem đánh giá',
            required=True
        )
    ],
    responses={
        200: FeedbackSerializer(many=True)
    }
)
@extend_schema(
    tags=['Feedback'],
    methods=['POST'],
    summary="Gửi đánh giá mới",
    description="Người dùng (đã đăng nhập) gửi đánh giá và nhận xét cho sản phẩm.",
    request=NewFeedbackSerializer,
    parameters=[
        OpenApiParameter(
            name='product_id', 
            type=int, 
            location=OpenApiParameter.PATH, 
            description='ID của sản phẩm muốn đánh giá',
            required=True
        )
    ],
    responses={
        201: inline_serializer(
            name='FeedbackSuccess',
            fields={'message': serializers.CharField(default="Cảm ơn bạn! Đánh giá của bạn đã được gửi.")}
        ),
        400: inline_serializer(
            name='FeedbackError',
            fields={'message': serializers.CharField()}
        )
    }
)
@api_view(['GET', 'POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticatedOrReadOnly]) 
@renderer_classes([JSONRenderer])
def handle_feedback(request, product_id):
    if request.method == 'GET':
        return get_feedback(request, product_id)
    elif request.method == 'POST':
        return create_feedback(request, product_id)

def get_feedback(request, product_id):
    feedbacks = Feedback.objects.filter(product_id=product_id, status='normal').order_by('-created_at')
    
    if not feedbacks.exists():
        return Response([], status=status.HTTP_200_OK) 
        
    serializer = FeedbackSerializer(feedbacks, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)

def create_feedback(request, product_id):

    serializer = NewFeedbackSerializer(
        data=request.data, 
        context={"request": request, "product_id": product_id}
    )

    if serializer.is_valid():
        try:
            serializer.save()
            return Response(
                {"message": "Cảm ơn bạn! Đánh giá của bạn đã được gửi."}, 
                status=status.HTTP_201_CREATED
            )
        except Exception as e:
            print(f"Error creating feedback: {e}") 
            return Response(
                {'message': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)