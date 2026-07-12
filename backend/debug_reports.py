import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
import django
django.setup()

from rest_framework.test import APIRequestFactory
from rest_framework.request import Request
from accounts.models import User
from reports.views import DashboardView
import traceback

factory = APIRequestFactory()
request = factory.get('/api/v1/reports/dashboard/')
user = User.objects.get_or_create(email='fleet_reports_debug_unique@example.com', defaults={'full_name': 'Fleet Manager', 'role': 'fleet_manager'})[0]
user.set_password('Pass1234')
user.save()
request.user = user

try:
    drf_request = Request(request)
    drf_request.user = user
    response = DashboardView().get(drf_request)
    print(response.status_code)
    print(response.data)
except Exception as exc:
    print(type(exc).__name__, exc)
    traceback.print_exc()
