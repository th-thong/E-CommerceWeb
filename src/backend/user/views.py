from rest_framework.decorators import api_view, authentication_classes, permission_classes, renderer_classes, throttle_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.renderers import JSONRenderer
from http.client import HTTPResponse
from rest_framework.response import Response
from rest_framework import status
from .serializers import UserSerializer, UserRegisterSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import AuthenticationFailed
from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import serializers

from django.contrib.auth import get_user_model
User = get_user_model()

@api_view(['GET', 'PUT'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
@renderer_classes([JSONRenderer])
def user_profile(request):
    user = request.user
    
    if request.method == 'GET':
        serializer = UserSerializer(user)
        return Response(serializer.data)
        
    elif request.method == 'PUT':
        serializer = UserSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            try:
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            except Exception as e:
                return Response({"error":str(e)}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(
    request=UserRegisterSerializer, 
    responses={
        201: inline_serializer(
            name='RegisterSuccessResponse',
            fields={
                'message': serializers.CharField(default='Successfully created account', read_only=True)
            }
        ),
        400: inline_serializer(
            name='RegisterFailResponse',
            fields={
                'error': serializers.CharField(default='Fail to create account', read_only=True)
            }
        ),
    },
    summary="Đăng kí tài khoản"
)
@api_view(['POST'])
@renderer_classes([JSONRenderer])
def register(request):
    serializer = UserRegisterSerializer(data=request.data)
    if serializer.is_valid():
        try:
            serializer.save()
            return Response({"message":"Successfully created account"}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error":str(e)}, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@extend_schema(
    request= inline_serializer(
        name = 'LoginRequest',
        fields={
            'email': serializers.EmailField(default='example@gmail.com'),
            'password': serializers.CharField(write_only=True, default='12345678'), 
        }
    ),
    responses={
        201: inline_serializer(
            name='LoginSuccessResponse',
            fields={
                'message': serializers.CharField(default='Successfully login', read_only=True)
            }
        ),
        400: inline_serializer(
            name='LoginFailResponse',
            fields={
                'error': serializers.CharField(default='Fail to login', read_only=True)
            }
        ),
    },
    summary="Đăng nhập"
)
@api_view(['POST'])
@renderer_classes([JSONRenderer])
def login(request):
    data=request.data
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return Response({"message" : "Email and password are required"}, status = 400)
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        user = None

    if user is None or not user.check_password(password):
        return Response({"message" : "Incorrect email or password"}, status = 401)
    
    refresh = RefreshToken.for_user(user)
    access_token = str(refresh.access_token)
    refresh_token = str(refresh)
    
    return Response({
        "access": access_token,
        "refresh": refresh_token 
    }, status = 200)

