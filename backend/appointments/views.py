from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.dateparse import parse_date
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from portal.services import log_admin_action

from .models import Appointment, AppointmentHistory, AppointmentStatus
from .serializers import AppointmentGuestSerializer, AppointmentHistorySerializer, AppointmentSerializer
from .services import (
    build_doctor_slots,
    get_active_appointments_queryset,
    get_appointment_by_code_and_phone,
    get_appointment_by_id_or_code,
    get_appointments_by_phone,
    lookup_appointment_for_checkin,
    reschedule_appointment,
    set_appointment_status,
    soft_delete_appointment,
)


def _admin_actor(request):
    user = getattr(request, 'user', None)
    if user and hasattr(user, 'full_name'):
        return user.full_name, getattr(user, 'role', 'admin'), request.META.get('REMOTE_ADDR')
    return request.data.get('changed_by', 'Admin'), request.data.get('changed_by_role', 'admin'), request.META.get('REMOTE_ADDR')


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


class AdminAppointmentViewSet(viewsets.ModelViewSet):
    """Admin-level appointment management — list, retrieve, status updates, delete."""

    serializer_class = AppointmentSerializer

    def get_queryset(self):
        queryset = Appointment.objects.filter(is_deleted=False).select_related(
            'doctor', 'specialty'
        ).order_by('-scheduled_start')

        date_value = self.request.query_params.get('date')
        if date_value:
            queryset = queryset.filter(scheduled_start__date=date_value)

        status_value = self.request.query_params.get('status')
        if status_value and status_value.upper() != 'ALL':
            queryset = queryset.filter(status=status_value.upper())

        q = self.request.query_params.get('q')
        if q:
            q_lower = q.lower()
            queryset = queryset.filter(
                Q(code__icontains=q_lower)
                | Q(patient_full_name__icontains=q_lower)
                | Q(patient_phone__icontains=q_lower)
            )

        return queryset

    def get_object(self):
        queryset = self.filter_queryset(self.get_queryset())
        lookup_value = self.kwargs.get(self.lookup_field)
        if lookup_value and str(lookup_value).isdigit():
            instance = get_object_or_404(queryset, pk=lookup_value)
        else:
            instance = get_object_or_404(queryset, code=str(lookup_value).upper())
        return instance

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()

        # Summary counts (all appointments, not filtered by search)
        base_qs = Appointment.objects.filter(is_deleted=False)
        summary = {
            'total': base_qs.count(),
            'pending': base_qs.filter(status=AppointmentStatus.PENDING).count(),
            'confirmed': base_qs.filter(status=AppointmentStatus.CONFIRMED).count(),
            'checked_in': base_qs.filter(status=AppointmentStatus.CHECKED_IN).count(),
            'completed': base_qs.filter(status=AppointmentStatus.COMPLETED).count(),
            'cancelled': base_qs.filter(status=AppointmentStatus.CANCELLED).count(),
            'no_show': base_qs.filter(status=AppointmentStatus.NO_SHOW).count(),
        }

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response({'results': serializer.data, 'summary': summary})

    @action(detail=True, methods=['patch'], url_path='status')
    def update_status(self, request, pk=None):
        """PATCH /admin/appointments/{id}/status/ with { "status": "CONFIRMED" }"""
        appointment = self.get_object()
        new_status = request.data.get('status')
        if not new_status:
            return Response({'detail': 'status is required.'}, status=400)
        try:
            set_appointment_status(
                appointment,
                new_status.upper(),
                changed_by=request.data.get('changed_by', 'Admin'),
                changed_by_role=request.data.get('changed_by_role', 'admin'),
                note=request.data.get('note', ''),
            )
        except ValidationError as e:
            return Response(e.detail, status=400)
        serializer = AppointmentSerializer(appointment)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='reschedule')
    def reschedule(self, request, pk=None):
        """POST /admin/appointments/{id}/reschedule/
        Body: { "scheduled_start": "2026-03-25T09:00:00Z", "scheduled_end": "2026-03-25T09:20:00Z", "note": "..." }
        """
        from django.utils.dateparse import parse_datetime

        appointment = self.get_object()
        scheduled_start_raw = request.data.get('scheduled_start')
        scheduled_end_raw = request.data.get('scheduled_end')
        if not scheduled_start_raw or not scheduled_end_raw:
            return Response(
                {'detail': 'scheduled_start and scheduled_end are required.'},
                status=400,
            )
        scheduled_start = parse_datetime(scheduled_start_raw)
        scheduled_end = parse_datetime(scheduled_end_raw)
        if not scheduled_start or not scheduled_end:
            return Response(
                {'detail': 'scheduled_start and scheduled_end must be valid ISO datetime strings.'},
                status=400,
            )
        try:
            reschedule_appointment(
                appointment,
                new_scheduled_start=scheduled_start,
                new_scheduled_end=scheduled_end,
                changed_by=request.data.get('changed_by', 'Admin'),
                changed_by_role=request.data.get('changed_by_role', 'admin'),
                note=request.data.get('note', ''),
            )
        except ValidationError as e:
            return Response(e.detail, status=400)
        serializer = AppointmentSerializer(appointment)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], url_path='history')
    def history(self, request, pk=None):
        """GET /admin/appointments/{id}/history/"""
        appointment = self.get_object()
        history_qs = AppointmentHistory.objects.filter(appointment=appointment)
        serializer = AppointmentHistorySerializer(history_qs, many=True)
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        code = instance.code
        soft_delete_appointment(instance)
        actor_name, actor_role, ip = _admin_actor(request)
        log_admin_action(
            'DELETE', 'Appointment', instance.id, code,
            actor_name=actor_name, actor_role=actor_role,
            detail=f'Xóa lịch hẹn {code}', ip_address=ip,
        )
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

        visit_type = request.query_params.get('visit_type')
        return Response(build_doctor_slots(doctor_id, appointment_date, visit_type=visit_type))


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


class PublicAppointmentSearchByPhoneAPIView(APIView):
    def get(self, request, *args, **kwargs):
        phone = request.query_params.get('phone')
        code = request.query_params.get('code')

        if not phone:
            raise ValidationError({'phone': 'phone is required.'})

        try:
            appointments = get_appointments_by_phone(phone)
        except Exception as exc:
            raise NotFound('Appointment not found.') from exc

        if code:
            normalized_code = str(code).strip().upper()
            appointments = [item for item in appointments if item.code == normalized_code]

        if not appointments:
            raise NotFound('Appointment not found.')

        serializer = AppointmentSerializer(appointments, many=True)
        return Response(serializer.data)


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

        from .services import set_appointment_status

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
