from rest_framework import serializers
from .models import Feedback
from product.models import Product

class FeedbackSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    class Meta:
        model = Feedback
        fields = ['id', 'rating', 'review', 'user_name', 'created_at']

class NewFeedbackSerializer(serializers.Serializer):
    rating = serializers.IntegerField(min_value = 1, max_value = 5)
    review = serializers.CharField()

    def create(self, validated_data):
            request = self.context.get("request")
            product_id = self.context.get("product_id")
            user = request.user

            try:
                product = Product.objects.get(id=product_id)
            except Product.DoesNotExist:
                raise serializers.ValidationError({"message": "Sản phẩm không tồn tại"})
                
            if Feedback.objects.filter(user=user, product=product).exists():
                raise serializers.ValidationError({"message": "Bạn đã đánh giá sản phẩm này rồi."})

            feedback = Feedback.objects.create(
                rating=validated_data['rating'], 
                review=validated_data['review'], 
                product=product, 
                user=user
            )
            return feedback

    