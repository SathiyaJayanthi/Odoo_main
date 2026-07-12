from django.urls import path

from .views import MaintenanceCloseView, MaintenanceListCreateView

urlpatterns = [
	path('', MaintenanceListCreateView.as_view(), name='maintenance-list-create'),
	path('<int:pk>/close/', MaintenanceCloseView.as_view(), name='maintenance-close'),
]
