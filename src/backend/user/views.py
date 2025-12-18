from rest_framework.decorators import api_view, authentication_classes, permission_classes, renderer_classes, throttle_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.renderers import JSONRenderer
from rest_framework.response import Response
from rest_framework import status
from .serializers import UserSerializer, UserRegisterSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import serializers
from rest_framework.views import APIView
from django.core.cache import cache
from django.core.mail import send_mail
import random
from django.conf import settings

from django.contrib.auth import get_user_model
User = get_user_model()

@extend_schema(
    tags=['User'],
    methods=['GET'],
    summary="Lấy thông tin cá nhân (Profile)",
    description="Trả về thông tin chi tiết của người dùng đang đăng nhập dựa trên Token gửi kèm.",
    responses={
        200: UserSerializer,
    }
)
@extend_schema(
    tags=['User'],
    methods=['PUT'],
    summary="Cập nhật thông tin cá nhân",
    description="Cho phép cập nhật một phần thông tin (username,...). Chỉ cần gửi các trường muốn thay đổi.",
    request=UserSerializer,
    responses={
        200: UserSerializer,
        400: inline_serializer(
            name='UpdateProfileError',
            fields={'error': serializers.CharField(default='Bad Request / Update Failed')}
        )
    }
)
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
    tags=['Auth'],
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
    tags=['Auth'],
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
    
    if user.status =='banned':
        return Response({"message" : "Your account has been banned"}, status = 401)

    
    refresh = RefreshToken.for_user(user)
    access_token = str(refresh.access_token)
    refresh_token = str(refresh)
    
    return Response({
        "access": access_token,
        "refresh": refresh_token 
    }, status = 200)


class ForgotPasswordView(APIView):
    
    @extend_schema(
        tags=['Auth'],
        # 1. Định nghĩa Input: Chỉ cần Email
        request=inline_serializer(
            name='ForgotPasswordRequest',
            fields={
                'email': serializers.EmailField(help_text="Nhập email tài khoản cần khôi phục")
            }
        ),
        # 2. Định nghĩa Output
        responses={
            200: inline_serializer(
                name='ForgotPasswordSuccess',
                fields={'message': serializers.CharField(default='OTP code has been sent to your email.')}
            ),
            400: inline_serializer(
                name='ForgotPasswordError',
                fields={'error': serializers.CharField(default='Please enter email')}
            ),
            500: inline_serializer(
                name='EmailServiceError',
                fields={'error': serializers.CharField(default='Error sending email...')}
            )
        },
        summary="Quên mật khẩu (Gửi OTP)",
        description="Người dùng nhập Email. Hệ thống sẽ kiểm tra và gửi mã OTP (6 số) về email nếu tồn tại. OTP có hiệu lực 5 phút."
    )
    def post(self, request):
        email = request.data.get('email')
        
        if not email:
            return Response({'error': 'Please enter email'}, status=status.HTTP_400_BAD_REQUEST)

        # Kiểm tra email có tồn tại trong hệ thống không
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'message': 'If email exists please check email to get OTP'}, status=status.HTTP_200_OK)

        # Sinh OTP ngẫu nhiên 6 số
        otp = str(random.randint(100000, 999999))
        
        # 2. Lưu OTP vào Cache trong 5 phút (300 giây)
        cache_key = f"otp_reset_{email}"
        cache.set(cache_key, otp, timeout=300)

        # Gửi Email
        try:
            send_mail(
                subject='[ShopLiteX] Mã xác thực đặt lại mật khẩu',
                message=f'Xin chào,\n\nMã OTP của bạn là: {otp}\n\nMã này sẽ hết hạn sau 5 phút. Vui lòng không chia sẻ mã này cho ai.',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=False,
            )
        except Exception as e:
            return Response({'error': 'Error sending email, please try again later.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({'message': 'OTP code has been sent to your email, please check your spam email as well.'}, status=status.HTTP_200_OK)


class ResetPasswordView(APIView):
    
    @extend_schema(
        tags=['Auth'],
        # 1. Định nghĩa Input: Cần Email, OTP và Mật khẩu mới
        request=inline_serializer(
            name='ResetPasswordRequest',
            fields={
                'email': serializers.EmailField(),
                'otp': serializers.CharField(help_text="Mã OTP 6 số nhận được từ email"),
                'new_password': serializers.CharField(min_length=8, help_text="Mật khẩu mới")
            }
        ),
        # 2. Định nghĩa Output
        responses={
            200: inline_serializer(
                name='ResetPasswordSuccess',
                fields={'message': serializers.CharField(default='Password reset successful.')}
            ),
            400: inline_serializer(
                name='ResetPasswordError',
                fields={'error': serializers.CharField(default='Incorrect OTP code or Missing info.')}
            ),
            404: inline_serializer(
                name='UserNotFoundReset',
                fields={'error': serializers.CharField(default='User does not exist.')}
            )
        },
        summary="Xác thực OTP & Đổi mật khẩu",
        description="Người dùng gửi Email + OTP + Mật khẩu mới. Hệ thống kiểm tra OTP trong Cache, nếu đúng sẽ đổi mật khẩu."
    )
    def post(self, request):
        email = request.data.get('email')
        otp_input = request.data.get('otp')
        new_password = request.data.get('new_password')

        if not email or not otp_input or not new_password:
             return Response({'error': 'Missing information'}, status=status.HTTP_400_BAD_REQUEST)

        # 1. Lấy OTP từ Cache ra kiểm tra
        cache_key = f"otp_reset_{email}"
        cached_otp = cache.get(cache_key)

        # 2. Validate OTP
        if not cached_otp:
            return Response({'error': 'OTP code has expired or does not exist.'}, status=status.HTTP_400_BAD_REQUEST)
        
        if str(cached_otp) != str(otp_input):
            return Response({'error': 'Incorrect OTP code.'}, status=status.HTTP_400_BAD_REQUEST)

        # 3. OTP đúng
        try:
            user = User.objects.get(email=email)
            user.set_password(new_password)
            user.save()
            
            cache.delete(cache_key)
            
            return Response({'message': 'Password reset successful.'}, status=status.HTTP_200_OK)
            
        except User.DoesNotExist:
            return Response({'error': 'User does not exist.'}, status=status.HTTP_404_NOT_FOUND)