from django.db import transaction
from django.utils import timezone
from rest_framework import status
from rest_framework.exceptions import APIException, ValidationError

from .models import MaintenanceLog


class ConflictError(APIException):
    status_code = status.HTTP_409_CONFLICT
    default_detail = 'Conflict'
    default_code = 'conflict'


def open_maintenance_log(vehicle, description, cost=0):
    if vehicle.status == 'On Trip':
        raise ConflictError('Vehicle is currently On Trip and cannot be sent to maintenance.')

    with transaction.atomic():
        log = MaintenanceLog.objects.create(
            vehicle=vehicle,
            description=description,
            cost=cost,
            status='Open',
        )
        vehicle.status = 'In Shop'
        vehicle.save(update_fields=['status'])
    return log


def close_maintenance_log(log, cost=None):
    if log.status == 'Closed' or log.vehicle.status == 'Available':
        raise ValidationError('Maintenance log is already closed or vehicle is already Available.')

    with transaction.atomic():
        if cost is not None:
            log.cost = cost
        log.status = 'Closed'
        log.closed_at = timezone.now()
        log.save(update_fields=['status', 'closed_at', 'cost'])

        vehicle = log.vehicle
        if vehicle.status != 'Retired':
            vehicle.status = 'Available'
            vehicle.save(update_fields=['status'])

    return log
