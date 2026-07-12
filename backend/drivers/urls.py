from django.urls import path

from .views import (
	AvailableDriverListView,
	DriverListCreateView,
	DriverUpdateView,
	ExpiringLicensesView,
)

urlpatterns = [
	path('', DriverListCreateView.as_view(), name='driver-list-create'),
	path('<int:pk>/', DriverUpdateView.as_view(), name='driver-update'),
	path('available/', AvailableDriverListView.as_view(), name='driver-available'),
	path('expiring-licenses/', ExpiringLicensesView.as_view(), name='driver-expiring-licenses'),
]
