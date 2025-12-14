from django.db import models
from django.conf import settings

class Feedback(models.Model):
    rating = models.IntegerField(choices=[(i, i) for i in range(1, 6)])
    review = models.TextField()
    
    STATUS_CHOICES = (
        ('banned', 'Banned'),
        ('normal', 'Normal'), 
    )
    status = models.CharField(max_length=7, choices=STATUS_CHOICES, default='normal')
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE,
        related_name='feedbacks' # user.feedbacks.all()
    )
    product = models.ForeignKey(
        'product.Product', 
        on_delete=models.CASCADE,
        related_name='feedbacks' # product.feedbacks.all()
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Feedback by {self.user.username} for {self.product.product_name}"
