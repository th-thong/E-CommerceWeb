from rest_framework.decorators import api_view, authentication_classes, permission_classes, renderer_classes
from rest_framework.authentication import TokenAuthentication # Hoặc JWTAuthentication của bạn
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated
from rest_framework.renderers import JSONRenderer
from rest_framework.response import Response
from rest_framework import status
from .models import Feedback
from .serializers import FeedbackSerializer, NewFeedbackSerializer

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