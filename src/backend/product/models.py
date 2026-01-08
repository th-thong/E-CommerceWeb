from django.db import models
from .utils import rename_product_image

class Product(models.Model):

    product_name = models.CharField(max_length=250)
    description = models.TextField()
    
    base_price = models.DecimalField(max_digits=12, decimal_places=2, default=0) 
    
    discount = models.IntegerField(default=0)
    
    shop = models.ForeignKey(
        'shop.Shop', 
        on_delete=models.CASCADE,
        related_name='products' 
    )
    category = models.ForeignKey(
        'category.Category', 
        on_delete=models.CASCADE,
        related_name='products'
    )
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.product_name


class ProductVariant(models.Model):

    product = models.ForeignKey(
        Product, 
        on_delete=models.CASCADE, 
        related_name='variants'
    )


    price = models.DecimalField(max_digits=12, decimal_places=2)
    
    quantity = models.IntegerField(default=0)
    
    attributes = models.JSONField(default=dict, null=False) 
    
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.product.product_name}"


class ProductImage(models.Model):

    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='images'
    )

    
    image_url = models.URLField(max_length=500, default="") 
    file_id = models.CharField(max_length=255, blank=True, null=True)

    order = models.IntegerField(default=0) 

    def __str__(self):
        return f"Image for {self.product.product_name}"