from django.urls import reverse
from rest_framework.request import Request
from rest_framework.test import APIRequestFactory, APITestCase

from accounts.models import User
from common.permissions import IsRole
from drivers.models import Driver
from trips.models import Trip
from vehicles.models import Vehicle
from reports.views import DashboardView, ExportView, FuelEfficiencyView, ROIView


class ReportsAPITests(APITestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.financial_analyst = User.objects.create_user(
            email='analyst@example.com',
            password='Pass1234',
            full_name='Fin Analyst',
            role='financial_analyst',
        )
        self.fleet_manager = User.objects.create_user(
            email='fleet@example.com',
            password='Pass1234',
            full_name='Fleet Manager',
            role='fleet_manager',
        )

    def test_dashboard_returns_expected_counts(self):
        Vehicle.objects.create(
            registration_number='VH-001',
            name_model='Van A',
            type='Van',
            max_load_capacity=1000,
            acquisition_cost=100000,
            status='On Trip',
        )
        Vehicle.objects.create(
            registration_number='VH-002',
            name_model='Van B',
            type='Van',
            max_load_capacity=1000,
            acquisition_cost=100000,
            status='Available',
        )
        Driver.objects.create(
            name='Driver One',
            license_number='LIC-001',
            license_category='LMV',
            license_expiry='2030-01-01',
            contact_number='1234567890',
            safety_score=95,
            status='On Trip',
        )

        request = self.factory.get(reverse('reports-dashboard'))
        request.user = self.fleet_manager
        drf_request = Request(request)
        drf_request.user = self.fleet_manager
        response = DashboardView().get(drf_request)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['available_vehicles'], 1)
        self.assertEqual(response.data['fleet_utilization_pct'], 50.0)

    def test_fuel_efficiency_calculation_is_correct(self):
        vehicle = Vehicle.objects.create(
            registration_number='VH-100',
            name_model='Van X',
            type='Van',
            max_load_capacity=1000,
            acquisition_cost=100000,
            status='Available',
        )
        driver = Driver.objects.create(
            name='Driver Two',
            license_number='LIC-002',
            license_category='LMV',
            license_expiry='2030-01-01',
            contact_number='1234567890',
            safety_score=95,
            status='Available',
        )
        Trip.objects.create(
            vehicle=vehicle,
            driver=driver,
            source='A',
            destination='B',
            cargo_weight=100,
            planned_distance=100,
            fuel_consumed=10,
            status='Completed',
        )
        Trip.objects.create(
            vehicle=vehicle,
            driver=driver,
            source='B',
            destination='C',
            cargo_weight=100,
            planned_distance=200,
            fuel_consumed=20,
            status='Completed',
        )

        request = self.factory.get(reverse('reports-fuel-efficiency'), {'vehicle_id': vehicle.id})
        request.user = self.financial_analyst
        drf_request = Request(request)
        drf_request.user = self.financial_analyst
        response = FuelEfficiencyView().get(drf_request)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data[0]['distance'], 300.0)
        self.assertEqual(response.data[0]['fuel'], 30.0)
        self.assertEqual(response.data[0]['efficiency'], 10.0)

    def test_roi_calculation_is_zero_safe(self):
        vehicle = Vehicle.objects.create(
            registration_number='VH-200',
            name_model='Van Y',
            type='Van',
            max_load_capacity=1000,
            acquisition_cost=100000,
            status='Available',
        )
        driver = Driver.objects.create(
            name='Driver Three',
            license_number='LIC-003',
            license_category='LMV',
            license_expiry='2030-01-01',
            contact_number='1234567890',
            safety_score=95,
            status='Available',
        )
        Trip.objects.create(
            vehicle=vehicle,
            driver=driver,
            source='A',
            destination='B',
            cargo_weight=100,
            planned_distance=100,
            fuel_consumed=10,
            status='Completed',
        )

        request = self.factory.get(reverse('reports-roi'), {'vehicle_id': vehicle.id})
        request.user = self.financial_analyst
        drf_request = Request(request)
        drf_request.user = self.financial_analyst
        response = ROIView().get(drf_request)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data[0]['roi_pct'], 0.0)

    def test_csv_export_returns_csv_response(self):
        vehicle = Vehicle.objects.create(
            registration_number='VH-300',
            name_model='Van Z',
            type='Van',
            max_load_capacity=1000,
            acquisition_cost=100000,
            status='Available',
        )
        driver = Driver.objects.create(
            name='Driver Four',
            license_number='LIC-004',
            license_category='LMV',
            license_expiry='2030-01-01',
            contact_number='1234567890',
            safety_score=95,
            status='Available',
        )
        Trip.objects.create(
            vehicle=vehicle,
            driver=driver,
            source='A',
            destination='B',
            cargo_weight=100,
            planned_distance=100,
            fuel_consumed=10,
            status='Completed',
        )

        request = self.factory.get(reverse('reports-export'), {'type': 'csv'})
        request.user = self.financial_analyst
        drf_request = Request(request)
        drf_request.user = self.financial_analyst
        response = ExportView().get(drf_request)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response['Content-Type'], 'text/csv')

    def test_non_financial_analyst_gets_403_on_roi(self):
        request = self.factory.get(reverse('reports-roi'))
        request.user = self.fleet_manager
        drf_request = Request(request)
        drf_request.user = self.fleet_manager
        permission = IsRole(['financial_analyst'])

        self.assertFalse(permission.has_permission(drf_request, None))
