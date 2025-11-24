from rest_framework import serializers
from .models import Product, ProductImage
from django.contrib.auth.models import Group
from .utils import upload_image, rename_product_image

class PublicProductSerializer(serializers.ModelSerializer):
    product_id = serializers.IntegerField(source='id',read_only=True)
    class Meta:
        model=Product
        fields=['product_id','product_name', 'description', 'price', 'quantity', 'discount','category']
        read_only_fields = ['shop']
        
class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ['id', 'image_url', 'file_id']
        
class PrivateProductSerializer(serializers.ModelSerializer):
    images = ProductImageSerializer(many=True, required=False, read_only=True)
    product_id = serializers.IntegerField(source='id',read_only=True)
    
    uploaded_images = serializers.ListField(
        child=serializers.ImageField(max_length=1000000, allow_empty_file=False, use_url=False),
        write_only=True,
        required=False
    )
    
    class Meta:
        model=Product
        fields=['product_id','product_name', 'description', 'price', 'quantity', 'discount','category', 'images','uploaded_images']
        read_only_fields = ['shop']
        
    def create(self, validated_data):

        # Tách dữ liệu ảnh
        uploaded_images = validated_data.pop('uploaded_images', []) 

        # Tạo đối tượng Product
        product = Product.objects.create(**validated_data) 

        for image in uploaded_images:
            file_name=rename_product_image(image.name)
            upload_response = upload_image(image, file_name)

            if upload_response:

                ProductImage.objects.create(
                    product=product,
                    image_url=upload_response['url'],
                    file_id=upload_response['fileId']
                )

        return product