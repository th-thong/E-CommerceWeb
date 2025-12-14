from django.db import models

from django.conf import settings

class Order(models.Model):
    # Một Order là một lần mua hàng (gồm nhiều order detail)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='orders'
    )
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Order {self.id} by {self.user.username}"


class OrderDetail(models.Model):
    order = models.ForeignKey(
        'order.Order', 
        on_delete=models.CASCADE,
        related_name='items' 
    )
    product = models.ForeignKey(
        'product.Product', 
        on_delete=models.CASCADE,
        related_name='order_details' 
    )
    
    variant = models.ForeignKey(
        'product.ProductVariant', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True
    )
    
    quantity = models.IntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    shop = models.ForeignKey(
        'shop.Shop', 
        on_delete=models.CASCADE,
        related_name='shop_items'
    )
    
    ORDER_STATUS_CHOICES = (
        ('pending', 'Pending'),   # Shop chưa xác nhận
        ('confirmed', 'Confirmed'), # Shop đã xác nhận
        ('shipped', 'Shipped'),   # Shop đã gửi hàng
    )
    order_status= models.CharField(max_length=10, choices=ORDER_STATUS_CHOICES, default='pending')
    
    PAYMENT_STATUS_CHOICES = (
        ('paid', 'Paid'),   # Đã thanh toán
        ('pending', 'Pending'), # Đang chờ thanh toán
    )
    payment_status= models.CharField(max_length=7, choices=PAYMENT_STATUS_CHOICES, default='pending')

    def __str__(self):
        return f"OrderDetail {self.id} for Order {self.order_id}"
