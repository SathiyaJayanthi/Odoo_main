from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from common.permissions import IsRole
from vehicles.models import Vehicle

from .serializers import CostSummarySerializer, ExpenseSerializer, FuelLogSerializer
from .services import get_vehicle_cost_summary


class FuelLogCreateView(generics.CreateAPIView):
	serializer_class = FuelLogSerializer

	def get_permissions(self):
		return [IsAuthenticated(), IsRole(['driver', 'financial_analyst'])]


class ExpenseCreateView(generics.CreateAPIView):
	serializer_class = ExpenseSerializer

	def get_permissions(self):
		return [IsAuthenticated(), IsRole(['financial_analyst', 'fleet_manager'])]


class VehicleCostSummaryView(APIView):
	def get_permissions(self):
		return [IsAuthenticated(), IsRole(['financial_analyst', 'fleet_manager'])]

	def get(self, request, vehicle_id):
		generics.get_object_or_404(Vehicle, pk=vehicle_id)
		summary = get_vehicle_cost_summary(vehicle_id)
		return Response(CostSummarySerializer(summary).data)
