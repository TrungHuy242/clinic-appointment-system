from django.utils import timezone
from django.utils.dateparse import parse_date
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from common.auth import IsAdmin, IsAuthenticated, IsDoctor, IsReceptionist, SESSION_USER_KEY

from .services import (
    _staff_receptionist,
    change_doctor_password,
    change_password,
    change_receptionist_password,
    claim_profile,
    complete_visit,
    create_admin_receptionist_profile,
    delete_admin_patient_profile,
    delete_admin_receptionist_profile,
    delete_notification,
    get_account_info,
    get_admin_doctor_detail,
    get_admin_patient_profiles,
    get_admin_receptionist_profile,
    get_admin_receptionist_profiles,
    get_audit_logs_data,
    get_current_profile,
    get_dashboard_data,
    get_doctor_profile,
    get_doctor_schedule,
    get_doctor_visits,
    get_health_profile,
    get_notifications,
    get_patient_appointments,
    get_reception_patients_data,
    get_receptionist_dashboard_data,
    get_receptionist_profile,
    get_record_detail,
    get_reports_data,
    get_visit_detail,
    get_visit_queue,
    log_admin_action,
    reset_admin_patient_password,
    reset_admin_receptionist_password,
    unified_login,
    mark_all_notifications_read,
    mark_notification_read,
    register_patient_account,
    save_visit_draft,
    update_account_info,
    update_admin_receptionist_profile,
    update_doctor_profile,
    update_receptionist_profile,
    update_health_profile,
)


def _staff_doctor(request):
    """Return the catalog Doctor linked to the authenticated portal User, or raise."""
    user = getattr(request, "user", None)
    if not user or not getattr(user, "is_authenticated", False):
        raise PermissionDenied("Authentication required.")

    doctor_id = getattr(user, "doctor_id", None)
    if not doctor_id:
        raise PermissionDenied("No doctor account linked to this user.")
    from catalog.models import Doctor
    doctor = Doctor.objects.filter(pk=doctor_id, is_active=True).first()
    if not doctor:
        raise PermissionDenied("Doctor profile not found or inactive.")
    return doctor

class LoginAPIView(APIView):
    permission_classes = []
    authentication_classes = []

    def post(self, request, *args, **kwargs):
        return Response(unified_login(request.data, request))


class PatientRegisterAPIView(APIView):
    permission_classes = []
    authentication_classes = []

    def post(self, request, *args, **kwargs):
        return Response(register_patient_account(request.data))


class PatientClaimProfileAPIView(APIView):
    permission_classes = []
    authentication_classes = []

    def post(self, request, *args, **kwargs):
        appointment_code = request.data.get('appointmentCode') or request.data.get('appointment_code')
        full_name = request.data.get('fullName') or request.data.get('full_name')
        if not appointment_code:
            raise ValidationError({'appointmentCode': 'appointmentCode is required.'})
        if not full_name:
            raise ValidationError({'fullName': 'fullName is required.'})
        return Response(claim_profile(appointment_code, full_name))


class LogoutAPIView(APIView):
    """Clears the portal session. Public, no auth required."""

    permission_classes = []
    authentication_classes = []

    def post(self, request, *args, **kwargs):
        if hasattr(request, 'session'):
            request.session.pop(SESSION_USER_KEY, None)
        return Response({'success': True})


class CurrentPatientProfileAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        return Response(get_health_profile(get_current_profile(request)))

    def patch(self, request, *args, **kwargs):
        return Response(update_health_profile(get_current_profile(request), request.data))


class CurrentPatientAccountAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        return Response(get_account_info(get_current_profile(request)))

    def patch(self, request, *args, **kwargs):
        return Response(update_account_info(get_current_profile(request), request.data))


class PatientChangePasswordAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        return Response(change_password(get_current_profile(request), request.data))


class PatientAppointmentsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        tab = request.query_params.get('tab', 'upcoming')
        return Response(get_patient_appointments(get_current_profile(request), tab))


class PatientRecordDetailAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, record_code, *args, **kwargs):
        return Response(get_record_detail(get_current_profile(request), record_code))


class PatientNotificationsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        return Response(get_notifications(get_current_profile(request)))


class PatientNotificationsMarkAllReadAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        return Response(mark_all_notifications_read(get_current_profile(request)))


class PatientNotificationDetailAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, notification_id, *args, **kwargs):
        return Response(mark_notification_read(get_current_profile(request), notification_id))

    def delete(self, request, notification_id, *args, **kwargs):
        return Response(delete_notification(get_current_profile(request), notification_id))


# ── Doctor Portal ───────────────────────────────────────────────────────────────

class DoctorScheduleAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        raw_date = request.query_params.get('date') or ''
        appointment_date = parse_date(raw_date) or timezone.localdate()
        if raw_date and parse_date(raw_date) is None:
            raise ValidationError({'date': 'date must be in YYYY-MM-DD format.'})
        doctor = _staff_doctor(request)
        return Response(get_doctor_schedule(doctor=doctor, appointment_date=appointment_date))


class DoctorQueueAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        raw_date = request.query_params.get('date') or ''
        appointment_date = parse_date(raw_date) or timezone.localdate()
        if raw_date and parse_date(raw_date) is None:
            raise ValidationError({'date': 'date must be in YYYY-MM-DD format.'})
        doctor = _staff_doctor(request)
        return Response(get_visit_queue(doctor=doctor, appointment_date=appointment_date))


class DoctorVisitsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        status = request.query_params.get('status', 'all')
        doctor = _staff_doctor(request)
        return Response(get_doctor_visits(doctor=doctor, status=status))


class DoctorVisitDetailAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, code, *args, **kwargs):
        doctor = _staff_doctor(request)
        return Response(get_visit_detail(code, doctor=doctor))


class DoctorVisitStartAPIView(APIView):
    """
    POST /doctor/visits/<code>/start/
    Transitions an appointment from CHECKED_IN -> IN_PROGRESS.
    Only the doctor linked to the session can start their own appointments.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request, code, *args, **kwargs):
        doctor = _staff_doctor(request)
        from appointments.services import set_appointment_status, get_appointment_by_id_or_code
        from appointments.models import AppointmentStatus

        appointment = get_appointment_by_id_or_code(str(code).strip().upper())
        if appointment.doctor_id != doctor.id:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You are not assigned to this appointment.")

        if appointment.status != AppointmentStatus.CHECKED_IN:
            from rest_framework.exceptions import ValidationError
            raise ValidationError(
                {"status": f"Cannot start visit from status '{appointment.status}'. "
                           "Appointment must be in CHECKED_IN state."}
            )

        set_appointment_status(
            appointment,
            AppointmentStatus.IN_PROGRESS,
            changed_by=getattr(request.user, "full_name", ""),
            changed_by_role=getattr(request.user, "role", ""),
            note="Bác sĩ bắt đầu khám.",
        )
        return Response({"success": True, "status": "IN_PROGRESS"})


class DoctorVisitDraftAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, code, *args, **kwargs):
        doctor = _staff_doctor(request)
        return Response(save_visit_draft(code, request.data, doctor=doctor))


class DoctorVisitCompleteAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, code, *args, **kwargs):
        doctor = _staff_doctor(request)
        return Response(complete_visit(code, request.data, doctor=doctor))


class DoctorProfileAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        doctor = _staff_doctor(request)
        return Response(get_doctor_profile(doctor))

    def patch(self, request, *args, **kwargs):
        doctor = _staff_doctor(request)
        return Response(update_doctor_profile(doctor, request.data))


class DoctorChangePasswordAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        doctor = _staff_doctor(request)
        return Response(change_doctor_password(doctor, request.data))


# ── Reception ──────────────────────────────────────────────────────────────────

class ReceptionPatientsAPIView(APIView):
    permission_classes = [IsReceptionist]

    def get(self, request, *args, **kwargs):
        return Response(get_reception_patients_data())


class ReceptionDashboardAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        return Response(get_receptionist_dashboard_data())


class ReceptionProfileAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = _staff_receptionist(request)
        return Response(get_receptionist_profile(user))

    def patch(self, request, *args, **kwargs):
        user = _staff_receptionist(request)
        return Response(update_receptionist_profile(user, request.data))


class ReceptionChangePasswordAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        user = _staff_receptionist(request)
        return Response(change_receptionist_password(user, request.data))


# ── Admin ──────────────────────────────────────────────────────────────────────

class AdminAuditLogsAPIView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request, *args, **kwargs):
        return Response(get_audit_logs_data())


class AdminReportsAPIView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request, *args, **kwargs):
        return Response(get_reports_data(request.query_params.get('period', 'year')))


class AdminDashboardAPIView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request, *args, **kwargs):
        return Response(get_dashboard_data())


class AdminDoctorDetailAPIView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request, doctor_id, *args, **kwargs):
        return Response(get_admin_doctor_detail(doctor_id))


class AdminPatientProfilesAPIView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request, *args, **kwargs):
        return Response(get_admin_patient_profiles())


class AdminPatientProfileAPIView(APIView):
    permission_classes = [IsAdmin]

    def delete(self, request, profile_id, *args, **kwargs):
        delete_admin_patient_profile(profile_id)
        return Response(status=204)


class AdminPatientProfileResetPasswordAPIView(APIView):
    permission_classes = [IsAdmin]

    def post(self, request, profile_id, *args, **kwargs):
        new_password = request.data.get('new_password')
        reset_admin_patient_password(profile_id, new_password)
        return Response({'success': True})


class AdminReceptionistProfilesAPIView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request, *args, **kwargs):
        return Response(get_admin_receptionist_profiles())

    def post(self, request, *args, **kwargs):
        return Response(create_admin_receptionist_profile(request.data), status=201)


class AdminReceptionistProfileAPIView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request, profile_id, *args, **kwargs):
        return Response(get_admin_receptionist_profile(profile_id))

    def patch(self, request, profile_id, *args, **kwargs):
        return Response(update_admin_receptionist_profile(profile_id, request.data))

    def delete(self, request, profile_id, *args, **kwargs):
        delete_admin_receptionist_profile(profile_id)
        return Response(status=204)


class AdminReceptionistProfileResetPasswordAPIView(APIView):
    permission_classes = [IsAdmin]

    def post(self, request, profile_id, *args, **kwargs):
        new_password = request.data.get('new_password')
        reset_admin_receptionist_password(profile_id, new_password)
        return Response({'success': True})
