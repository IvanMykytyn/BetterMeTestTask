from rest_framework import serializers

from .models import Order
from counter.services import calculate_tax


class OrderSerializer(serializers.ModelSerializer):
    """
    Read-only serializer exposing all stored fields for an order.
    Used for responses (GET /orders, POST /orders).
    """

    class Meta:
        model = Order
        fields = "__all__"


class OrderCreateSerializer(serializers.Serializer):
    """
    Input serializer for creating a single order with computed taxes.
    Expects only the original order data; all tax fields and breakdown
    are computed via the tax service.
    """

    latitude = serializers.FloatField()
    longitude = serializers.FloatField()
    subtotal = serializers.DecimalField(max_digits=12, decimal_places=2)
    timestamp = serializers.DateTimeField()

    def create(self, validated_data):
        tax_data = calculate_tax(
            latitude=validated_data["latitude"],
            longitude=validated_data["longitude"],
            timestamp=validated_data["timestamp"],
            subtotal=validated_data["subtotal"],
        )

        order = Order.objects.create(**tax_data)
        return order


class OrdersImportSerializer(serializers.Serializer):
    """
    Serializer used for uploading a CSV file containing multiple orders.
    """

    file = serializers.FileField()


