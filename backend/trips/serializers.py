from rest_framework import serializers
from vehicles.models import Vehicle
from drivers.models import Driver
from trips.models import Trip

class SimpleVehicleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vehicle
        fields = ['id', 'registration_number', 'name_model', 'max_load_capacity', 'odometer', 'status']

class SimpleDriverSerializer(serializers.ModelSerializer):
    class Meta:
        model = Driver
        fields = ['id', 'name', 'license_number', 'license_expiry', 'status']

class TripSerializer(serializers.ModelSerializer):
    vehicle = SimpleVehicleSerializer(read_only=True)
    vehicle_id = serializers.PrimaryKeyRelatedField(
        source='vehicle', queryset=Vehicle.objects.all(), write_only=True
    )
    driver = SimpleDriverSerializer(read_only=True)
    driver_id = serializers.PrimaryKeyRelatedField(
        source='driver', queryset=Driver.objects.all(), write_only=True
    )

    class Meta:
        model = Trip
        fields = [
            'id', 'vehicle', 'vehicle_id', 'driver', 'driver_id',
            'source', 'destination', 'cargo_weight', 'planned_distance',
            'final_odometer', 'fuel_consumed', 'status',
            'dispatched_at', 'completed_at', 'created_at'
        ]
        read_only_fields = ['id', 'status', 'dispatched_at', 'completed_at', 'created_at']

    def validate(self, data):
        # Data has the actual Vehicle object mapped to 'vehicle' via the PK related field
        vehicle = data.get('vehicle')
        cargo_weight = data.get('cargo_weight')
        if vehicle and cargo_weight is not None:
            if cargo_weight > vehicle.max_load_capacity:
                raise serializers.ValidationError({
                    'cargo_weight': f"Cargo weight ({cargo_weight}) exceeds vehicle maximum capacity ({vehicle.max_load_capacity})."
                })
        return data
