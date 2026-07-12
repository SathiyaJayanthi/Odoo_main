import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
import django
django.setup()

from rest_framework.test import APIClient
from accounts.models import User
import traceback

client = APIClient()
user = User.objects.create_user(email='driver@example.com', password='Password123', full_name='Driver User', role='driver')
client.force_authenticate(user=user)

try:
    response = client.get('/dummy-role/')
    print(response.status_code)
    print(response.content.decode())
except Exception:
    traceback.print_exc()
