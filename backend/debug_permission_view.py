import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
import django
django.setup()

from accounts.tests import DummyRoleView
from rest_framework.test import APIRequestFactory
from accounts.models import User
import traceback

factory = APIRequestFactory()
request = factory.get('/dummy-role/')
user = User.objects.create_user(email='driver@example.com', password='Password123', full_name='Driver User', role='driver')
request.user = user

try:
    response = DummyRoleView.as_view()(request)
    print(response.status_code)
    print(response.content.decode())
except Exception:
    traceback.print_exc()
