from django.urls import path

from reports.views import DashboardView, ExportView, FuelEfficiencyView, MaintenanceAlertsView, ROIView

urlpatterns = [
    path('dashboard/', DashboardView.as_view(), name='reports-dashboard'),
    path('fuel-efficiency/', FuelEfficiencyView.as_view(), name='reports-fuel-efficiency'),
    path('roi/', ROIView.as_view(), name='reports-roi'),
    path('maintenance-alerts/', MaintenanceAlertsView.as_view(), name='reports-maintenance-alerts'),
    path('export/', ExportView.as_view(), name='reports-export'),
]
