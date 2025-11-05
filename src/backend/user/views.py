from rest_framework.decorators import api_view, authentication_classes, permission_classes, renderer_classes, throttle_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.renderers import JSONRenderer
from http.client import HTTPResponse
from rest_framework.response import Response
from .serializers import UserSeriallizer


@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
@renderer_classes([JSONRenderer])
def get_user_profile(request):
    user=request.user
    user=UserSeriallizer(user)
    return Response(user.data)



@api_view(['PUT'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
@renderer_classes([JSONRenderer])
def change_user_profile(request):
    user=request.user
    
    for key,value in request.data.items():
        if key != 'id':
            setattr(user,key,value)
    user.save()
    user=UserSeriallizer(user)
    return Response(user.data)