from rest_framework import serializers
from .models import Shop

class ShopSeriallizer(serializers.ModelSerializer):
    shop_id = serializers.IntegerField(source='id')
    class Meta:
        model=Shop
        fields=['shop_id', 'shop_name', 'owner']