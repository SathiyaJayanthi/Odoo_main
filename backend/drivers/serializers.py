from rest_framework import serializers

from .models import Driver


class DriverSerializer(serializers.ModelSerializer):
    class Meta:
        model = Driver
        fields = [
            'id',
            'user',
            'name',
            'license_number',
            'license_category',
            'license_expiry',
            'contact_number',
            'safety_score',
            'status',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']
