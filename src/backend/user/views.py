from rest_framework.decorators import api_view, authentication_classes, permission_classes, renderer_classes, throttle_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.renderers import JSONRenderer
from http.client import HTTPResponse
from rest_framework.response import Response
from rest_framework import status
from .serializers import UserSerializer


@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
@renderer_classes([JSONRenderer])
def get_user_profile(request):
    user=request.user
    user=UserSerializer(user)
    return Response(user.data)



@api_view(['PUT'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
@renderer_classes([JSONRenderer])
def change_user_profile(request):
    user = request.user
    serializer = UserSerializer(user, data=request.data, partial=True)
        
    if serializer.is_valid() :
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)
        
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)