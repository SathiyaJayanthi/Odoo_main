from rest_framework.permissions import BasePermission


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
