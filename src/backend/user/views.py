from django.shortcuts import render
from . import views
from .models import User
from django.http import JsonResponse

def get_user_list(request):
    users = User.objects.all()
    user_list=[user.to_dict() for user in users]
    return JsonResponse(user_list,safe=False)