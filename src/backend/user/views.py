from rest_framework.decorators import api_view, authentication_classes, permission_classes, renderer_classes, throttle_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.renderers import JSONRenderer
from http.client import HTTPResponse
from rest_framework.response import Response
from .serializers import UserSeriallizer
from .models import User
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import AuthenticationFailed

@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
@renderer_classes([JSONRenderer])
def get_user_profile(request):
    user=request.user
    user=UserSeriallizer(user)
    return Response(user.data)


@api_view(['POST'])
@renderer_classes([JSONRenderer])
def register(request):
    data=request.data
    username = data.get('user_name')
    email = data.get('email')
    password = data.get('password')
    role = data.get('role')

    if not email or not password or not username:
        return Response({"message" : "Đã có lỗi xảy ra"}, status = 401)

    if User.find_by_username(username):
        return Response({"message": "Đã có lỗi xảy ra"})
    
    if User.find_by_email(email):
        return Response({"message" : "Đã có lỗi xảy ra"})
    
    user = User(username = username, email=email)
    
    user.set_password(password)
    if role != None:
        user.role = role
        
    user.save()
    return Response({}, status=201)

@api_view(['POST'])
@renderer_classes([JSONRenderer])
def login(request):
    data=request.data
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return Response({"message" : "Đã có lỗi xảy ra"}, status = 401)
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        user = None

    if user is None or not user.check_password(password):
        return Response({"message" : "Đã có lỗi xảy ra"}, status = 401)
    
    refresh = RefreshToken.for_user(user)
    access_token = str(refresh.access_token)
    refresh_token = str(refresh)
    
    return Response({
        "access": access_token,
        "refresh": refresh_token 
    }, status = 200)
