from payment.payment_interface import PaymentProvider

class CODProvider(PaymentProvider):
    def get_payment_url(self, order, request):
        return None