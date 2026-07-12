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
