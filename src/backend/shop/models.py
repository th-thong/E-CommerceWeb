from django.db import models
from django.conf import settings # Import settings để lấy AUTH_USER_MODEL

class Shop(models.Model):
    shop_name = models.CharField(max_length=45)
    
    owner = models.OneToOneField(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE,
        related_name='shop'
    )
    
    def __str__(self):
        return self.shop_name
