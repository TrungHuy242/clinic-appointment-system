from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    AppointmentViewSet,
    GuestAppointmentCreateAPIView,
    PublicAppointmentDetailAPIView,
    PublicAppointmentLookupAPIView,
    PublicAppointmentSearchByPhoneAPIView,
    PublicAppointmentStatusAPIView,
    PublicDoctorSlotsAPIView,
    ReceptionCheckinLookupAPIView,
)

router = DefaultRouter()
router.register(r'reception/appointments', AppointmentViewSet, basename='reception-appointment')

urlpatterns = [
    path('public/appointments/guest/', GuestAppointmentCreateAPIView.as_view(), name='public-guest-appointment'),
    path('public/appointments/lookup/', PublicAppointmentLookupAPIView.as_view(), name='public-appointment-lookup'),
    path(
        'public/appointments/search-by-phone/',
        PublicAppointmentSearchByPhoneAPIView.as_view(),
        name='public-appointment-search-by-phone',
    ),
    path('public/appointments/<str:lookup_value>/status/', PublicAppointmentStatusAPIView.as_view(), name='public-appointment-status'),
    path('public/appointments/<str:lookup_value>/', PublicAppointmentDetailAPIView.as_view(), name='public-appointment-detail'),
    path('public/doctors/<int:doctor_id>/slots/', PublicDoctorSlotsAPIView.as_view(), name='public-doctor-slots'),
    path('reception/checkin/lookup/', ReceptionCheckinLookupAPIView.as_view(), name='reception-checkin-lookup'),
]
urlpatterns += router.urls
