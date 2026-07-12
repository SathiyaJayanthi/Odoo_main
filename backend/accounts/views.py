from rest_framework import status
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from accounts.serializers import CustomTokenObtainPairSerializer, SignupSerializer


class SignupView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = SignupSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            payload = serializer.to_representation(user)
            return Response(
                {
                    'message': 'Account created successfully',
                    'user': payload,
                    'id': payload['id'],
                    'email': payload['email'],
                    'role': payload['role'],
                },
                status=status.HTTP_201_CREATED,
            )

        errors = serializer.errors
        first_field = next(iter(errors), None)
        first_error = errors.get(first_field, ['Invalid signup data'])[0] if first_field else 'Invalid signup data'
        return Response(
            {
                'error': {
                    'field': first_field or 'request',
                    'message': first_error,
                }
            },
            status=status.HTTP_400_BAD_REQUEST,
        )


class LoginView(TokenObtainPairView):
    permission_classes = [AllowAny]
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
        except AuthenticationFailed:
            return Response(
                {'error': {'field': 'credentials', 'message': 'Invalid email or password'}},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        except Exception:
            field_name = next(iter(serializer.errors), 'email')
            first_error = serializer.errors.get(field_name, ['Invalid email or password'])[0]
            return Response(
                {'error': {'field': field_name, 'message': first_error}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        data = serializer.validated_data
        return Response(
            {
                'access': data['access'],
                'refresh': data['refresh'],
                'role': data['role'],
                'user': data['user'],
            },
            status=status.HTTP_200_OK,
        )


class CustomTokenRefreshView(TokenRefreshView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            return Response({'access': response.data['access']}, status=status.HTTP_200_OK)
        return response
