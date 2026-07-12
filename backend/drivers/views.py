from datetime import timedelta

from django.utils import timezone
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from common.permissions import IsRole

from .models import Driver
from .serializers import DriverSerializer


class DriverListCreateView(generics.ListCreateAPIView):
	queryset = Driver.objects.all().order_by('-created_at')
	serializer_class = DriverSerializer

	def get_permissions(self):
		if self.request.method == 'POST':
			return [IsAuthenticated(), IsRole(['fleet_manager', 'safety_officer'])]
		return [IsAuthenticated()]

	def get_queryset(self):
		queryset = super().get_queryset()
		status_param = self.request.query_params.get('status')
		if status_param:
			queryset = queryset.filter(status=status_param)
		return queryset


class DriverUpdateView(generics.UpdateAPIView):
	queryset = Driver.objects.all()
	serializer_class = DriverSerializer

	def get_permissions(self):
		return [IsAuthenticated(), IsRole(['fleet_manager', 'safety_officer'])]


class AvailableDriverListView(generics.ListAPIView):
	serializer_class = DriverSerializer
	permission_classes = [IsAuthenticated]

	def get_queryset(self):
		today = timezone.localdate()
		return Driver.objects.filter(status='Available', license_expiry__gte=today).order_by(
			'-created_at'
		)


class ExpiringLicensesView(generics.ListAPIView):
	serializer_class = DriverSerializer

	def get_permissions(self):
		return [IsAuthenticated(), IsRole(['safety_officer'])]

	def get_queryset(self):
		today = timezone.localdate()
		days_param = self.request.query_params.get('days', '30')
		try:
			days = max(int(days_param), 0)
		except ValueError:
			days = 30
		end_date = today + timedelta(days=days)
		return Driver.objects.filter(license_expiry__range=[today, end_date]).order_by('license_expiry')
