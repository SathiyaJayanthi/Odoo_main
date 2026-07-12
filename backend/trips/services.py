from dataclasses import dataclass
from decimal import Decimal
from django.db import transaction
from django.utils import timezone
from django.shortcuts import get_object_or_404

from vehicles.models import Vehicle
from drivers.models import Driver
from .models import Trip
from finance.models import FuelLog


@dataclass
class ServiceError(Exception):
    code: str
    message: str
    field: str = None
    status_code: int = 400

    def to_dict(self):
        out = {'error': {'code': self.code, 'message': self.message}}
        if self.field:
            out['error']['field'] = self.field
        return out


def create_trip(user, vehicle_id, driver_id, source, destination, cargo_weight, planned_distance):
    vehicle = get_object_or_404(Vehicle, pk=vehicle_id)
    driver = get_object_or_404(Driver, pk=driver_id)

    # Validate capacity: allow equality
    if Decimal(cargo_weight) > vehicle.max_load_capacity:
        raise ServiceError(
            code='capacity_exceeded',
            message=f"{cargo_weight}kg exceeds {vehicle.max_load_capacity}kg capacity",
            field='cargo_weight',
            status_code=400,
        )

    trip = Trip.objects.create(
        vehicle=vehicle,
        driver=driver,
        created_by=user,
        source=source,
        destination=destination,
        cargo_weight=cargo_weight,
        planned_distance=planned_distance,
        status='Draft',
    )
    return trip


def dispatch_trip(trip_id):
    trip = get_object_or_404(Trip, pk=trip_id)

    with transaction.atomic():
        # Lock vehicle and driver rows
        vehicle = Vehicle.objects.select_for_update().get(pk=trip.vehicle_id)
        driver = Driver.objects.select_for_update().get(pk=trip.driver_id)

        # Refresh trip state from DB in case it changed
        trip.refresh_from_db()

        today = timezone.localdate()

        # Trip must be Draft at dispatch time
        if trip.status != 'Draft':
            raise ServiceError(
                code='unavailable',
                message=f"Trip {trip.id} is not available for dispatch.",
                status_code=409,
            )

        if vehicle.status != 'Available':
            raise ServiceError(
                code='unavailable',
                message=f"Vehicle {vehicle.registration_number} is currently unavailable for dispatch.",
                status_code=409,
            )
        if driver.status != 'Available':
            raise ServiceError(
                code='unavailable',
                message=f"Driver {driver.name} is currently unavailable for dispatch.",
                status_code=409,
            )
        if driver.license_expiry < today:
            raise ServiceError(
                code='unavailable',
                message=f"Driver {driver.name}'s license is expired.",
                status_code=409,
            )

        # All good — perform atomic updates
        trip.status = 'Dispatched'
        trip.dispatched_at = timezone.now()
        vehicle.status = 'On Trip'
        driver.status = 'On Trip'

        vehicle.save()
        driver.save()
        trip.save()

    return trip


def complete_trip(trip_id, final_odometer, fuel_consumed):
    trip = get_object_or_404(Trip, pk=trip_id)

    if trip.status != 'Dispatched':
        raise ServiceError(code='invalid_state', message='Trip is not Dispatched and cannot be completed.', status_code=400)

    with transaction.atomic():
        vehicle = Vehicle.objects.select_for_update().get(pk=trip.vehicle_id)
        driver = Driver.objects.select_for_update().get(pk=trip.driver_id)

        trip.status = 'Completed'
        trip.completed_at = timezone.now()
        trip.final_odometer = final_odometer
        trip.fuel_consumed = fuel_consumed

        vehicle.status = 'Available'
        driver.status = 'Available'
        vehicle.odometer = final_odometer

        vehicle.save()
        driver.save()
        trip.save()

        # Create a convenience fuel log
        if fuel_consumed is not None:
            FuelLog.objects.create(
                vehicle=vehicle,
                trip=trip,
                liters=fuel_consumed,
                cost=0,
                log_date=timezone.localdate(),
            )

    return trip


def cancel_trip(trip_id, reason=None):
    trip = get_object_or_404(Trip, pk=trip_id)

    if trip.status in ('Completed', 'Cancelled'):
        raise ServiceError(code='invalid_state', message='Cannot cancel a completed or already cancelled trip.', status_code=400)

    if trip.status == 'Draft':
        trip.status = 'Cancelled'
        trip.save()
        return trip

    # If dispatched, revert vehicle and driver
    if trip.status == 'Dispatched':
        with transaction.atomic():
            vehicle = Vehicle.objects.select_for_update().get(pk=trip.vehicle_id)
            driver = Driver.objects.select_for_update().get(pk=trip.driver_id)

            trip.status = 'Cancelled'
            vehicle.status = 'Available'
            driver.status = 'Available'

            vehicle.save()
            driver.save()
            trip.save()

        return trip

    # Fallback
    raise ServiceError(code='invalid_state', message='Unsupported trip state for cancel.', status_code=400)
