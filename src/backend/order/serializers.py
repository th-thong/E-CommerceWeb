from rest_framework import serializers
from shop.models import Shop
from .models import Order
from .models import OrderDetail
from product.models import Product 
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
    product_id = serializers.PrimaryKeyRelatedField(source="product", queryset = Product.objects.all())
    quantity = serializers.IntegerField()
    
    class Meta:
        model = OrderDetail
        fields = ["product_id","quantity"]
    
class NewOrderSerializer(serializers.ModelSerializer):
    items = NewOrderDetailSerializer(many=True, write_only=True)

    class Meta:
        model = Order
        fields = ["items"]

    def create(self, validated_data):
        request = self.context.get("request")
        if not request or not request.user:
            raise serializers.ValidationError("User không tồn tại")

        with transaction.atomic():
            return self._create_order(validated_data, request)

    def _create_order(self, validated_data, request):
        total_price = 0

        # Tạo Order cha trước
        order = Order.objects.create(
            user=request.user,
            total_price=0
        )

        for item in validated_data["items"]:
            # 1. Lấy Product Object trực tiếp
            product = item["product"] 
            
            # 2. Lấy Shop
            shop = product.shop 

            quantity = item["quantity"]
            
            # 3. Kiểm tra logic giá
            price_per_unit = getattr(product, 'base_price', 0) 

            line_total = price_per_unit * quantity

            # 4. Kiểm tra tồn kho
            if quantity > product.quantity:
                # Rollback transaction ngay lập tức
                raise serializers.ValidationError(
                    f"Sản phẩm '{product.product_name}' không đủ số lượng. Kho còn: {product.quantity}"
                )

            # 5. Tạo Order Detail
            OrderDetail.objects.create(
                order=order, 
                product=product, 
                shop=shop, 
                quantity=quantity, 
                price=line_total # Lưu tổng giá của dòng này (hoặc đơn giá tùy logic bạn muốn)
            )

            # 6. Trừ tồn kho
            product.quantity = product.quantity - quantity
            product.save()

            total_price += line_total

        # Cập nhật tổng tiền cho Order cha
        order.total_price = total_price
        order.save()

        return order

class ShopOrderDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderDetail
        fields = ['order', 'product', 'quantity', 'price', 'shop']
        