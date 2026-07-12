from datetime import date

from accounts.models import User
from django.core.management.base import BaseCommand
from drivers.models import Driver
from vehicles.models import Vehicle


class Command(BaseCommand):
    help = 'Seed demo data (idempotent)'

    def handle(self, *args, **options):
        # Clean up existing operational logs for a fresh demo start
        self.stdout.write("Deleting existing trips, maintenance tickets, fuel logs, and operational expenses...")
        from trips.models import Trip
        from maintenance.models import MaintenanceLog
        from finance.models import FuelLog, Expense
        
        Trip.objects.all().delete()
        MaintenanceLog.objects.all().delete()
        FuelLog.objects.all().delete()
        Expense.objects.all().delete()

        # --- Users ---
        users_data = [
            {
                'email': 'fleet_manager@demo.com',
                'full_name': 'Priya Sharma',
                'role': 'fleet_manager',
            },
            {
                'email': 'driver@demo.com',
                'full_name': 'Ravi Kumar',
                'role': 'driver',
            },
            {
                'email': 'safety_officer@demo.com',
                'full_name': 'Neha Gupta',
                'role': 'safety_officer',
            },
            {
                'email': 'financial_analyst@demo.com',
                'full_name': 'Amit Patel',
                'role': 'financial_analyst',
            },
        ]

        for data in users_data:
            user, created = User.objects.get_or_create(
                email=data['email'],
                defaults={
                    'full_name': data['full_name'],
                    'role': data['role'],
                },
            )
            if created:
                user.set_password('demopass123')
                user.save()
                self.stdout.write(self.style.SUCCESS(f"Created user: {user.email}"))
            else:
                self.stdout.write(f"User already exists: {user.email}")

        # --- Vehicle ---
        vehicle, created = Vehicle.objects.get_or_create(
            registration_number='MH12AB1234',
            defaults={
                'name_model': 'Tata Ace Van-05',
                'type': 'Van',
                'max_load_capacity': 500.00,
                'odometer': 12500,
                'acquisition_cost': 650000,
                'status': 'Available',
            },
        )
        if not created:
            vehicle.name_model = 'Tata Ace Van-05'
            vehicle.type = 'Van'
            vehicle.max_load_capacity = 500.00
            vehicle.odometer = 12500
            vehicle.acquisition_cost = 650000
            vehicle.status = 'Available'
            vehicle.save()
            self.stdout.write(f"Reset vehicle: {vehicle}")
        else:
            self.stdout.write(self.style.SUCCESS(f"Created vehicle: {vehicle}"))

        # --- Driver ---
        driver, created = Driver.objects.get_or_create(
            license_number='DL-MH-2024-99887',
            defaults={
                'name': 'Alex Fernandes',
                'license_category': 'LMV',
                'license_expiry': date(2027, 5, 1),
                'contact_number': '9876543210',
                'safety_score': 100,
                'status': 'Available',
            },
        )
        if not created:
            driver.name = 'Alex Fernandes'
            driver.license_category = 'LMV'
            driver.license_expiry = date(2027, 5, 1)
            driver.contact_number = '9876543210'
            driver.safety_score = 100
            driver.status = 'Available'
            driver.save()
            self.stdout.write(f"Reset driver: {driver}")
        else:
            self.stdout.write(self.style.SUCCESS(f"Created driver: {driver}"))

        self.stdout.write(self.style.SUCCESS('Seed complete.'))
