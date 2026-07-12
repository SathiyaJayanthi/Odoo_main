import os

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

import django

django.setup()

from accounts.tests import DummyRoleView
from rest_framework.test import APIRequestFactory
from accounts.models import User

factory = APIRequestFactory()
request = factory.get('/dummy-role/')
user = User(email='x@example.com', role='driver', full_name='X')
request.user = user

import traceback

try:
    DummyRoleView.as_view()(request)
except Exception:
    traceback.print_exc()
