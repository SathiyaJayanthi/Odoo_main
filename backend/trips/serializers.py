from rest_framework import serializers
from .models import Trip


class TripSerializer(serializers.ModelSerializer):
    class Meta:
        model = Trip
        fields = [
            'id', 'vehicle', 'driver', 'created_by', 'source', 'destination',
            'cargo_weight', 'planned_distance', 'final_odometer', 'fuel_consumed',
            'status', 'dispatched_at', 'completed_at', 'created_at'
        ]
        read_only_fields = ['id', 'created_by', 'final_odometer', 'fuel_consumed', 'status', 'dispatched_at', 'completed_at', 'created_at']
