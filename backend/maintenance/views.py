from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from common.permissions import IsRole

from .models import MaintenanceLog
from .serializers import MaintenanceCloseSerializer, MaintenanceLogSerializer, MaintenanceOpenSerializer
from .services import close_maintenance_log, open_maintenance_log


class MaintenanceListCreateView(generics.ListCreateAPIView):
	queryset = MaintenanceLog.objects.select_related('vehicle').all().order_by('-opened_at')

	def get_permissions(self):
		if self.request.method == 'POST':
			return [IsAuthenticated(), IsRole(['fleet_manager'])]
		return [IsAuthenticated()]

	def get_serializer_class(self):
		if self.request.method == 'POST':
			return MaintenanceOpenSerializer
		return MaintenanceLogSerializer

	def get_queryset(self):
		queryset = super().get_queryset()
		vehicle_id = self.request.query_params.get('vehicle_id')
		status_param = self.request.query_params.get('status')

		if vehicle_id:
			queryset = queryset.filter(vehicle_id=vehicle_id)
		if status_param:
			queryset = queryset.filter(status=status_param)
		return queryset

	def create(self, request, *args, **kwargs):
		serializer = self.get_serializer(data=request.data)
		serializer.is_valid(raise_exception=True)
		log = open_maintenance_log(**serializer.validated_data)
		output = MaintenanceLogSerializer(log)
		return Response(output.data, status=201)


class MaintenanceCloseView(APIView):
	def get_permissions(self):
		return [IsAuthenticated(), IsRole(['fleet_manager'])]

	def post(self, request, pk):
		serializer = MaintenanceCloseSerializer(data=request.data)
		serializer.is_valid(raise_exception=True)
		log = generics.get_object_or_404(MaintenanceLog.objects.select_related('vehicle'), pk=pk)
		closed_log = close_maintenance_log(log, cost=serializer.validated_data.get('cost'))
		return Response(MaintenanceLogSerializer(closed_log).data, status=200)
