from maintenance.models import MaintenanceLog
from trips.models import Trip


def vehicle_in_use(vehicle):
    has_active_trip = Trip.objects.filter(vehicle=vehicle).exclude(
        status__in=['Cancelled', 'Completed']
    ).exists()
    has_open_maintenance = MaintenanceLog.objects.filter(vehicle=vehicle, status='Open').exists()
    return has_active_trip or has_open_maintenance
