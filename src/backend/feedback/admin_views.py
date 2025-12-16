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

@api_view(['PUT'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAdminUser]) 
@renderer_classes([JSONRenderer])
def approve_feedback(request, feedback_id):
    try:
        Feedback.objects.filter(id = feedback_id).update(status = 'normal')
        feedback = Feedback.objects.get(id = feedback_id)
        serializer = FeedbackSerializer(feedback)
        return Response(serializer.data, status = status.HTTP_200_OK)
    except Exception as e:
        return Response({"error":str(e)}, status=status.HTTP_200_OK)
