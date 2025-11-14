from django.db import models

class Product(models.Model):
    product_name = models.CharField(max_length=45)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.IntegerField()
    discount = models.IntegerField(default=0)
    img_path= models.FilePathField()
    
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

    def __str__(self):
        return self.product_name
