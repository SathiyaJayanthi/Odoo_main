from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from common.permissions import IsRole

from .models import Vehicle
from .serializers import VehicleSerializer
from .services import vehicle_in_use


class VehicleListCreateView(generics.ListCreateAPIView):
	queryset = Vehicle.objects.all().order_by('-created_at')
	serializer_class = VehicleSerializer

	def get_permissions(self):
		if self.request.method == 'POST':
			return [IsAuthenticated(), IsRole(['fleet_manager'])]
		return [IsAuthenticated()]

	def get_queryset(self):
		queryset = super().get_queryset()
		status_param = self.request.query_params.get('status')
		type_param = self.request.query_params.get('type')
		region_param = self.request.query_params.get('region')

		if status_param:
			queryset = queryset.filter(status=status_param)
		if type_param:
			queryset = queryset.filter(type=type_param)
		if region_param:
			queryset = queryset.filter(region=region_param)
		return queryset


class VehicleDetailView(generics.RetrieveUpdateDestroyAPIView):
	queryset = Vehicle.objects.all()
	serializer_class = VehicleSerializer

	def get_permissions(self):
		if self.request.method in ('PATCH', 'PUT', 'DELETE'):
			return [IsAuthenticated(), IsRole(['fleet_manager'])]
		return [IsAuthenticated()]

	def destroy(self, request, *args, **kwargs):
		vehicle = self.get_object()
		if vehicle_in_use(vehicle):
			return Response(
				{
					'error': {
						'code': '409',
						'message': 'Vehicle is currently in use and cannot be deleted.',
					}
				},
				status=status.HTTP_409_CONFLICT,
			)
		return super().destroy(request, *args, **kwargs)


class AvailableVehicleListView(generics.ListAPIView):
	serializer_class = VehicleSerializer
	permission_classes = [IsAuthenticated]

	def get_queryset(self):
		return Vehicle.objects.filter(status='Available').exclude(status='Retired').order_by(
			'-created_at'
		)
