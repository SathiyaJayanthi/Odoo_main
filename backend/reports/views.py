import csv
from decimal import Decimal

from django.http import HttpResponse
from django.db.models import Count, Sum
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import User
from common.permissions import IsRole
from drivers.models import Driver
from finance.services import get_vehicle_cost_summary
from maintenance.models import MaintenanceLog
from trips.models import Trip
from vehicles.models import Vehicle

REVENUE_PER_TRIP = Decimal('2000.00')


class DashboardView(APIView):
    permission_classes = [IsRole]
    allowed_roles = ['fleet_manager', 'driver', 'safety_officer', 'financial_analyst']

    def get(self, request):
        active_vehicles = Vehicle.objects.exclude(status='Retired').count()
        available_vehicles = Vehicle.objects.filter(status='Available').count()
        in_maintenance = Vehicle.objects.filter(status='In Shop').count()
        active_trips = Trip.objects.filter(status='Dispatched').count()
        pending_trips = Trip.objects.filter(status='Draft').count()
        drivers_on_duty = Driver.objects.filter(status='On Trip').count()
        fleet_utilization_pct = 0.0
        if active_vehicles:
            on_trip_vehicles = Vehicle.objects.filter(status='On Trip').count()
            fleet_utilization_pct = round((on_trip_vehicles / active_vehicles) * 100, 1)

        return Response({
            'active_vehicles': active_vehicles,
            'available_vehicles': available_vehicles,
            'in_maintenance': in_maintenance,
            'active_trips': active_trips,
            'pending_trips': pending_trips,
            'drivers_on_duty': drivers_on_duty,
            'fleet_utilization_pct': fleet_utilization_pct,
        })


class FuelEfficiencyView(APIView):
    permission_classes = [IsRole]
    allowed_roles = ['financial_analyst', 'fleet_manager']

    def get(self, request):
        vehicle_id = request.query_params.get('vehicle_id')
        queryset = Trip.objects.filter(status='Completed')
        if vehicle_id:
            queryset = queryset.filter(vehicle_id=vehicle_id)

        rows = list(
            queryset.values('vehicle_id')
            .annotate(
                distance=Sum('planned_distance'),
                fuel=Sum('fuel_consumed'),
            )
            .order_by('vehicle_id')
        )

        data = []
        for row in rows:
            fuel = row['fuel'] or Decimal('0.00')
            distance = row['distance'] or Decimal('0.00')
            efficiency = distance / fuel if fuel else Decimal('0.00')
            data.append({
                'vehicle_id': row['vehicle_id'],
                'distance': float(distance),
                'fuel': float(fuel),
                'efficiency': float(efficiency),
            })

        return Response(data)


class ROIView(APIView):
    permission_classes = [IsRole]
    allowed_roles = ['financial_analyst', 'fleet_manager']

    def get(self, request):
        vehicle_id = request.query_params.get('vehicle_id')
        queryset = Trip.objects.filter(status='Completed')
        if vehicle_id:
            queryset = queryset.filter(vehicle_id=vehicle_id)

        vehicles = Vehicle.objects.all()
        if vehicle_id:
            vehicles = vehicles.filter(id=vehicle_id)

        data = []
        for vehicle in vehicles:
            completed_trip_count = queryset.filter(vehicle=vehicle).count()
            revenue = completed_trip_count * REVENUE_PER_TRIP
            cost_summary = get_vehicle_cost_summary(vehicle.id)
            cost = cost_summary['operational_cost']
            acq_cost = vehicle.acquisition_cost
            roi_pct = ((revenue - cost) / acq_cost * Decimal('100')) if acq_cost > 0 else Decimal('0.00')
            data.append({
                'vehicle_id': vehicle.id,
                'revenue': float(revenue),
                'cost': float(cost),
                'roi_pct': float(roi_pct),
            })

        return Response(data)


class ExportView(APIView):
    permission_classes = [IsRole]
    allowed_roles = ['financial_analyst', 'fleet_manager']

    def get(self, request):
        if request.query_params.get('type') != 'csv':
            return Response({'error': {'message': 'Only csv export is supported'}}, status=status.HTTP_400_BAD_REQUEST)

        fuel_response = FuelEfficiencyView().get(request)
        roi_response = ROIView().get(request)

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="transitops_report.csv"'
        writer = csv.writer(response)
        writer.writerow(['vehicle_id', 'distance', 'fuel', 'efficiency', 'revenue', 'cost', 'roi_pct'])

        fuel_data = fuel_response.data if hasattr(fuel_response, 'data') else []
        roi_data = roi_response.data if hasattr(roi_response, 'data') else []
        roi_lookup = {row['vehicle_id']: row for row in roi_data}

        for row in fuel_data:
            roi_row = roi_lookup.get(row['vehicle_id'], {})
            writer.writerow([
                row['vehicle_id'],
                row['distance'],
                row['fuel'],
                row['efficiency'],
                roi_row.get('revenue', ''),
                roi_row.get('cost', ''),
                roi_row.get('roi_pct', ''),
            ])

        return response


class MaintenanceAlertsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = timezone.now().date()
        candidate_vehicles = Vehicle.objects.filter(status__in=['Available', 'On Trip'])

        latest_closed_logs = (
            MaintenanceLog.objects.filter(
                status='Closed',
                closed_at__isnull=False,
                vehicle__status__in=['Available', 'On Trip'],
            )
            .order_by('vehicle_id', '-closed_at')
            .values('vehicle_id', 'closed_at')
        )

        latest_closed_by_vehicle = {}
        for row in latest_closed_logs:
            if row['vehicle_id'] not in latest_closed_by_vehicle:
                latest_closed_by_vehicle[row['vehicle_id']] = row['closed_at']

        alerts = []
        for vehicle in candidate_vehicles:
            latest_closed_at = latest_closed_by_vehicle.get(vehicle.id)
            if latest_closed_at:
                days_since_service = (today - latest_closed_at.date()).days
            else:
                # Demo fallback when maintenance history is absent for a vehicle.
                days_since_service = (today - vehicle.created_at.date()).days

            # We do not store odometer-at-close yet, so current odometer is used as a proxy.
            odometer_delta = float(vehicle.odometer or 0)
            risk_score = (days_since_service / 90) + (odometer_delta / 10000)

            if risk_score >= 1.5:
                risk_level = 'high'
            elif risk_score >= 0.8:
                risk_level = 'medium'
            else:
                continue

            alerts.append({
                'vehicle_id': vehicle.id,
                'registration_number': vehicle.registration_number,
                'name_model': vehicle.name_model,
                'days_since_service': days_since_service,
                'risk_score': round(risk_score, 2),
                'risk_level': risk_level,
            })

        alerts.sort(key=lambda item: item['risk_score'], reverse=True)
        return Response(alerts)
