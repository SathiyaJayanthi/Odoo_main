from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from vehicles.models import Vehicle


class VehicleAPITests(APITestCase):
	def setUp(self):
		user_model = get_user_model()
		self.manager = user_model.objects.create(
			email='manager@demo.com',
			full_name='Fleet Manager',
			role='fleet_manager',
		)
		self.manager.set_password('demopass123')
		self.manager.save(update_fields=['password'])
		self.client.force_authenticate(user=self.manager)

		Vehicle.objects.create(
			registration_number='MH12AB1234',
			name_model='Tata Ace Van-05',
			type='Van',
			max_load_capacity='500.00',
			odometer='12000.00',
			acquisition_cost='650000.00',
			status='Available',
		)

	def test_reject_duplicate_registration_number(self):
		payload = {
			'registration_number': 'MH12AB1234',
			'name_model': 'Duplicate Van',
			'type': 'Van',
			'max_load_capacity': '600.00',
			'odometer': '1000.00',
			'acquisition_cost': '500000.00',
			'status': 'Available',
		}

		response = self.client.post('/api/v1/vehicles/', payload, format='json')

		self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
		self.assertEqual(response.data['error']['field'], 'registration_number')
