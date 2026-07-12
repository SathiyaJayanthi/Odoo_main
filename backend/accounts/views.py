from rest_framework import status
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
            return Response(serializer.to_representation(user), status=status.HTTP_201_CREATED)

        errors = serializer.errors
        field_name = next(iter(errors), None)
        if field_name:
            first_error = errors[field_name][0]
            return Response(
                {
                    'error': {
                        'field': field_name,
                        'message': first_error,
                    }
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {'error': {'message': 'Invalid signup data'}},
            status=status.HTTP_400_BAD_REQUEST,
        )


class LoginView(TokenObtainPairView):
    permission_classes = [AllowAny]
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
        except Exception:
            return Response(
                {'error': {'message': 'Invalid email or password'}},
                status=status.HTTP_401_UNAUTHORIZED,
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
