from django.db import models
from django.utils.translation import gettext_lazy as _

class PaymentTransaction(models.Model):
    class PaymentStatus(models.TextChoices):
        PENDING = 'PENDING', _('Chờ thanh toán')
        SUCCESS = 'SUCCESS', _('Thành công')
        FAILED = 'FAILED', _('Thất bại')

    order = models.ForeignKey(
        'order.Order', 
        on_delete=models.CASCADE, 
        related_name='payments'
    )
    
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    
    # Mã giao dịch phía mình sinh ra (vnp_TxnRef)
    transaction_no = models.CharField(max_length=100, unique=True, null=True, blank=True)
    
    # Mã giao dịch phía VNPAY trả về (vnp_TransactionNo)
    vnp_transaction_no = models.CharField(max_length=100, null=True, blank=True)
    
    # Trạng thái giao dịch
    status = models.CharField(
        max_length=20,
        choices=PaymentStatus.choices,
        default=PaymentStatus.PENDING
    )
    
    # Nguồn thanh toán
    payment_source = models.CharField(max_length=50, default='VNPAY')
    
    # Raw response từ VNPAY
    raw_response = models.JSONField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.transaction_no} - {self.status}"
