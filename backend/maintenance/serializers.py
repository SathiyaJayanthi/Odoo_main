from rest_framework import serializers

from vehicles.models import Vehicle

from .models import MaintenanceLog


class MaintenanceLogSerializer(serializers.ModelSerializer):
    vehicle_id = serializers.PrimaryKeyRelatedField(
        source='vehicle', queryset=Vehicle.objects.all(), write_only=True, required=False
    )

    class Meta:
        model = MaintenanceLog
        fields = [
            'id',
            'vehicle',
            'vehicle_id',
            'description',
            'cost',
            'status',
            'opened_at',
            'closed_at',
        ]
        read_only_fields = ['id', 'vehicle', 'status', 'opened_at', 'closed_at']


class MaintenanceOpenSerializer(serializers.Serializer):
    vehicle_id = serializers.PrimaryKeyRelatedField(queryset=Vehicle.objects.all(), source='vehicle')
    description = serializers.CharField(max_length=255)
    cost = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, default=0)


class MaintenanceCloseSerializer(serializers.Serializer):
    cost = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
