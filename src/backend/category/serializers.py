from rest_framework import serializers
from .models import Category

class CategorySerializer(serializers.ModelSerializer):
    category_id = serializers.IntegerField(source='id')
    class Meta:
        model=Category
        fields=['category_id', 'category_name']