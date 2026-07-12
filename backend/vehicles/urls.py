from django.urls import path

from .views import AvailableVehicleListView, VehicleDetailView, VehicleListCreateView

urlpatterns = [
	path('', VehicleListCreateView.as_view(), name='vehicle-list-create'),
	path('available/', AvailableVehicleListView.as_view(), name='vehicle-available'),
	path('<int:pk>/', VehicleDetailView.as_view(), name='vehicle-detail'),
]
