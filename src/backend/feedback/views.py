from django.shortcuts import render
from rest_framework.decorators import api_view, authentication_classes, permission_classes, renderer_classes, throttle_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.renderers import JSONRenderer
from http.client import HTTPResponse
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from django.core.exceptions import ObjectDoesNotExist
from drf_spectacular.utils import extend_schema_view, extend_schema
from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import serializers
from .models import Feedback
from .permissions import FeedbackPermission
from .serializers import FeedbackSerializer, NewFeedbackSerializer

# Hàm xử lý gọi hàm
@api_view(['GET','POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([FeedbackPermission])
@renderer_classes([JSONRenderer])
def handle_feedback(request, product_id):
    if request.method == 'GET':
        return get_feedback(request,product_id)
    elif request.method == 'POST':
        return create_feedback(request, product_id)

# Lấy đánh giá(api cho tất cả user)
def get_feedback(request, product_id):
    try:
        product_id = int(product_id)
        feedbacks = Feedback.objects.filter(product_id=product_id)
        print(FeedbackSerializer(feedbacks, many = True).data)
    except Exception as e:
        print(e)
        return Response({'message':'Không có đánh giá nào'}, status = status.HTTP_404_NOT_FOUND)
    return Response(FeedbackSerializer(feedbacks, many = True).data, status.HTTP_200_OK)

# Tạo đánh giá (api dành cho người dùng đã đăng nhập)
def create_feedback(request, product_id):
    serializer = NewFeedbackSerializer(data = request.data, context = {"request" : request, "product_id": product_id})

    if serializer.is_valid():
        try:
            serializer.save()
            return Response({"message: Cảm ơn bạn! Đánh giá của bạn đã được gửi và sẽ hiển thị sau khi được kiểm duyệt."}, status = status.HTTP_200_OK)
        except Exception as e:
            print(e)
            return Response({'message': 'Tạo đánh giá không thành công'}, status = status.HTTP_400_BAD_REQUEST)
    return Response({'message' : serializer.errors}, status = status.HTTP_400_BAD_REQUEST)