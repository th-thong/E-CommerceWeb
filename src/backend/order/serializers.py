from rest_framework import serializers
from shop.models import Shop
from .models import Order
from .models import OrderDetail
from product.models import Product , ProductVariant
from django.contrib.auth import get_user_model
from django.db import transaction
from django.db import transaction, IntegrityError
from decimal import Decimal
from drf_spectacular.utils import extend_schema_field
from drf_spectacular.types import OpenApiTypes
from decimal import Decimal

class OrderDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderDetail
        fields = ["id", "quantity", "price", "order", "product", "shop", "order_status", "payment_status"]

class OrderSerializer(serializers.ModelSerializer):
    items = OrderDetailSerializer(many = True, read_only = True)
    
    class Meta:
        model = Order
        fields = ["id", "user", "total_price", "created_at", "items", "full_name", "phone_number", "address", "note"]

class NewOrderDetailSerializer(serializers.ModelSerializer):
    product_id = serializers.PrimaryKeyRelatedField(
        source="product", 
        queryset=Product.objects.all()
    )
    variant_id = serializers.PrimaryKeyRelatedField(
        source="variant", 
        queryset=ProductVariant.objects.all(),
        required=False, 
        allow_null=True
    )
    quantity = serializers.IntegerField(min_value=1)

    class Meta:
        model = OrderDetail
        fields = ["product_id", "variant_id", "quantity"]

class NewOrderSerializer(serializers.ModelSerializer):
    items = NewOrderDetailSerializer(many=True, write_only=True)

    payment_type = serializers.ChoiceField(choices=[('COD', 'COD'), ('VNPAY', 'VNPAY')], default='COD')
    class Meta:
        model = Order
        fields = ["items", "payment_type", "full_name", "phone_number", "address", "note"]

    def create(self, validated_data):
        request = self.context.get("request")
        if not request or not request.user:
            raise serializers.ValidationError("User không tồn tại")

        with transaction.atomic():
            return self._create_order(validated_data, request)

    def _create_order(self, validated_data, request):
        total_order_price = 0
        
        # Lấy payment_type từ dữ liệu đã validate
        payment_type = validated_data.get('payment_type', 'COD')
        items_data = validated_data.get('items')

        full_name = validated_data.get('full_name')
        phone_number = validated_data.get('phone_number')
        address = validated_data.get('address')
        note = validated_data.get('note')

        # 1. Tạo Order cha
        order = Order.objects.create(
            user=request.user,
            total_price=0,
            full_name=full_name,
            phone_number=phone_number,
            address=address,
            note=note,
        )

        # 2. Tạo Order Detail
        for item in items_data:
            product = item["product"]
            variant = item.get("variant")
            quantity = item["quantity"]
            shop = product.shop
            unit_price = 0

            # --- Logic xử lý kho và giá ---
            if variant:
                if variant.product_id != product.id:
                    raise serializers.ValidationError(f"Biến thể '{variant.id}' không thuộc sản phẩm '{product.product_name}'")
                
                # Check kho variant
                if variant.quantity < quantity:
                    raise serializers.ValidationError(f"Phân loại '{variant.id}' không đủ hàng.")
                
                unit_price = variant.price
                variant.quantity -= quantity
                variant.save()
            else:
                # Check kho product
                if getattr(product, 'quantity', 0) < quantity:
                     raise serializers.ValidationError(f"Sản phẩm '{product.product_name}' không đủ hàng.")
                
                unit_price = product.base_price
                product.quantity -= quantity
                product.save()
            # -----------------------------------------------------------

            unit_price = variant.price if variant else product.base_price
            discount_percent = product.discount if product.discount else 0
            discount_factor = Decimal(1) - (Decimal(discount_percent) / Decimal(100))
            print(discount_factor)
            line_total_price = (unit_price * quantity) * discount_factor
            total_order_price += line_total_price

            # Tạo OrderDetail
            OrderDetail.objects.create(
                order=order,
                product=product,
                variant=variant,
                shop=shop,
                quantity=quantity,
                price=line_total_price,
                payment_type=payment_type,
                order_status='pending',
                payment_status='pending' 
            )

        # 3. Cập nhật tổng tiền Order
        order.total_price = total_order_price
        order.save()
        
        # Lưu tạm payment_type vào object order để view sử dụng
        order._temp_payment_type = payment_type 

        return order

class ShopOrderDetailSerializer(serializers.ModelSerializer):
    # 1. Thông tin từ bảng Order (Cha)
    order_id = serializers.IntegerField(source='order.id', read_only=True)
    created_at = serializers.DateTimeField(source='order.created_at', format="%d/%m/%Y %H:%M", read_only=True)
    customer_name = serializers.CharField(source='order.user.username', read_only=True)
    customer_email = serializers.EmailField(source='order.user.email', read_only=True)
    
    full_name = serializers.CharField(source='order.full_name', read_only=True)
    phone_number = serializers.CharField(source='order.phone_number', read_only=True)
    address = serializers.CharField(source='order.address', read_only=True)
    note = serializers.CharField(source='order.note', read_only=True)
    
    # 2. Thông tin từ bảng Product (Sản phẩm)
    product_name = serializers.CharField(source='product.product_name', read_only=True)
    product_image = serializers.SerializerMethodField()
    

    # 3. Thông tin từ bảng Variant (Phân loại hàng)
    variant = serializers.SerializerMethodField()

    # 4. Tính tổng tiền cho item này (Số lượng * Đơn giá)
    subtotal = serializers.SerializerMethodField()

    class Meta:
        model = OrderDetail
        fields = [
            'id', 
            'order_id', 'created_at', 'customer_name', 'customer_email',
            'full_name', 'phone_number', 'address', 'note',
            'product', 'product_name', 'product_image', 'variant',
            'quantity', 'price', 'subtotal',
            'order_status', 'payment_status', 'payment_type'
        ]

    @extend_schema_field(OpenApiTypes.STR)
    def get_product_image(self, obj):
        """Lấy ảnh đầu tiên của sản phẩm làm ảnh đại diện"""
        try:
            first_image = obj.product.images.first()
            if first_image:
                return first_image.image_url
        except Exception:
            return None
        return ""

    @extend_schema_field(serializers.DictField)
    def get_variant(self, obj):
        if obj.variant:
            return obj.variant.attributes 
        return None
    
    @extend_schema_field(OpenApiTypes.DECIMAL)
    def get_subtotal(self, obj):
        return obj.quantity * obj.price


class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.product_name', read_only=True)
    product_image = serializers.SerializerMethodField()
    variant = serializers.SerializerMethodField()

    class Meta:
        model = OrderDetail
        fields = ['id', 'product_id', 'product_name', 'product_image', 'variant', 'quantity', 'price', 'payment_status', 'order_status']

    @extend_schema_field(OpenApiTypes.STR)
    def get_product_image(self, obj):
        try:
            return obj.product.images.first().image_url
        except:
            return ""
    @extend_schema_field(serializers.DictField)
    def get_variant(self, obj):
            if obj.variant:
                return obj.variant.attributes
            return None

class OrderHistorySerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    payment_method = serializers.SerializerMethodField()
    order_status = serializers.SerializerMethodField()
    total_price = serializers.CharField() 

    class Meta:
        model = Order
        fields = ['id', 'total_price', 'created_at',
                  'payment_method', 'order_status', 'items',
                  "full_name", "phone_number", "address", "note"]

    @extend_schema_field(OpenApiTypes.STR)
    def get_payment_method(self, obj):
        first_item = obj.items.first()
        if first_item:
            return first_item.payment_type
        return "Unknown"

    @extend_schema_field(OpenApiTypes.STR)
    def get_order_status(self, obj):
        """Lấy trạng thái đại diện cho đơn hàng"""
        first_item = obj.items.first()
        if first_item:
            return first_item.order_status
        return "pending"