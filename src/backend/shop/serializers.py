from rest_framework import serializers
from .models import Shop

class ShopSerializer(serializers.ModelSerializer):
    shop_id = serializers.IntegerField(source='id')
    class Meta:
        model=Shop
        fields=['shop_id', 'shop_name', "owner"]
        
        
class ShopRegisterSerializer(serializers.ModelSerializer):
    shop_id = serializers.IntegerField(source='id')
    class Meta:
        model=Shop
        fields=['shop_id', 'shop_name']
        
    def create(self, validated_data):
        shop = Shop.objects.create(
            shop_name=validated_data['shop_name'],
            owner=validated_data['user'],
        )
        shop.save()
        return shop