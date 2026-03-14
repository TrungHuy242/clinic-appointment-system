from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.dateparse import parse_date
from rest_framework import status, viewsets
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import AppointmentStatus
from .serializers import AppointmentGuestSerializer, AppointmentSerializer
from .services import (
    build_doctor_slots,
    get_active_appointments_queryset,
    get_appointment_by_code_and_phone,
    get_appointment_by_id_or_code,
    lookup_appointment_for_checkin,
    set_appointment_status,
    soft_delete_appointment,
)


class AppointmentViewSet(viewsets.ModelViewSet):
    serializer_class = AppointmentSerializer

    def get_queryset(self):
        queryset = get_active_appointments_queryset()

        date_value = self.request.query_params.get('date')
        if date_value:
            queryset = queryset.filter(scheduled_start__date=date_value)

        status_value = self.request.query_params.get('status')
        if status_value:
            queryset = queryset.filter(status=status_value)

        doctor_id = self.request.query_params.get('doctor_id')
        if doctor_id:
            queryset = queryset.filter(doctor_id=doctor_id)

        return queryset

    def get_object(self):
        queryset = self.filter_queryset(self.get_queryset())
        lookup_value = self.kwargs.get(self.lookup_field)

        if lookup_value and str(lookup_value).isdigit():
            instance = get_object_or_404(queryset, pk=lookup_value)
        else:
            instance = get_object_or_404(queryset, code=str(lookup_value).upper())

        self.check_object_permissions(self.request, instance)
        return instance

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        soft_delete_appointment(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)


class GuestAppointmentCreateAPIView(APIView):
    def post(self, request, *args, **kwargs):
        serializer = AppointmentGuestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        appointment = serializer.save()
        response_serializer = AppointmentSerializer(appointment)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)


class PublicDoctorSlotsAPIView(APIView):
    def get(self, request, doctor_id, *args, **kwargs):
        appointment_date = parse_date(request.query_params.get('date') or '') or timezone.localdate()
        if request.query_params.get('date') and appointment_date is None:
            raise ValidationError({'date': 'date must be in YYYY-MM-DD format.'})

        return Response(build_doctor_slots(doctor_id, appointment_date))


class PublicAppointmentLookupAPIView(APIView):
    def get(self, request, *args, **kwargs):
        code = request.query_params.get('code')
        phone = request.query_params.get('phone')
        if not code:
            raise ValidationError({'code': 'code is required.'})
        if not phone:
            raise ValidationError({'phone': 'phone is required.'})

        try:
            appointment = get_appointment_by_code_and_phone(code, phone)
        except Exception as exc:
            raise NotFound('Appointment not found.') from exc

        return Response(AppointmentSerializer(appointment).data)


class PublicAppointmentDetailAPIView(APIView):
    def get(self, request, lookup_value, *args, **kwargs):
        try:
            appointment = get_appointment_by_id_or_code(lookup_value)
        except Exception as exc:
            raise NotFound('Appointment not found.') from exc

        return Response(AppointmentSerializer(appointment).data)


class PublicAppointmentStatusAPIView(APIView):
    allowed_statuses = {
        AppointmentStatus.CONFIRMED,
        AppointmentStatus.CANCELLED,
    }

    def patch(self, request, lookup_value, *args, **kwargs):
        new_status = request.data.get('status')
        if new_status not in self.allowed_statuses:
            raise ValidationError(
                {
                    'status': (
                        'status must be one of: '
                        f"{AppointmentStatus.CONFIRMED}, {AppointmentStatus.CANCELLED}."
                    )
                }
            )

        try:
            appointment = get_appointment_by_id_or_code(lookup_value)
        except Exception as exc:
            raise NotFound('Appointment not found.') from exc

        set_appointment_status(appointment, new_status)
        return Response(AppointmentSerializer(appointment).data)


class ReceptionCheckinLookupAPIView(APIView):
    def post(self, request, *args, **kwargs):
        appointment_date = parse_date(request.data.get('date') or '') or timezone.localdate()
        if request.data.get('date') and appointment_date is None:
            raise ValidationError({'date': 'date must be in YYYY-MM-DD format.'})

        result = lookup_appointment_for_checkin(
            query=request.data.get('query'),
            appointment_date=appointment_date,
        )
        appointment = result['appointment']

        return Response(
            {
                'state': result['state'],
                'appointment': AppointmentSerializer(appointment).data if appointment else None,
            }
        )
