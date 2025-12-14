from rest_framework import serializers

class CreatePaymentSerializer(serializers.Serializer):
    amount = serializers.IntegerField(help_text="Số tiền (VND)")
    order_desc = serializers.CharField(help_text="Nội dung thanh toán", default="")
    bank_code = serializers.CharField(required=False, allow_blank=True, help_text="Mã ngân hàng (NCB, VCB...)")
    language = serializers.CharField(required=False, default='vn', help_text="Ngôn ngữ (vn/en)")
    order_id = serializers.CharField(required=False, help_text="Mã đơn hàng unique")

class CODSerializers(serializers.Serializer):
    order_id = serializers.CharField(required=False, help_text="Mã đơn hàng unique")
