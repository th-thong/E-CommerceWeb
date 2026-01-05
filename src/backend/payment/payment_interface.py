from .models import PaymentTransaction

class PaymentProvider:
    def get_payment_url(self, order, request):
        pass
    
    def save_transaction(self, order, payment_type):
        PaymentTransaction.objects.update_or_create(
            transaction_no=str(order.id),
            defaults={
                'order': order,
                'amount': order.total_price,
                'status': PaymentTransaction.PaymentStatus.PENDING,
                'payment_source': payment_type
            }
        )
