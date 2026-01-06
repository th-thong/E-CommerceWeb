from rest_framework import serializers
from django.core.exceptions import ObjectDoesNotExist
from django.contrib.auth import get_user_model
User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='username', read_only=True)
    user_id = serializers.IntegerField(source='id', read_only=True)

    role = serializers.SerializerMethodField()
    shop_name = serializers.SerializerMethodField()
    shop_phone_number = serializers.SerializerMethodField()
    shop_address = serializers.SerializerMethodField()
    shop_email = serializers.SerializerMethodField()
    shop_description = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'user_id', 'user_name', 'email', 'status', 'address', 'phone_number', 'role',
            # Thông tin shop (nếu có)
            'shop_name', 'shop_phone_number', 'shop_address', 'shop_email', 'shop_description'
        ]
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

    def _get_shop(self, obj):
        # Nếu user có shop (đăng ký seller), trả shop; nếu không trả None
        try:
            return obj.shop
        except ObjectDoesNotExist:
            return None

    def get_shop_name(self, obj):
        shop = self._get_shop(obj)
        return shop.shop_name if shop else None

    def get_shop_phone_number(self, obj):
        shop = self._get_shop(obj)
        return shop.shop_phone_number if shop else None

    def get_shop_address(self, obj):
        shop = self._get_shop(obj)
        return shop.shop_address if shop else None

    def get_shop_email(self, obj):
        shop = self._get_shop(obj)
        return shop.shop_email if shop else None

    def get_shop_description(self, obj):
        shop = self._get_shop(obj)
        return shop.description if shop else None

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