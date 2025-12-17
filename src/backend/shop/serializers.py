from rest_framework import serializers
from .models import Shop
from django.contrib.auth.models import Group
from order.models import OrderDetail


class ShopSerializer(serializers.ModelSerializer):
    shop_id = serializers.IntegerField(source='id')
    class Meta:
        model=Shop
        fields=['shop_id','shop_name', "owner"]
        extra_kwargs = {'owner':{'read_only':True}}
        
        
class ShopRegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model=Shop
        fields=['shop_name']
        
    def create(self, validated_data):
        shop = Shop.objects.create(**validated_data)
        seller_group, _ = Group.objects.get_or_create(name='Seller')
        shop.owner.groups.add(seller_group)
        return shop
    
    
class UpdateOrderStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderDetail
        fields = ['order_status', 'payment_status']
        
    def validate_order_status(self, value):
        return value