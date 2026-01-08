from rest_framework import serializers
from django.db import transaction
from .models import Product, ProductImage, ProductVariant
from .utils import upload_image, rename_product_image
from shop.serializers import ShopSerializer
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
    shop = ShopSerializer(read_only=True)
    
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
            """Hỗ trợ parse dữ liệu variant từ JSON string hoặc List."""
            if not variants_data:
                return []

            if isinstance(variants_data, str):
                try:
                    variants_data = json.loads(variants_data)
                except json.JSONDecodeError:
                    raise serializers.ValidationError({"variants_input": "Dữ liệu JSON không hợp lệ."})
            
            if not isinstance(variants_data, list):
                raise serializers.ValidationError({"variants_input": "Dữ liệu phải là một danh sách."})
            
            parsed_variants = []
            for index, variant in enumerate(variants_data):
                # Validate các trường bắt buộc cho từng variant
                price = variant.get('price')
                if price is None or price == '':
                    raise serializers.ValidationError({f"variants_input[{index}]": "Thiếu trường 'price'."})
                
                parsed_variants.append({
                    'price': price,
                    'quantity': variant.get('quantity', 0),
                    'attributes': variant.get('attributes', {}),
                    'is_active': variant.get('is_active', True)
                })
            return parsed_variants

    def create(self, validated_data):
        uploaded_images = validated_data.pop('uploaded_images', [])
        variants_data = validated_data.pop('variants_input', None)

        with transaction.atomic():
            # 1. Tạo Product
            product = Product.objects.create(**validated_data)

            # 2. Xử lý Variant
            parsed_variants = self._parse_variant_attributes(variants_data)
            
            if not parsed_variants:
                # TẠO VARIANT MẶC ĐỊNH nếu không có data gửi lên
                ProductVariant.objects.create(
                    product=product,
                    price=product.base_price,
                    quantity=0,
                    is_active=True
                )
            else:
                for v_data in parsed_variants:
                    ProductVariant.objects.create(product=product, **v_data)

            # 3. Xử lý Ảnh
            for image in uploaded_images:
                file_name = rename_product_image(image.name)
                upload_res = upload_image(image, file_name)
                if upload_res:
                    ProductImage.objects.create(
                        product=product,
                        image_url=upload_res['url'],
                        file_id=upload_res['fileId']
                    )
            
            return product

    def update(self, instance, validated_data):
        uploaded_images = validated_data.pop('uploaded_images', [])
        variants_data = validated_data.pop('variants_input', None)
        images_to_delete = validated_data.pop('images_to_delete', None)

        with transaction.atomic():
            # 1. Update thông tin cơ bản
            for attr, value in validated_data.items():
                setattr(instance, attr, value)
            instance.save()

            # 2. Xóa ảnh cũ
            if images_to_delete:
                if isinstance(images_to_delete, str):
                    try: images_to_delete = json.loads(images_to_delete)
                    except: images_to_delete = []
                
                if isinstance(images_to_delete, list):
                    ProductImage.objects.filter(product=instance, id__in=images_to_delete).delete()

            # 3. Thêm ảnh mới
            for image in uploaded_images:
                file_name = rename_product_image(image.name)
                upload_res = upload_image(image, file_name)
                if upload_res:
                    ProductImage.objects.create(
                        product=instance,
                        image_url=upload_res['url'],
                        file_id=upload_res['fileId']
                    )

            # 4. Cập nhật Variant (Xóa cũ tạo mới nếu có data)
            if variants_data is not None:
                parsed_variants = self._parse_variant_attributes(variants_data)
                if parsed_variants:
                    ProductVariant.objects.filter(product=instance).delete()
                    for v_data in parsed_variants:
                        ProductVariant.objects.create(product=instance, **v_data)

            return instance