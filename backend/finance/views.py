from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from common.permissions import IsRole
from vehicles.models import Vehicle

from .serializers import CostSummarySerializer, ExpenseSerializer, FuelLogSerializer
from .services import get_vehicle_cost_summary


class FuelLogCreateView(generics.ListCreateAPIView):
	serializer_class = FuelLogSerializer

	def get_permissions(self):
		if self.request.method == 'POST':
			return [IsAuthenticated(), IsRole(['driver', 'financial_analyst'])]
		return [IsAuthenticated(), IsRole(['driver', 'financial_analyst', 'fleet_manager'])]

	def get_queryset(self):
		queryset = FuelLog.objects.all().order_by('-log_date')
		vehicle_id = self.request.query_params.get('vehicle_id')
		if vehicle_id:
			queryset = queryset.filter(vehicle_id=vehicle_id)
		return queryset


class ExpenseCreateView(generics.ListCreateAPIView):
	serializer_class = ExpenseSerializer

	def get_permissions(self):
		return [IsAuthenticated(), IsRole(['financial_analyst', 'fleet_manager'])]

	def get_queryset(self):
		queryset = Expense.objects.all().order_by('-expense_date')
		vehicle_id = self.request.query_params.get('vehicle_id')
		if vehicle_id:
			queryset = queryset.filter(vehicle_id=vehicle_id)
		return queryset


class VehicleCostSummaryView(APIView):
	def get_permissions(self):
		return [IsAuthenticated(), IsRole(['financial_analyst', 'fleet_manager'])]

	def get(self, request, vehicle_id):
		generics.get_object_or_404(Vehicle, pk=vehicle_id)
		summary = get_vehicle_cost_summary(vehicle_id)
		return Response(CostSummarySerializer(summary).data)
