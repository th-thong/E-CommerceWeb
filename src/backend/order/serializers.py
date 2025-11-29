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

        order = Order.objects.create(
            user=request.user,
            total_price=0
        )

        for item in validated_data["items"]:
            product = Product.objects.get(id=item["product"].id)
            shop = Shop.objects.get(id=product.shop_id)

            quantity = item["quantity"]
            price = product.price * quantity

            if quantity > product.quantity:
                raise serializers.ValidationError("Số lượng hàng đặt vượt quá số lượng hàng shop có")

            OrderDetail.objects.create(order=order, product=product, shop=shop, quantity=quantity, price=price)

            total_price += price

        order.total_price = total_price
        order.save()

        return order

class ShopOrderDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderDetail
        fields = ['order', 'product', 'quantity', 'price', 'shop']
        