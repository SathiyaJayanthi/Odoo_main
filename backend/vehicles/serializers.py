from rest_framework import serializers

from .models import Vehicle


class VehicleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vehicle
        fields = [
            'id',
            'registration_number',
            'name_model',
            'type',
            'max_load_capacity',
            'odometer',
            'acquisition_cost',
            'status',
            'region',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']

    def validate_max_load_capacity(self, value):
        if value <= 0:
            raise serializers.ValidationError('Ensure this value is greater than 0.')
        return value
