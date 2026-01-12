from rest_framework.decorators import api_view, authentication_classes, permission_classes, renderer_classes
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework.renderers import JSONRenderer
from rest_framework.response import Response
from rest_framework import status
from feedback.models import Feedback
from feedback.serializers import FeedbackSerializer, NewFeedbackSerializer
from drf_spectacular.utils import extend_schema, OpenApiParameter, inline_serializer
from rest_framework import serializers
from rest_framework.permissions import IsAdminUser

@extend_schema(
    tags=['Admin - Feedback'],
    summary="Lấy danh sách các feedback bị cấm",
    responses={200: FeedbackSerializer(many=True)}
)
@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAdminUser]) 
@renderer_classes([JSONRenderer])
def get_feedback(request, product_id):
    feedbacks = Feedback.objects.filter(product_id=product_id, status='banned').order_by('-created_at')
    
    if not feedbacks.exists():
        return Response([], status=status.HTTP_200_OK) 
        
    serializer = FeedbackSerializer(feedbacks, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)

@extend_schema(
    tags=['Admin - Feedback'],
    summary="Lấy danh sách tất cả feedbacks",
    description="Lấy tất cả đánh giá của tất cả sản phẩm (bao gồm cả normal và banned) để admin kiểm duyệt",
    responses={200: FeedbackSerializer(many=True)}
)
@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAdminUser]) 
@renderer_classes([JSONRenderer])
def get_all_feedbacks(request):
    """
    Lấy tất cả feedbacks của tất cả sản phẩm (parent=None, chỉ lấy feedback chính, không lấy replies)
    Bao gồm cả status='normal' và status='banned'
    """
    try:
        feedbacks = Feedback.objects.filter(
            parent__isnull=True
        ).select_related('product', 'user').prefetch_related('replies').order_by('-created_at')
        
        # Serialize với thông tin product
        result = []
        for feedback in feedbacks:
            feedback_data = FeedbackSerializer(feedback).data
            feedback_data['product_id'] = feedback.product.id
            feedback_data['product_name'] = feedback.product.product_name
            result.append(feedback_data)
        
        return Response(result, status=status.HTTP_200_OK)
        
    except Exception as e:
        print(f"Error getting all feedbacks: {e}")
        return Response(
            {'message': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@extend_schema(
    tags=['Admin - Feedback'],
    summary="Duyệt feedback",
    parameters=[
        OpenApiParameter(
            name='feedback_id',
            type=int,
            location=OpenApiParameter.PATH,
            description='ID của feedback',
            required=True
        )
    ],
    responses={
        200: FeedbackSerializer,
        400: inline_serializer(
            name='ApproveFeedbackError',
            fields={'error': serializers.CharField()}
        )
    }
)
@api_view(['PUT'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAdminUser]) 
@renderer_classes([JSONRenderer])
def approve_feedback(request, feedback_id):
    """
    Duyệt feedback (chuyển status từ 'pending' sang 'normal')
    """
    try:
        Feedback.objects.filter(id = feedback_id).update(status = 'normal')
        feedback = Feedback.objects.get(id = feedback_id)
        serializer = FeedbackSerializer(feedback)
        return Response(serializer.data, status = status.HTTP_200_OK)
    except Exception as e:
        return Response({"error":str(e)}, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(
    tags=['Admin - Feedback'],
    summary="Xóa feedback",
    parameters=[
        OpenApiParameter(
            name='feedback_id',
            type=int,
            location=OpenApiParameter.PATH,
            description='ID của feedback cần xóa',
            required=True
        )
    ],
    responses={
        204: None,
        400: inline_serializer(
            name='DeleteFeedbackError',
            fields={'error': serializers.CharField()}
        )
    }
)
@api_view(['DELETE'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAdminUser]) 
@renderer_classes([JSONRenderer])
def delete_feedback(request, feedback_id):
    """
    Xóa feedback (xóa vĩnh viễn khỏi database)
    """
    try:
        feedback = Feedback.objects.get(id=feedback_id)
        feedback.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    except Feedback.DoesNotExist:
        return Response({"error": "Feedback không tồn tại"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
