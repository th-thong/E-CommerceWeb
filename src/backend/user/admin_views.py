from rest_framework.decorators import api_view, authentication_classes, permission_classes, renderer_classes
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework.renderers import JSONRenderer
from rest_framework.response import Response
from rest_framework import status
from user.models import User
from django.db import models
from django.contrib.auth.models import AbstractUser, Group, Permission
from user.serializers import UserSerializer
from drf_spectacular.utils import extend_schema, OpenApiParameter, inline_serializer
from rest_framework import serializers
from rest_framework.permissions import IsAdminUser
import json

@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAdminUser]) 
@renderer_classes([JSONRenderer])
def get_users(request):
    try:
        users = User.objects.filter(is_staff = False)
        serializer = UserSerializer(users, many = True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error":str(e)}, status=status.HTTP_200_OK)


@api_view(['GET','PUT','DELETE'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAdminUser]) 
@renderer_classes([JSONRenderer])
def handle_admin_user_api(request, user_id):
    if request.method == 'PUT':
        return update_user(request, user_id)
    elif request.method == 'DELETE':
        return delete_user(request, user_id)
    elif request.method == 'GET':
        return get_user(request, user_id)

def get_user(request, user_id):
    try:
        user = User.objects.get(id = user_id)
        serializer = UserSerializer(user)
        return Response(serializer.data, status = status.HTTP_200_OK)
    except Exception as e:
        return Response({"error":str(e)}, status=status.HTTP_200_OK)

def update_user(request, user_id):
    try:
        data = json.loads(request.body)

        role = data.get("role")
        sta = data.get("status")

        prev_user = User.objects.get(id = user_id)
        if role is not None:
            group = Group.objects.get(name = role)
            prev_user.groups.add(group)
        if sta is not None:
            User.objects.filter(id = user_id).update(status = sta)
            
        user = User.objects.get(id = user_id)
        serializer = UserSerializer(user)
        return Response(serializer.data, status = status.HTTP_200_OK)
    except Exception as e:
        return Response({"error":str(e)}, status=status.HTTP_200_OK)
    
def delete_user(request, user_id):
    try:
        user = User.objects.get(id = user_id)
        user.delete()
        return Response({"message":"User deleted successfull"}, status = status.HTTP_204_NO_CONTENT)
    except Exception as e:
        return Response({"error":str(e)}, status=status.HTTP_200_OK)
    

@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAdminUser]) 
@renderer_classes([JSONRenderer])
def get_pending_users(request):
    try:
        users = User.objects.filter(is_staff = False, status = 'pending')
        serializer = UserSerializer(users, many = True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error":str(e)}, status=status.HTTP_200_OK)
    