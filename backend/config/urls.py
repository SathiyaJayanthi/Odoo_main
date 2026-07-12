from django.contrib import admin
from django.urls import include, path
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from common.permissions import IsRole


class DummyIsAuthenticatedView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({'ok': True})


class DummyRoleView(APIView):
    permission_classes = [IsRole(['fleet_manager'])]

    def get(self, request):
        return Response({'ok': True})


urlpatterns = [
    path('dummy-auth/', DummyIsAuthenticatedView.as_view()),
    path('dummy-role/', DummyRoleView.as_view()),
    path('admin/', admin.site.urls),
    path('api/v1/auth/', include('accounts.urls')),
    path('api/v1/vehicles/', include('vehicles.urls')),
    path('api/v1/drivers/', include('drivers.urls')),
    path('api/v1/trips/', include('trips.urls')),
    path('api/v1/maintenance/', include('maintenance.urls')),
    path('api/v1/finance/', include('finance.urls')),
    path('api/v1/reports/', include('reports.urls')),
]
