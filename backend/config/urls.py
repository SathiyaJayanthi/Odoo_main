from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/auth/', include('accounts.urls')),
    path('api/v1/vehicles/', include('vehicles.urls')),
    path('api/v1/drivers/', include('drivers.urls')),
    path('api/v1/trips/', include('trips.urls')),
    path('api/v1/maintenance/', include('maintenance.urls')),
    path('api/v1/finance/', include('finance.urls')),
    path('api/v1/reports/', include('reports.urls')),
]
