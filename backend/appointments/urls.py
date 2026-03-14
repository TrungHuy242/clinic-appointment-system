from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import AppointmentViewSet, GuestAppointmentCreateAPIView

router = DefaultRouter()
router.register(r'reception/appointments', AppointmentViewSet, basename='reception-appointment')

urlpatterns = [
    path('public/appointments/guest/', GuestAppointmentCreateAPIView.as_view(), name='public-guest-appointment'),
]
urlpatterns += router.urls
