from decimal import Decimal

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from finance.models import FuelLog
from maintenance.models import MaintenanceLog
from vehicles.models import Vehicle


class FinanceAPITests(APITestCase):
	def setUp(self):
		user_model = get_user_model()
		self.analyst = user_model.objects.create(
			email='analyst@demo.com',
			full_name='Finance Analyst',
			role='financial_analyst',
		)
		self.analyst.set_password('demopass123')
		self.analyst.save(update_fields=['password'])
		self.client.force_authenticate(user=self.analyst)

	def test_cost_summary_operational_cost_is_fuel_plus_maintenance(self):
		vehicle = Vehicle.objects.create(
			registration_number='MH12FIN001',
			name_model='Finance Van',
			type='Van',
			max_load_capacity='700.00',
			odometer='9000.00',
			acquisition_cost='500000.00',
			status='Available',
		)

		FuelLog.objects.create(
			vehicle=vehicle,
			liters='20.00',
			cost='2500.00',
			log_date='2026-01-10',
		)
		FuelLog.objects.create(
			vehicle=vehicle,
			liters='15.00',
			cost='1800.00',
			log_date='2026-01-11',
		)

		MaintenanceLog.objects.create(
			vehicle=vehicle,
			description='Closed maintenance',
			cost='3000.00',
			status='Closed',
		)
		MaintenanceLog.objects.create(
			vehicle=vehicle,
			description='Open maintenance',
			cost='9999.00',
			status='Open',
		)

		response = self.client.get(f'/api/v1/vehicles/{vehicle.id}/cost-summary/')

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertEqual(Decimal(str(response.data['fuel_total'])), Decimal('4300.00'))
		self.assertEqual(Decimal(str(response.data['maintenance_total'])), Decimal('3000.00'))
		self.assertEqual(Decimal(str(response.data['operational_cost'])), Decimal('7300.00'))

	def test_fuel_log_rbac_permissions(self):
		user_model = get_user_model()
		
		# Create users for all roles
		driver = user_model.objects.create_user(email='driver@demo.com', password='pwd', role='driver')
		fleet_manager = user_model.objects.create_user(email='fm@demo.com', password='pwd', role='fleet_manager')
		safety_officer = user_model.objects.create_user(email='so@demo.com', password='pwd', role='safety_officer')
		
		vehicle = Vehicle.objects.create(
			registration_number='MH12FIN002',
			name_model='Finance Van 2',
			type='Van',
			max_load_capacity='700.00',
			odometer='9000.00',
			acquisition_cost='500000.00',
			status='Available',
		)

		payload = {
			'vehicle_id': vehicle.id,
			'liters': '10.00',
			'cost': '1000.00',
			'log_date': '2026-01-12'
		}

		# Safety Officer is blocked from both POST and GET
		self.client.force_authenticate(user=safety_officer)
		res_post = self.client.post('/api/v1/fuel-logs/', payload, format='json')
		self.assertEqual(res_post.status_code, status.HTTP_403_FORBIDDEN)
		res_get = self.client.get('/api/v1/fuel-logs/')
		self.assertEqual(res_get.status_code, status.HTTP_403_FORBIDDEN)

		# Fleet Manager is blocked from POST, but allowed to GET
		self.client.force_authenticate(user=fleet_manager)
		res_post = self.client.post('/api/v1/fuel-logs/', payload, format='json')
		self.assertEqual(res_post.status_code, status.HTTP_403_FORBIDDEN)
		res_get = self.client.get('/api/v1/fuel-logs/')
		self.assertEqual(res_get.status_code, status.HTTP_200_OK)

		# Driver is allowed to POST and GET
		self.client.force_authenticate(user=driver)
		res_post = self.client.post('/api/v1/fuel-logs/', payload, format='json')
		self.assertEqual(res_post.status_code, status.HTTP_201_CREATED)
		res_get = self.client.get('/api/v1/fuel-logs/')
		self.assertEqual(res_get.status_code, status.HTTP_200_OK)

	def test_expense_rbac_permissions(self):
		user_model = get_user_model()
		
		# Create users for roles
		driver = user_model.objects.create_user(email='driver-e@demo.com', password='pwd', role='driver')
		fleet_manager = user_model.objects.create_user(email='fm-e@demo.com', password='pwd', role='fleet_manager')
		
		vehicle = Vehicle.objects.create(
			registration_number='MH12FIN003',
			name_model='Finance Van 3',
			type='Van',
			max_load_capacity='700.00',
			odometer='9000.00',
			acquisition_cost='500000.00',
			status='Available',
		)

		payload = {
			'vehicle_id': vehicle.id,
			'category': 'Toll',
			'amount': '150.00',
			'expense_date': '2026-01-12'
		}

		# Driver is blocked from both POST and GET
		self.client.force_authenticate(user=driver)
		res_post = self.client.post('/api/v1/expenses/', payload, format='json')
		self.assertEqual(res_post.status_code, status.HTTP_403_FORBIDDEN)
		res_get = self.client.get('/api/v1/expenses/')
		self.assertEqual(res_get.status_code, status.HTTP_403_FORBIDDEN)

		# Fleet Manager is allowed to POST and GET
		self.client.force_authenticate(user=fleet_manager)
		res_post = self.client.post('/api/v1/expenses/', payload, format='json')
		self.assertEqual(res_post.status_code, status.HTTP_201_CREATED)
		res_get = self.client.get('/api/v1/expenses/')
		self.assertEqual(res_get.status_code, status.HTTP_200_OK)

