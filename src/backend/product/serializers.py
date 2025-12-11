from rest_framework import serializers
from django.db import transaction
from .models import Product, ProductImage, ProductVariant
from .utils import upload_image, rename_product_image
import json

# 1. Serializer cho Variant (Chỉ để hiển thị và validate data con)
class ProductVariantSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductVariant
        fields = ['id', 'sku', 'price', 'quantity', 'attributes', 'is_active']

# 2. Serializer cho Image (Hiển thị)
class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ['id', 'image_url', 'file_id', 'order']

# 3. Serializer CHÍNH 
class ProductSerializer(serializers.ModelSerializer):
    # --- READ ONLY FIELDS (Để hiển thị ra JSON) ---
    product_id = serializers.IntegerField(source='id', read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    variants = ProductVariantSerializer(many=True, read_only=True)
    
    # 1. Nhận danh sách file ảnh upload
    uploaded_images = serializers.ListField(
        child=serializers.ImageField(max_length=1000000, allow_empty_file=False, use_url=False),
        write_only=True,
        required=False
    )
    # 2. Nhận danh sách thông tin variants (JSON List)
    variants_input = serializers.JSONField(
        write_only=True,
        required=False
    )

    class Meta:
        model = Product
        fields = [
            'product_id', 'product_name', 'description', 
            'base_price', 'discount', 'category', 'shop',
            'is_active', 'created_at', 'updated_at',
            'images', 'variants',           # Output
            'uploaded_images', 'variants_input' # Input
        ]
        read_only_fields = ['shop', 'created_at', 'updated_at']


    def create(self, validated_data):
        uploaded_images = validated_data.pop('uploaded_images', [])
        variants_data = validated_data.pop('variants_input', [])

        # --- 1. VALIDATE DỮ LIỆU ĐẦU VÀO ---
        if not isinstance(variants_data, list):
             raise serializers.ValidationError({"variants_input": "Dữ liệu phải là một danh sách."})

        if not variants_data:
             raise serializers.ValidationError({"variants_input": "Phải có ít nhất 1 biến thể sản phẩm."})

        # Kiểm tra trùng lặp SKU trước khi tạo
        for index, variant in enumerate(variants_data):
            sku_to_check = variant.get('sku')
            
            # Kiểm tra thiếu trường
            if not sku_to_check:
                raise serializers.ValidationError({f"variants_input[{index}]": "Thiếu trường 'sku'."})
            if 'price' not in variant:
                raise serializers.ValidationError({f"variants_input[{index}]": "Thiếu trường 'price'."})

            # Kiểm tra SKU đã tồn tại trong DB chưa
            if ProductVariant.objects.filter(sku=sku_to_check).exists():
                raise serializers.ValidationError({
                    f"variants_input[{index}][sku]": f"Mã SKU '{sku_to_check}' đã tồn tại. Vui lòng chọn mã khác."
                })
        # -----------------------------------

        # --- 2. TẠO DỮ LIỆU (Khi đã qua bài kiểm tra) ---
        product = Product.objects.create(**validated_data)

        for variant_data in variants_data:
            ProductVariant.objects.create(product=product, **variant_data)

        for image in uploaded_images:
            file_name = rename_product_image(image.name)
            upload_response = upload_image(image, file_name)
            if upload_response:
                ProductImage.objects.create(
                    product=product,
                    image_url=upload_response['url'],
                    file_id=upload_response['fileId']
                )
        
        return product

    def update(self, instance, validated_data):
        uploaded_images = validated_data.pop('uploaded_images', [])
        variants_data = validated_data.pop('variants_input', [])

        # 1. Update thông tin cơ bản
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # 2. Xử lý ảnh mới
        for image in uploaded_images:
            file_name = rename_product_image(image.name)
            upload_response = upload_image(image, file_name)
            if upload_response:
                ProductImage.objects.create(
                    product=instance,
                    image_url=upload_response['url'],
                    file_id=upload_response['fileId']
                )

        # 3. Xử lý Variants
        if variants_data:
            variants_data = self._parse_variant_attributes(variants_data)

            for variant_data in variants_data:
                ProductVariant.objects.create(product=instance, **variant_data)

        return instance