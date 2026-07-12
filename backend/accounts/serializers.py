from rest_framework import serializers
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from accounts.models import User


class SignupSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    full_name = serializers.CharField(required=True)
    role = serializers.ChoiceField(choices=[choice[0] for choice in User.ROLE_CHOICES], required=False, default='driver')

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('A user with this email already exists.')
        return value

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User.objects.create_user(password=password, **validated_data)
        return user

    def to_representation(self, instance):
        return {
            'id': instance.id,
            'email': instance.email,
            'role': instance.role,
        }


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = 'email'

    def validate(self, attrs):
        try:
            data = super().validate(attrs)
        except AuthenticationFailed as exc:
            raise AuthenticationFailed('Invalid email or password') from exc

        # This claim is for convenience only; protected endpoints must still re-check
        # the user's role from the database before granting access.
        data['role'] = self.user.role
        data['user'] = {
            'id': self.user.id,
            'email': self.user.email,
            'full_name': self.user.full_name,
            'role': self.user.role,
        }
        return data

    def get_token(self, user):
        token = super().get_token(user)
        token['role'] = user.role
        token['email'] = user.email
        return token
