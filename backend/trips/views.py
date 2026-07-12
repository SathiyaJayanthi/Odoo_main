from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions

from .serializers import TripSerializer
from . import services


class TripListCreateAPIView(APIView):
	permission_classes = [permissions.IsAuthenticated]

	def get(self, request):
		status_q = request.query_params.get('status')
		qs = services.Trip.objects.all() if hasattr(services, 'Trip') else None
		# import model directly
		from .models import Trip
		qs = Trip.objects.all()
		if status_q:
			qs = qs.filter(status=status_q)
		serializer = TripSerializer(qs, many=True)
		return Response(serializer.data)

	def post(self, request):
		# Only drivers and fleet managers may create trips per spec
		from common.permissions import IsRole
		perm = IsRole(['driver', 'fleet_manager'])
		if not perm.has_permission(request, self):
			return Response({'error': {'code': 'forbidden', 'message': 'Forbidden'}}, status=403)

		data = request.data
		try:
			trip = services.create_trip(
				user=request.user,
				vehicle_id=data.get('vehicle_id'),
				driver_id=data.get('driver_id'),
				source=data.get('source'),
				destination=data.get('destination'),
				cargo_weight=data.get('cargo_weight'),
				planned_distance=data.get('planned_distance'),
			)
		except services.ServiceError as e:
			return Response(e.to_dict(), status=e.status_code)

		serializer = TripSerializer(trip)
		return Response(serializer.data, status=201)


class DispatchTripAPIView(APIView):
	permission_classes = [permissions.IsAuthenticated]

	def post(self, request, pk):
		from common.permissions import IsRole
		perm = IsRole(['driver', 'fleet_manager'])
		if not perm.has_permission(request, self):
			return Response({'error': {'code': 'forbidden', 'message': 'Forbidden'}}, status=403)

		try:
			trip = services.dispatch_trip(pk)
		except services.ServiceError as e:
			return Response(e.to_dict(), status=e.status_code)

		serializer = TripSerializer(trip)
		return Response(serializer.data)


class CompleteTripAPIView(APIView):
	permission_classes = [permissions.IsAuthenticated]

	def post(self, request, pk):
		from common.permissions import IsRole
		perm = IsRole(['driver', 'fleet_manager'])
		if not perm.has_permission(request, self):
			return Response({'error': {'code': 'forbidden', 'message': 'Forbidden'}}, status=403)

		data = request.data
		try:
			trip = services.complete_trip(pk, data.get('final_odometer'), data.get('fuel_consumed'))
		except services.ServiceError as e:
			return Response(e.to_dict(), status=e.status_code)

		serializer = TripSerializer(trip)
		return Response(serializer.data)


class CancelTripAPIView(APIView):
	permission_classes = [permissions.IsAuthenticated]

	def post(self, request, pk):
		from common.permissions import IsRole
		perm = IsRole(['driver', 'fleet_manager'])
		if not perm.has_permission(request, self):
			return Response({'error': {'code': 'forbidden', 'message': 'Forbidden'}}, status=403)

		try:
			trip = services.cancel_trip(pk, request.data.get('reason'))
		except services.ServiceError as e:
			return Response(e.to_dict(), status=e.status_code)

		serializer = TripSerializer(trip)
		return Response(serializer.data)
