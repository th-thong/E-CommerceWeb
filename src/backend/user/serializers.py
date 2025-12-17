from rest_framework import serializers
from django.contrib.auth import get_user_model
User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='username', read_only=True)
    user_id = serializers.IntegerField(source='id', read_only=True)

    role = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['user_id', 'user_name', 'email', 'status', 'address','phone_number' ,'role']
        extra_kwargs = {
            'password': {'write_only': True},
            'status': {'read_only': True},
            'email': {'read_only': True},
        }

    def get_role(self, obj):
        if obj.is_superuser or obj.is_staff:
            return "Admin"

        if obj.groups.filter(name='Seller').exists():
            return "Seller"

        return "Buyer"

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)

        instance = super().update(instance, validated_data)

        if password:
            instance.set_password(password)
            instance.save()

        return instance

class UserRegisterSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='username')
    class Meta:
        model=User
        fields=['user_name', 'email', 'password']
        extra_kwargs = {'password': {'write_only': True},'id':{'read_only': True}}  
         
    def create(self, validated_data):
        user = User.objects.create(
            username=validated_data['username'],
            email=validated_data['email'],
        )
        user.set_password(validated_data['password'])
        user.save()
        return user