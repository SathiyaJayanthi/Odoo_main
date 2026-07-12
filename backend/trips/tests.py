from decimal import Decimal
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from django.utils import timezone
from datetime import timedelta

from accounts.models import User
from vehicles.models import Vehicle
from drivers.models import Driver
from .models import Trip
from finance.models import FuelLog


class TripsAPITestCase(APITestCase):
	def setUp(self):
		# Users
		self.fleet = User.objects.create_user(email='fm@demo.com', password='pass', full_name='FM', role='fleet_manager')
		self.driver_user = User.objects.create_user(email='drv@demo.com', password='pass', full_name='DRV', role='driver')

		# Vehicle
		self.vehicle = Vehicle.objects.create(
			registration_number='MH12AB1234',
			name_model='Tata Ace Van-05',
			type='Van',
			max_load_capacity=Decimal('500.00'),
			odometer=Decimal('12500.00'),
			acquisition_cost=Decimal('650000.00'),
			status='Available',
		)

		# Driver
		self.driver = Driver.objects.create(
			name='Alex Fernandes',
			license_number='DL-MH-2024-99887',
			license_category='LMV',
			license_expiry=timezone.localdate() + timedelta(days=365),
			contact_number='9876543210',
			status='Available',
		)

		self.client = APIClient()

	def auth_as(self, user):
		self.client.force_authenticate(user=user)

	def test_reject_creation_when_capacity_exceeded(self):
		self.auth_as(self.fleet)
		url = '/api/v1/trips/'
		payload = {
			'vehicle_id': self.vehicle.id,
			'driver_id': self.driver.id,
			'source': 'A',
			'destination': 'B',
			'cargo_weight': '600.00',
			'planned_distance': '10.00',
		}
		resp = self.client.post(url, payload, format='json')
		self.assertEqual(resp.status_code, 400)
		self.assertIn('error', resp.data)
		self.assertEqual(resp.data['error']['code'], 'capacity_exceeded')

	def test_allow_creation_at_capacity_boundary(self):
		self.auth_as(self.fleet)
		url = '/api/v1/trips/'
		payload = {
			'vehicle_id': self.vehicle.id,
			'driver_id': self.driver.id,
			'source': 'A',
			'destination': 'B',
			'cargo_weight': '500.00',
			'planned_distance': '10.00',
		}
		resp = self.client.post(url, payload, format='json')
		self.assertEqual(resp.status_code, 201)
		self.assertEqual(resp.data['status'], 'Draft')

	def test_dispatch_fails_if_vehicle_on_trip(self):
		# Make vehicle On Trip
		self.vehicle.status = 'On Trip'
		self.vehicle.save()

		trip = Trip.objects.create(
			vehicle=self.vehicle, driver=self.driver, created_by=self.fleet,
			source='A', destination='B', cargo_weight=Decimal('100.00'), planned_distance=Decimal('10.00')
		)

		self.auth_as(self.fleet)
		url = f'/api/v1/trips/{trip.id}/dispatch/'
		resp = self.client.post(url)
		self.assertEqual(resp.status_code, 409)
		self.assertEqual(resp.data['error']['code'], 'unavailable')

	def test_dispatch_fails_if_driver_license_expired(self):
		# Expire driver
		self.driver.license_expiry = timezone.localdate() - timedelta(days=1)
		self.driver.save()

		trip = Trip.objects.create(
			vehicle=self.vehicle, driver=self.driver, created_by=self.fleet,
			source='A', destination='B', cargo_weight=Decimal('100.00'), planned_distance=Decimal('10.00')
		)

		self.auth_as(self.fleet)
		url = f'/api/v1/trips/{trip.id}/dispatch/'
		resp = self.client.post(url)
		self.assertEqual(resp.status_code, 409)
		self.assertEqual(resp.data['error']['code'], 'unavailable')

	def test_dispatch_succeeds_and_flips_statuses(self):
		trip = Trip.objects.create(
			vehicle=self.vehicle, driver=self.driver, created_by=self.fleet,
			source='A', destination='B', cargo_weight=Decimal('100.00'), planned_distance=Decimal('10.00')
		)

		self.auth_as(self.fleet)
		url = f'/api/v1/trips/{trip.id}/dispatch/'
		resp = self.client.post(url)
		self.assertEqual(resp.status_code, 200)
		trip.refresh_from_db()
		self.vehicle.refresh_from_db()
		self.driver.refresh_from_db()
		self.assertEqual(trip.status, 'Dispatched')
		self.assertEqual(self.vehicle.status, 'On Trip')
		self.assertEqual(self.driver.status, 'On Trip')

	def test_complete_dispatched_trip_updates_states_and_creates_fuellog(self):
		trip = Trip.objects.create(
			vehicle=self.vehicle, driver=self.driver, created_by=self.fleet,
			source='A', destination='B', cargo_weight=Decimal('100.00'), planned_distance=Decimal('10.00'), status='Dispatched'
		)
		# set vehicle and driver on trip
		self.vehicle.status = 'On Trip'
		self.vehicle.save()
		self.driver.status = 'On Trip'
		self.driver.save()

		self.auth_as(self.fleet)
		url = f'/api/v1/trips/{trip.id}/complete/'
		payload = {'final_odometer': '12550.00', 'fuel_consumed': '15.50'}
		resp = self.client.post(url, payload, format='json')
		self.assertEqual(resp.status_code, 200)

		trip.refresh_from_db()
		self.vehicle.refresh_from_db()
		self.driver.refresh_from_db()
		self.assertEqual(trip.status, 'Completed')
		self.assertEqual(self.vehicle.status, 'Available')
		self.assertEqual(self.driver.status, 'Available')
		self.assertEqual(self.vehicle.odometer, Decimal('12550.00'))
		self.assertTrue(FuelLog.objects.filter(trip=trip, vehicle=self.vehicle).exists())

	def test_cancel_draft_trip_no_side_effects(self):
		trip = Trip.objects.create(
			vehicle=self.vehicle, driver=self.driver, created_by=self.fleet,
			source='A', destination='B', cargo_weight=Decimal('100.00'), planned_distance=Decimal('10.00')
		)

		self.auth_as(self.fleet)
		url = f'/api/v1/trips/{trip.id}/cancel/'
		resp = self.client.post(url, {}, format='json')
		self.assertEqual(resp.status_code, 200)
		trip.refresh_from_db()
		self.assertEqual(trip.status, 'Cancelled')
		# vehicle and driver remain unchanged (should still be Available)
		self.vehicle.refresh_from_db()
		self.driver.refresh_from_db()
		self.assertEqual(self.vehicle.status, 'Available')
		self.assertEqual(self.driver.status, 'Available')

	def test_cancel_dispatched_trip_reverts_statuses(self):
		trip = Trip.objects.create(
			vehicle=self.vehicle, driver=self.driver, created_by=self.fleet,
			source='A', destination='B', cargo_weight=Decimal('100.00'), planned_distance=Decimal('10.00'), status='Dispatched'
		)
		self.vehicle.status = 'On Trip'
		self.vehicle.save()
		self.driver.status = 'On Trip'
		self.driver.save()

		self.auth_as(self.fleet)
		url = f'/api/v1/trips/{trip.id}/cancel/'
		resp = self.client.post(url)
		self.assertEqual(resp.status_code, 200)
		trip.refresh_from_db()
		self.vehicle.refresh_from_db()
		self.driver.refresh_from_db()
		self.assertEqual(trip.status, 'Cancelled')
		self.assertEqual(self.vehicle.status, 'Available')
		self.assertEqual(self.driver.status, 'Available')

	def test_cancel_completed_trip_rejected(self):
		trip = Trip.objects.create(
			vehicle=self.vehicle, driver=self.driver, created_by=self.fleet,
			source='A', destination='B', cargo_weight=Decimal('100.00'), planned_distance=Decimal('10.00'), status='Completed'
		)

		self.auth_as(self.fleet)
		url = f'/api/v1/trips/{trip.id}/cancel/'
		resp = self.client.post(url)
		self.assertEqual(resp.status_code, 400)

	def test_double_dispatch_second_call_fails(self):
		trip = Trip.objects.create(
			vehicle=self.vehicle, driver=self.driver, created_by=self.fleet,
			source='A', destination='B', cargo_weight=Decimal('100.00'), planned_distance=Decimal('10.00')
		)

		self.auth_as(self.fleet)
		url = f'/api/v1/trips/{trip.id}/dispatch/'
		resp1 = self.client.post(url)
		self.assertEqual(resp1.status_code, 200)
		resp2 = self.client.post(url)
		self.assertEqual(resp2.status_code, 409)

