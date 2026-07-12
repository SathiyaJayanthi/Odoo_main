from decimal import Decimal

from django.db.models import Sum

from maintenance.models import MaintenanceLog

from .models import FuelLog


def get_vehicle_cost_summary(vehicle_id):
    fuel_total = (
        FuelLog.objects.filter(vehicle_id=vehicle_id).aggregate(total=Sum('cost')).get('total')
        or Decimal('0.00')
    )
    maintenance_total = (
        MaintenanceLog.objects.filter(vehicle_id=vehicle_id, status='Closed')
        .aggregate(total=Sum('cost'))
        .get('total')
        or Decimal('0.00')
    )
    operational_cost = fuel_total + maintenance_total

    return {
        'fuel_total': fuel_total,
        'maintenance_total': maintenance_total,
        'operational_cost': operational_cost,
    }
