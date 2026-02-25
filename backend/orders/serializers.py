from rest_framework import serializers


class PlaceholderSerializer(serializers.Serializer):
    status = serializers.CharField()

