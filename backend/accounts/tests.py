from django.urls import reverse
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.test import APITestCase
from rest_framework.views import APIView

from accounts.models import User
from common.permissions import IsRole


class DummyIsAuthenticatedView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({'ok': True})


class DummyRoleView(APIView):
    permission_classes = [IsRole(['fleet_manager'])]

    def get(self, request):
        return Response({'ok': True})


class AuthAPITests(APITestCase):
    def test_signup_creates_user_with_hashed_password_and_role(self):
        response = self.client.post(
            reverse('signup'),
            {
                'email': 'new.user@example.com',
                'password': 'SecurePass123',
                'full_name': 'New User',
                'role': 'driver',
            },
            format='json',
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['email'], 'new.user@example.com')
        self.assertEqual(response.data['role'], 'driver')

        user = User.objects.get(email='new.user@example.com')
        self.assertTrue(user.check_password('SecurePass123'))
        self.assertNotEqual(user.password, 'SecurePass123')

    def test_signup_rejects_duplicate_email(self):
        User.objects.create_user(
            email='duplicate@example.com',
            password='pass1234',
            full_name='Existing User',
            role='fleet_manager',
        )

        response = self.client.post(
            reverse('signup'),
            {
                'email': 'duplicate@example.com',
                'password': 'SecurePass123',
                'full_name': 'Another User',
                'role': 'driver',
            },
            format='json',
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data['error']['field'], 'email')

    def test_signup_rejects_invalid_role(self):
        response = self.client.post(
            reverse('signup'),
            {
                'email': 'invalid.role@example.com',
                'password': 'SecurePass123',
                'full_name': 'Invalid Role User',
                'role': 'not_a_role',
            },
            format='json',
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data['error']['field'], 'role')

    def test_login_succeeds_and_returns_tokens_and_user_info(self):
        user = User.objects.create_user(
            email='login@example.com',
            password='Password123',
            full_name='Login User',
            role='safety_officer',
        )

        response = self.client.post(
            reverse('login'),
            {'email': 'login@example.com', 'password': 'Password123'},
            format='json',
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertEqual(response.data['role'], user.role)
        self.assertEqual(response.data['user']['email'], user.email)

    def test_login_fails_with_wrong_password(self):
        User.objects.create_user(
            email='wrongpass@example.com',
            password='Password123',
            full_name='Wrong Pass',
            role='fleet_manager',
        )

        response = self.client.post(
            reverse('login'),
            {'email': 'wrongpass@example.com', 'password': 'BadPassword'},
            format='json',
        )

        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.data['error']['message'], 'Invalid email or password')

    def test_unauthenticated_request_to_protected_view_returns_401(self):
        response = self.client.get('/dummy-auth/')

        self.assertEqual(response.status_code, 401)

    def test_wrong_role_request_to_role_protected_view_returns_403(self):
        user = User.objects.create_user(
            email='driver@example.com',
            password='Password123',
            full_name='Driver User',
            role='driver',
        )
        request = type('Req', (), {'user': user})()
        permission = IsRole(['fleet_manager'])

        self.assertFalse(permission.has_permission(request, None))
