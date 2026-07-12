from rest_framework.permissions import BasePermission
from accounts.models import User


class IsRole(BasePermission):
    allowed_roles = []

    def __init__(self, allowed_roles=None):
        if allowed_roles is not None:
            self.allowed_roles = list(allowed_roles)

    def has_permission(self, request, view):
        user = getattr(request, 'user', None)
        if not user or not getattr(user, 'is_authenticated', False):
            return False

        allowed_roles = getattr(view, 'allowed_roles', self.allowed_roles)
        role = getattr(user, 'role', None)
        return bool(role in allowed_roles)


class IsFleetManager(BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'fleet_manager'


class IsDriver(BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'driver'


class IsSafetyOfficer(BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'safety_officer'


class IsFinancialAnalyst(BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'financial_analyst'


class IsManagerOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        if request.method in ('GET', 'HEAD', 'OPTIONS'):
            return request.user and request.user.is_authenticated
        return request.user and request.user.is_authenticated and request.user.role == 'fleet_manager'
