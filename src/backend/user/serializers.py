from rest_framework import serializers
from .models import User

class UserSeriallizer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='username')
    user_id = serializers.IntegerField(source='id')
    class Meta:
        model=User
        fields=['user_id', 'user_name', 'email', 'role', 'status']