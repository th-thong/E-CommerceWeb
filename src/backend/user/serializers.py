from rest_framework import serializers
from .models import User

class UserSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='username')
    user_id = serializers.IntegerField(source='id')
    class Meta:
        model=User
        fields=['user_id', 'user_name', 'email', 'role', 'status']
        
    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        
        instance = super().update(instance, validated_data)
        
        if password:
            instance.set_password(password)
            instance.save()
            
        return instance