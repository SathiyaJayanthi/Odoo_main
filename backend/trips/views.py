from django.db import transaction
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.exceptions import APIException, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from common.permissions import IsRole
from vehicles.models import Vehicle
from drivers.models import Driver
from trips.models import Trip
from trips.serializers import TripSerializer

class ConflictError(APIException):
    status_code = status.HTTP_409_CONFLICT
    default_detail = 'Conflict'
    default_code = 'conflict'


class TripListCreateView(generics.ListCreateAPIView):
    queryset = Trip.objects.select_related('vehicle', 'driver').all().order_by('-created_at')
    serializer_class = TripSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated(), IsRole(['fleet_manager'])]
        return [IsAuthenticated()]

    def get_queryset(self):
        queryset = super().get_queryset()
        status_param = self.request.query_params.get('status')
        vehicle_id = self.request.query_params.get('vehicle_id')
        driver_id = self.request.query_params.get('driver_id')

        if status_param:
            queryset = queryset.filter(status=status_param)
        if vehicle_id:
            queryset = queryset.filter(vehicle_id=vehicle_id)
        if driver_id:
            queryset = queryset.filter(driver_id=driver_id)
        return queryset

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class TripDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Trip.objects.select_related('vehicle', 'driver').all()
    serializer_class = TripSerializer

    def get_permissions(self):
        if self.request.method in ('PUT', 'PATCH', 'DELETE'):
            return [IsAuthenticated(), IsRole(['fleet_manager'])]
        return [IsAuthenticated()]

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        # Check if we are updating status
        new_status = request.data.get('status')
        if new_status and new_status != instance.status:
            return self._handle_status_transition(instance, new_status, request, partial)
            
        return super().update(request, *args, **kwargs)

    def _handle_status_transition(self, trip, new_status, request, partial):
        old_status = trip.status

        # Validate transitions
        if new_status == 'Dispatched':
            if old_status != 'Draft':
                raise ValidationError(f'Cannot dispatch a trip that is currently in status: {old_status}')
            
            with transaction.atomic():
                # Lock vehicle and driver records to prevent race conditions
                try:
                    vehicle = Vehicle.objects.select_for_update().get(pk=trip.vehicle_id)
                    driver = Driver.objects.select_for_update().get(pk=trip.driver_id)
                except (Vehicle.DoesNotExist, Driver.DoesNotExist) as e:
                    raise ValidationError('Selected vehicle or driver does not exist.') from e

                # Business checks
                if vehicle.status == 'On Trip':
                    raise ConflictError('Vehicle is currently On Trip and unavailable.')
                if vehicle.status == 'In Shop':
                    raise ValidationError('Vehicle is currently In Shop and unavailable.')
                if vehicle.status == 'Retired':
                    raise ValidationError('Vehicle is Retired and unavailable.')

                if driver.status == 'On Trip':
                    raise ConflictError('Driver is currently On Trip and unavailable.')
                if driver.status == 'Off Duty':
                    raise ValidationError('Driver is Off Duty and unavailable.')
                if driver.status == 'Suspended':
                    raise ValidationError('Driver is Suspended and unavailable.')

                # License expiry check
                today = timezone.localdate()
                if driver.license_expiry < today:
                    raise ValidationError('Driver license has expired.')

                # Execute transition
                vehicle.status = 'On Trip'
                vehicle.save(update_fields=['status'])

                driver.status = 'On Trip'
                driver.save(update_fields=['status'])

                trip.status = 'Dispatched'
                trip.dispatched_at = timezone.now()
                trip.save(update_fields=['status', 'dispatched_at'])

        elif new_status == 'Completed':
            if old_status != 'Dispatched':
                raise ValidationError(f'Cannot complete a trip that is currently in status: {old_status}')

            with transaction.atomic():
                vehicle = Vehicle.objects.select_for_update().get(pk=trip.vehicle_id)
                driver = Driver.objects.select_for_update().get(pk=trip.driver_id)

                if vehicle.status != 'Retired':
                    vehicle.status = 'Available'
                # Increment odometer
                vehicle.odometer = vehicle.odometer + trip.planned_distance
                vehicle.save(update_fields=['status', 'odometer'])

                driver.status = 'Available'
                driver.save(update_fields=['status'])

                trip.status = 'Completed'
                trip.completed_at = timezone.now()
                # If final odometer or fuel consumed is provided, save them too
                final_odo = request.data.get('final_odometer')
                fuel_cons = request.data.get('fuel_consumed')
                if final_odo is not None:
                    trip.final_odometer = final_odo
                if fuel_cons is not None:
                    trip.fuel_consumed = fuel_cons

                trip.save(update_fields=['status', 'completed_at', 'final_odometer', 'fuel_consumed'])

        elif new_status == 'Cancelled':
            if old_status not in ('Draft', 'Dispatched'):
                raise ValidationError(f'Cannot cancel a trip that is currently in status: {old_status}')

            if old_status == 'Dispatched':
                with transaction.atomic():
                    vehicle = Vehicle.objects.select_for_update().get(pk=trip.vehicle_id)
                    driver = Driver.objects.select_for_update().get(pk=trip.driver_id)

                    if vehicle.status != 'Retired':
                        vehicle.status = 'Available'
                    vehicle.save(update_fields=['status'])

                    driver.status = 'Available'
                    driver.save(update_fields=['status'])

                    trip.status = 'Cancelled'
                    trip.save(update_fields=['status'])
            else:
                # Draft -> Cancelled (no side effects)
                trip.status = 'Cancelled'
                trip.save(update_fields=['status'])

        else:
            raise ValidationError(f'Invalid target status: {new_status}')

        serializer = self.get_serializer(trip)
        return Response(serializer.data, status=status.HTTP_200_OK)
