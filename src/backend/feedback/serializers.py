from rest_framework import serializers
from .models import Feedback
from product.models import Product

class FeedbackSerializer(serializers.ModelSerializer):
    class Meta:
        model = Feedback
        fields = ['id', 'rating', 'review', 'user', 'product', 'status']

class NewFeedbackSerializer(serializers.Serializer):
    rating = serializers.IntegerField(min_value = 1, max_value = 5)
    review = serializers.CharField()

    def create(self, validated_data):
        request = self.context.get("request")
        product_id = self.context.get("product_id")
        product = Product.objects.get(id = product_id)
        user = request.user

        if not Product.objects.filter(id = product_id).exists():
            raise serializers.ValidationError({"massage":"Sản phẩm không tồn tại trong hệ thống"})
        
        feedback = Feedback.objects.create(rating = validated_data['rating'], review = validated_data['review'], product = product, user = user)
        return feedback

    