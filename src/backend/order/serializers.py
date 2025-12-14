from rest_framework import serializers
from shop.models import Shop
from .models import Order
from .models import OrderDetail
from product.models import Product , ProductVariant
from django.contrib.auth import get_user_model
from django.db import transaction
from django.db import transaction, IntegrityError
from decimal import Decimal

#chỉ lấy các field trong bảng order không lấy detail 
class OrderSimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = "__all__"
        depth = 0

class OrderDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderDetail
        fields = ["id", "quantity", "price", "order", "product", "shop", "order_status", "payment_status"]

class OrderSerializer(serializers.ModelSerializer):
    items = OrderDetailSerializer(many = True, read_only = True)
    
    class Meta:
        model = Order
        fields = ["id", "user", "total_price", "created_at", "items"]

class NewOrderDetailSerializer(serializers.ModelSerializer):
    # Map từ 'product_id' (input) -> 'product' (object)
    product_id = serializers.PrimaryKeyRelatedField(
        source="product", 
        queryset=Product.objects.all()
    )
    # Map từ 'variant_id' (input) -> 'variant' (object) - Cho phép null (không bắt buộc)
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


# 2. Serializer tạo đơn hàng (Main)
class NewOrderSerializer(serializers.ModelSerializer):
    items = NewOrderDetailSerializer(many=True, write_only=True)

    class Meta:
        model = Order
        fields = ["items"]

    def create(self, validated_data):
        request = self.context.get("request")
        if not request or not request.user:
            raise serializers.ValidationError("User không tồn tại")

        # Atomic: Đảm bảo toàn vẹn dữ liệu (trừ kho và tạo đơn cùng thành công hoặc cùng thất bại)
        with transaction.atomic():
            return self._create_order(validated_data, request)

    def _create_order(self, validated_data, request):
        total_order_price = 0

        # A. Tạo Order cha trước (mặc định total_price = 0)
        order = Order.objects.create(
            user=request.user,
            total_price=0
        )

        # B. Duyệt qua từng sản phẩm trong giỏ
        for item in validated_data["items"]:
            product = item["product"]
            variant = item.get("variant") # Có thể là None
            quantity = item["quantity"]
            shop = product.shop

            # --- LOGIC XỬ LÝ GIÁ VÀ TỒN KHO ---
            unit_price = 0

            if variant:
                # TRƯỜNG HỢP 1: Mua sản phẩm CÓ biến thể (Size/Màu)
                
                # Validate: Biến thể phải thuộc về sản phẩm này
                if variant.product_id != product.id:
                    raise serializers.ValidationError(
                        f"Biến thể '{variant.id}' không thuộc sản phẩm '{product.product_name}'"
                    )

                # Kiểm tra tồn kho Variant
                if variant.quantity < quantity:
                    raise serializers.ValidationError(
                        f"Phân loại '{variant.id}' không đủ hàng. Chỉ còn {variant.quantity}"
                    )
                
                # Lấy giá của Variant
                unit_price = variant.price
                
                # Trừ kho Variant
                variant.quantity -= quantity
                variant.save()

            else:
                # Lưu ý: Đảm bảo model Product của bạn có trường quantity và base_price
                if not hasattr(product, 'quantity'):
                     raise serializers.ValidationError(f"Sản phẩm '{product.product_name}' yêu cầu phải chọn phân loại (variant).")

                if product.quantity < quantity:
                    raise serializers.ValidationError(
                        f"Sản phẩm '{product.product_name}' không đủ hàng. Chỉ còn {product.quantity}"
                    )
                
                # Lấy giá gốc của Product
                unit_price = product.base_price
                
                # Trừ kho Product
                product.quantity -= quantity
                product.save()

            # Tính thành tiền cho dòng này (Line Total)
            line_total_price = unit_price * quantity

            # C. Tạo OrderDetail lưu xuống DB
            OrderDetail.objects.create(
                order=order,
                product=product,
                variant=variant, # Lưu variant vào (nếu có)
                shop=shop,
                quantity=quantity,
                price=line_total_price # Lưu tổng giá của dòng order detail này
            )

            # Cộng dồn vào tổng tiền đơn hàng cha
            total_order_price += line_total_price

        # D. Cập nhật lại tổng tiền cho Order cha
        order.total_price = total_order_price
        order.save()

        return order

class ShopOrderDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderDetail
        fields = ['order', 'product', 'quantity', 'price', 'shop']
        