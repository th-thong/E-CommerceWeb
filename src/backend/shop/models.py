from django.db import models
from django.conf import settings
from django.contrib.auth import get_user_model
User = get_user_model()

class Shop(models.Model):
    shop_name = models.CharField(max_length=45)
    shop_phone_number=models.CharField(max_length=20,default="")
    shop_address = models.TextField(max_length=200,default="")
    shop_email = models.EmailField(unique=True)
    description = models.TextField(default="")
    
    owner = models.OneToOneField(
        User, 
        on_delete=models.CASCADE,
        related_name='shop'
    )
    
    def __str__(self):
        return self.shop_name
