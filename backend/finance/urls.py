from django.urls import path

from .views import ExpenseCreateView, FuelLogCreateView, VehicleCostSummaryView

urlpatterns = [
	path('fuel-logs/', FuelLogCreateView.as_view(), name='fuel-log-create'),
	path('expenses/', ExpenseCreateView.as_view(), name='expense-create'),
	path('vehicles/<int:vehicle_id>/cost-summary/', VehicleCostSummaryView.as_view(), name='vehicle-cost-summary'),
]
