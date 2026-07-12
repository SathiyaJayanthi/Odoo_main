from django.urls import path
from .views import TripListCreateAPIView, DispatchTripAPIView, CompleteTripAPIView, CancelTripAPIView

urlpatterns = [
	path('', TripListCreateAPIView.as_view(), name='trips-list-create'),
	path('<int:pk>/dispatch/', DispatchTripAPIView.as_view(), name='trips-dispatch'),
	path('<int:pk>/complete/', CompleteTripAPIView.as_view(), name='trips-complete'),
	path('<int:pk>/cancel/', CancelTripAPIView.as_view(), name='trips-cancel'),
]
