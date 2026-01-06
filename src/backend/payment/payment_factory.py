from payment.online_providers.vnpay.vnpay import VNPAYProvider
from payment.cod.cod import CODProvider
class PaymentFactory:
    _providers = {
        'VNPAY': VNPAYProvider,
        'COD': CODProvider,
    }

    @staticmethod
    def get_provider(payment_type):
        payment_type = payment_type.upper()
        provider_class = PaymentFactory._providers.get(payment_type)
        if not provider_class:
            raise ValueError(f"Phương thức {payment_type} không được hỗ trợ.")
        return provider_class()