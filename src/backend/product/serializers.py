from rest_framework import serializers
from .models import Product, ProductImage
from django.contrib.auth.models import Group

class PublicProductSerializer(serializers.ModelSerializer):
    product_id = serializers.IntegerField(source='id',read_only=True)
    class Meta:
        model=Product
        fields=['product_id','product_name', 'description', 'price', 'quantity', 'discount','category']
        read_only_fields = ['shop']
        
class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ['image_file']
        
class PrivateProductSerializer(serializers.ModelSerializer):
    images = ProductImageSerializer(many=True, required=False)
    product_id = serializers.IntegerField(source='id',read_only=True)
    class Meta:
        model=Product
        fields=['product_id','product_name', 'description', 'price', 'quantity', 'discount','category', 'images']
        read_only_fields = ['shop']
        
    def create(self, validated_data):
        # Tách dữ liệu ảnh
        images_data = validated_data.pop('images', []) 
        
        # Tạo đối tượng Product
        product = Product.objects.create(**validated_data) 

        for image_data in images_data:
            ProductImage.objects.create(product=product, **image_data)
            
        return product