from rest_framework import serializers
from django.db import transaction
from .models import Product, ProductImage, ProductVariant
from .utils import upload_image, rename_product_image
import json
from django.conf import settings

# 1. Serializer cho Variant (Chỉ để hiển thị và validate data con)
class ProductVariantSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductVariant
        fields = ['id', 'price', 'quantity', 'attributes', 'is_active']

# 2. Serializer cho Image (Hiển thị)
class ProductImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = ProductImage
        fields = ['id', 'image_url', 'file_id', 'order']

    def get_image_url(self, obj):
            if not obj.image_url:
                return None
            
            if obj.image_url.startswith('http'):
                return obj.image_url
            request = self.context.get('request')
            if request is not None:
                return request.build_absolute_uri(obj.image_url)
            
            base = getattr(settings, 'LOCAL_URL', 'http://localhost:10000').rstrip('/')
            path = obj.image_url if obj.image_url.startswith('/') else f"/{obj.image_url}"
            return f"{base}{path}"


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
    # 3. Nhận danh sách image IDs cần xóa
    images_to_delete = serializers.JSONField(
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
            'uploaded_images', 'variants_input', 'images_to_delete' # Input
        ]
        read_only_fields = ['shop', 'created_at', 'updated_at']

    def _parse_variant_attributes(self, variants_data):
        """
        Parse và validate variants_data.
        Hỗ trợ cả JSON string và list.
        """
        # Nếu là string, parse thành JSON
        if isinstance(variants_data, str):
            try:
                variants_data = json.loads(variants_data)
            except json.JSONDecodeError:
                raise serializers.ValidationError({"variants_input": "Dữ liệu JSON không hợp lệ."})
        
        # Validate là list
        if not isinstance(variants_data, list):
            raise serializers.ValidationError({"variants_input": "Dữ liệu phải là một danh sách."})
        
        # Validate không rỗng
        if not variants_data:
            raise serializers.ValidationError({"variants_input": "Phải có ít nhất 1 biến thể sản phẩm."})
        
        # Validate từng variant
        parsed_variants = []
        for index, variant in enumerate(variants_data):
            if not isinstance(variant, dict):
                raise serializers.ValidationError({f"variants_input[{index}]": "Mỗi biến thể phải là một object."})
            
            # Kiểm tra các trường bắt buộc
            if 'price' not in variant or variant.get('price') is None or variant.get('price') == '':
                raise serializers.ValidationError({f"variants_input[{index}]": "Thiếu trường 'price'."})
            if 'quantity' not in variant or variant.get('quantity') is None or variant.get('quantity') == '':
                raise serializers.ValidationError({f"variants_input[{index}]": "Thiếu trường 'quantity'."})
            
            # Đảm bảo attributes là dict
            attributes = variant.get('attributes', {})
            if not isinstance(attributes, dict):
                attributes = {}
            
            # Tạo variant data với đúng format
            parsed_variant = {
                'price': variant['price'],
                'quantity': variant['quantity'],
                'attributes': attributes,
            }
            
            parsed_variants.append(parsed_variant)
        
        return parsed_variants

    def create(self, validated_data):
        uploaded_images = validated_data.pop('uploaded_images', [])
        variants_data = validated_data.pop('variants_input', [])

        # --- 1. VALIDATE DỮ LIỆU ĐẦU VÀO ---
        if not isinstance(variants_data, list):
             raise serializers.ValidationError({"variants_input": "Dữ liệu phải là một danh sách."})

        if not variants_data:
             raise serializers.ValidationError({"variants_input": "Phải có ít nhất 1 biến thể sản phẩm."})

        for index, variant in enumerate(variants_data):
            # Kiểm tra thiếu trường
            if 'price' not in variant:
                raise serializers.ValidationError({f"variants_input[{index}]": "Thiếu trường 'price'."})

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
        variants_data = validated_data.pop('variants_input', None)
        images_to_delete = validated_data.pop('images_to_delete', None)

        # 1. Update thông tin cơ bản
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # 2. Xóa hình ảnh được chọn
        if images_to_delete:
            # Parse nếu là string
            if isinstance(images_to_delete, str):
                try:
                    images_to_delete = json.loads(images_to_delete)
                except json.JSONDecodeError:
                    images_to_delete = []
            
            # Xóa các hình ảnh
            if isinstance(images_to_delete, list) and len(images_to_delete) > 0:
                ProductImage.objects.filter(
                    product=instance,
                    id__in=images_to_delete
                ).delete()

        # 3. Xử lý ảnh mới (chỉ thêm, không xóa ảnh cũ)
        for image in uploaded_images:
            file_name = rename_product_image(image.name)
            upload_response = upload_image(image, file_name)
            if upload_response:
                ProductImage.objects.create(
                    product=instance,
                    image_url=upload_response['url'],
                    file_id=upload_response['fileId']
                )

        # 4. Xử lý Variants (chỉ update nếu có variants_data)
        if variants_data is not None:
            # Parse và validate variants_data
            parsed_variants = self._parse_variant_attributes(variants_data)
            
            # Xóa tất cả variants cũ
            ProductVariant.objects.filter(product=instance).delete()
            
            # Tạo variants mới
            for variant_data in parsed_variants:
                ProductVariant.objects.create(product=instance, **variant_data)

        return instance