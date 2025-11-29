from rest_framework import serializers

class CreatePaymentSerializer(serializers.Serializer):
    amount = serializers.IntegerField(help_text="Số tiền (VND)")
    order_desc = serializers.CharField(help_text="Nội dung thanh toán")
    bank_code = serializers.CharField(required=False, allow_blank=True, help_text="Mã ngân hàng (NCB, VCB...)")
    language = serializers.CharField(required=False, default='vn', help_text="Ngôn ngữ (vn/en)")
    order_id = serializers.CharField(required=False, help_text="Mã đơn hàng unique")

"""class RefundSerializer(serializers.Serializer):
    order_id = serializers.CharField(help_text="Mã đơn hàng cần hoàn tiền (vnp_TxnRef)")
    amount = serializers.IntegerField(help_text="Số tiền hoàn")
    trans_date = serializers.CharField(help_text="Ngày giao dịch (YYYYMMDDHHmmss)")
    order_desc = serializers.CharField(help_text="Lý do hoàn tiền")
    transaction_type = serializers.ChoiceField(
        choices=[('02', 'Hoàn tiền toàn phần'), ('03', 'Hoàn tiền một phần')],
        default='02'
    )"""