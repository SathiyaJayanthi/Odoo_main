from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from maintenance.models import MaintenanceLog
from vehicles.models import Vehicle


class MaintenanceAPITests(APITestCase):
	def setUp(self):
		user_model = get_user_model()
		self.manager = user_model.objects.create(
			email='manager-maint@demo.com',
			full_name='Fleet Manager',
			role='fleet_manager',
		)
		self.manager.set_password('demopass123')
		self.manager.save(update_fields=['password'])
		self.client.force_authenticate(user=self.manager)

	def test_open_rejects_on_trip_vehicle(self):
		vehicle = Vehicle.objects.create(
			registration_number='MH12ONTRIP',
			name_model='Transit Van',
			type='Van',
			max_load_capacity='500.00',
			odometer='10000.00',
			acquisition_cost='450000.00',
			status='On Trip',
		)

		response = self.client.post(
			'/api/v1/maintenance/',
			{'vehicle_id': vehicle.id, 'description': 'Engine check', 'cost': '1000.00'},
			format='json',
		)

		self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)

	def test_close_idempotency_rejects_double_close(self):
		vehicle = Vehicle.objects.create(
			registration_number='MH12INSHOP',
			name_model='Workshop Van',
			type='Van',
			max_load_capacity='500.00',
			odometer='10000.00',
			acquisition_cost='450000.00',
			status='In Shop',
		)
		log = MaintenanceLog.objects.create(
			vehicle=vehicle,
			description='Brake service',
			cost='1500.00',
			status='Open',
		)

		first_close = self.client.post(
			f'/api/v1/maintenance/{log.id}/close/',
			{'cost': '1800.00'},
			format='json',
		)
		self.assertEqual(first_close.status_code, status.HTTP_200_OK)

		second_close = self.client.post(
			f'/api/v1/maintenance/{log.id}/close/',
			{'cost': '1800.00'},
			format='json',
		)
		self.assertEqual(second_close.status_code, status.HTTP_400_BAD_REQUEST)
