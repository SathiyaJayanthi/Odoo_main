from datetime import timedelta
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from vehicles.models import Vehicle
from drivers.models import Driver
from trips.models import Trip

class TripAPITests(APITestCase):
    def setUp(self):
        user_model = get_user_model()
        self.manager = user_model.objects.create(
            email='manager@demo.com',
            full_name='Fleet Manager',
            role='fleet_manager',
        )
        self.manager.set_password('demopass123')
        self.manager.save()
        self.client.force_authenticate(user=self.manager)

        # Seed test vehicle
        self.vehicle = Vehicle.objects.create(
            registration_number='MH12AB1234',
            name_model='Tata Ace Van-05',
            type='Van',
            max_load_capacity='500.00',
            odometer='12000.00',
            acquisition_cost='650000.00',
            status='Available',
        )

        # Seed test driver
        self.driver = Driver.objects.create(
            name='Alex Fernandes',
            license_number='DL-MH-2024-99887',
            license_category='Class A',
            license_expiry=timezone.localdate() + timedelta(days=60),
            contact_number='+919876543210',
            safety_score='92.5',
            status='Available'
        )

    def test_create_trip_cargo_weight_validation(self):
        url = reverse('trip-list-create')
        
        # Cargo exceeds capacity (501 > 500)
        payload = {
            'vehicle_id': self.vehicle.id,
            'driver_id': self.driver.id,
            'source': 'Warehouse A',
            'destination': 'Outlet B',
            'cargo_weight': '501.00',
            'planned_distance': '45.50'
        }
        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['error']['field'], 'cargo_weight')

        # Cargo exactly equals capacity (500 == 500) - boundary case
        payload['cargo_weight'] = '500.00'
        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['status'], 'Draft')

    def test_dispatch_blocked_if_vehicle_on_trip(self):
        # Create a draft trip
        trip = Trip.objects.create(
            vehicle=self.vehicle,
            driver=self.driver,
            source='Warehouse A',
            destination='Outlet B',
            cargo_weight='100.00',
            planned_distance='20.00',
            status='Draft'
        )
        
        # Set vehicle status to On Trip
        self.vehicle.status = 'On Trip'
        self.vehicle.save()

        # Dispatch attempt
        url = reverse('trip-detail', args=[trip.id])
        response = self.client.patch(url, {'status': 'Dispatched'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        self.assertIn('currently On Trip', response.data['error']['message'])

    def test_dispatch_blocked_if_driver_license_expired(self):
        trip = Trip.objects.create(
            vehicle=self.vehicle,
            driver=self.driver,
            source='Warehouse A',
            destination='Outlet B',
            cargo_weight='100.00',
            planned_distance='20.00',
            status='Draft'
        )
        
        # Set driver license as expired
        self.driver.license_expiry = timezone.localdate() - timedelta(days=1)
        self.driver.save()

        # Dispatch attempt
        url = reverse('trip-detail', args=[trip.id])
        response = self.client.patch(url, {'status': 'Dispatched'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('license has expired', response.data['error']['message'])

    def test_dispatch_blocked_if_driver_suspended(self):
        trip = Trip.objects.create(
            vehicle=self.vehicle,
            driver=self.driver,
            source='Warehouse A',
            destination='Outlet B',
            cargo_weight='100.00',
            planned_distance='20.00',
            status='Draft'
        )
        
        # Set driver as Suspended
        self.driver.status = 'Suspended'
        self.driver.save()

        # Dispatch attempt
        url = reverse('trip-detail', args=[trip.id])
        response = self.client.patch(url, {'status': 'Dispatched'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Suspended', response.data['error']['message'])

    def test_complete_trip_frees_resources_and_updates_odometer(self):
        trip = Trip.objects.create(
            vehicle=self.vehicle,
            driver=self.driver,
            source='Warehouse A',
            destination='Outlet B',
            cargo_weight='100.00',
            planned_distance='50.00',
            status='Dispatched'
        )
        self.vehicle.status = 'On Trip'
        self.vehicle.save()
        self.driver.status = 'On Trip'
        self.driver.save()

        url = reverse('trip-detail', args=[trip.id])
        response = self.client.patch(url, {
            'status': 'Completed',
            'final_odometer': '12050.00',
            'fuel_consumed': '15.5'
        }, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Refresh models
        self.vehicle.refresh_from_db()
        self.driver.refresh_from_db()
        trip.refresh_from_db()

        self.assertEqual(self.vehicle.status, 'Available')
        self.assertEqual(self.vehicle.odometer, 12050.00) # 12000.00 + 50.00
        self.assertEqual(self.driver.status, 'Available')
        self.assertEqual(trip.status, 'Completed')
        self.assertEqual(trip.final_odometer, 12050.00)
        self.assertEqual(trip.fuel_consumed, 15.50)

    def test_cancel_dispatched_trip_frees_resources(self):
        trip = Trip.objects.create(
            vehicle=self.vehicle,
            driver=self.driver,
            source='Warehouse A',
            destination='Outlet B',
            cargo_weight='100.00',
            planned_distance='50.00',
            status='Dispatched'
        )
        self.vehicle.status = 'On Trip'
        self.vehicle.save()
        self.driver.status = 'On Trip'
        self.driver.save()

        url = reverse('trip-detail', args=[trip.id])
        response = self.client.patch(url, {'status': 'Cancelled'}, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.vehicle.refresh_from_db()
        self.driver.refresh_from_db()
        trip.refresh_from_db()

        self.assertEqual(self.vehicle.status, 'Available')
        self.assertEqual(self.driver.status, 'Available')
        self.assertEqual(trip.status, 'Cancelled')

    def test_cancel_draft_trip_succeeds_no_side_effects(self):
        trip = Trip.objects.create(
            vehicle=self.vehicle,
            driver=self.driver,
            source='Warehouse A',
            destination='Outlet B',
            cargo_weight='100.00',
            planned_distance='50.00',
            status='Draft'
        )
        self.assertEqual(self.vehicle.status, 'Available')
        self.assertEqual(self.driver.status, 'Available')

        url = reverse('trip-detail', args=[trip.id])
        response = self.client.patch(url, {'status': 'Cancelled'}, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.vehicle.refresh_from_db()
        self.driver.refresh_from_db()
        trip.refresh_from_db()

        self.assertEqual(self.vehicle.status, 'Available')
        self.assertEqual(self.driver.status, 'Available')
        self.assertEqual(trip.status, 'Cancelled')
