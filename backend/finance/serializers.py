from decimal import Decimal

from rest_framework import serializers

from trips.models import Trip
from vehicles.models import Vehicle

from .models import Expense, FuelLog


class FuelLogSerializer(serializers.ModelSerializer):
    vehicle_id = serializers.PrimaryKeyRelatedField(source='vehicle', queryset=Vehicle.objects.all())
    trip_id = serializers.PrimaryKeyRelatedField(
        source='trip', queryset=Trip.objects.all(), required=False, allow_null=True
    )

    class Meta:
        model = FuelLog
        fields = ['id', 'vehicle_id', 'trip_id', 'liters', 'cost', 'log_date']
        read_only_fields = ['id']

    def validate_liters(self, value):
        if value <= 0:
            raise serializers.ValidationError('Ensure this value is greater than 0.')
        return value


class ExpenseSerializer(serializers.ModelSerializer):
    vehicle_id = serializers.PrimaryKeyRelatedField(source='vehicle', queryset=Vehicle.objects.all())

    class Meta:
        model = Expense
        fields = ['id', 'vehicle_id', 'category', 'amount', 'expense_date', 'note']
        read_only_fields = ['id']


class CostSummarySerializer(serializers.Serializer):
    fuel_total = serializers.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    maintenance_total = serializers.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    operational_cost = serializers.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
