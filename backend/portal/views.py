from django.utils import timezone
from django.utils.dateparse import parse_date
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from .services import (
    change_password,
    claim_profile,
    complete_visit,
    delete_notification,
    _staff_request_user,
    change_receptionist_password,
    get_account_info,
    get_audit_logs_data,
    get_current_doctor,
    get_current_profile,
    get_doctor_schedule,
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
    login_patient_account,
    mark_all_notifications_read,
    mark_notification_read,
    register_patient_account,
    save_visit_draft,
    staff_login,
    update_receptionist_profile,
    update_account_info,
    update_health_profile,
)


class PatientLoginAPIView(APIView):
    def post(self, request, *args, **kwargs):
        return Response(login_patient_account(request.data, request))


class StaffLoginAPIView(APIView):
    def post(self, request, *args, **kwargs):
        return Response(staff_login(request.data, request))


class PatientRegisterAPIView(APIView):
    def post(self, request, *args, **kwargs):
        return Response(register_patient_account(request.data))


class CurrentPatientProfileAPIView(APIView):
    def get(self, request, *args, **kwargs):
        return Response(get_health_profile(get_current_profile(request)))

    def patch(self, request, *args, **kwargs):
        return Response(update_health_profile(get_current_profile(request), request.data))


class CurrentPatientAccountAPIView(APIView):
    def get(self, request, *args, **kwargs):
        return Response(get_account_info(get_current_profile(request)))

    def patch(self, request, *args, **kwargs):
        return Response(update_account_info(get_current_profile(request), request.data))


class PatientChangePasswordAPIView(APIView):
    def post(self, request, *args, **kwargs):
        return Response(change_password(get_current_profile(request), request.data))


class PatientAppointmentsAPIView(APIView):
    def get(self, request, *args, **kwargs):
        tab = request.query_params.get('tab', 'upcoming')
        return Response(get_patient_appointments(get_current_profile(request), tab))


class PatientRecordDetailAPIView(APIView):
    def get(self, request, record_code, *args, **kwargs):
        return Response(get_record_detail(get_current_profile(request), record_code))


class PatientClaimProfileAPIView(APIView):
    def post(self, request, *args, **kwargs):
        appointment_code = request.data.get('appointmentCode') or request.data.get('appointment_code')
        full_name = request.data.get('fullName') or request.data.get('full_name')
        if not appointment_code:
            raise ValidationError({'appointmentCode': 'appointmentCode is required.'})
        if not full_name:
            raise ValidationError({'fullName': 'fullName is required.'})
        return Response(claim_profile(appointment_code, full_name))


class PatientNotificationsAPIView(APIView):
    def get(self, request, *args, **kwargs):
        return Response(get_notifications(get_current_profile(request)))


class PatientNotificationsMarkAllReadAPIView(APIView):
    def post(self, request, *args, **kwargs):
        return Response(mark_all_notifications_read(get_current_profile(request)))


class PatientNotificationDetailAPIView(APIView):
    def patch(self, request, notification_id, *args, **kwargs):
        return Response(mark_notification_read(get_current_profile(request), notification_id))

    def delete(self, request, notification_id, *args, **kwargs):
        return Response(delete_notification(get_current_profile(request), notification_id))


class DoctorScheduleAPIView(APIView):
    def get(self, request, *args, **kwargs):
        raw_date = request.query_params.get('date') or ''
        appointment_date = parse_date(raw_date) or timezone.localdate()
        if raw_date and parse_date(raw_date) is None:
            raise ValidationError({'date': 'date must be in YYYY-MM-DD format.'})
        doctor = get_current_doctor()
        return Response(get_doctor_schedule(doctor=doctor, appointment_date=appointment_date))


class DoctorQueueAPIView(APIView):
    def get(self, request, *args, **kwargs):
        raw_date = request.query_params.get('date') or ''
        appointment_date = parse_date(raw_date) or timezone.localdate()
        if raw_date and parse_date(raw_date) is None:
            raise ValidationError({'date': 'date must be in YYYY-MM-DD format.'})
        doctor = get_current_doctor()
        return Response(get_visit_queue(doctor=doctor, appointment_date=appointment_date))


class DoctorVisitsAPIView(APIView):
    def get(self, request, *args, **kwargs):
        status = request.query_params.get('status', 'all')
        doctor = get_current_doctor()
        return Response(get_doctor_visits(doctor=doctor, status=status))


class DoctorVisitDetailAPIView(APIView):
    def get(self, request, code, *args, **kwargs):
        return Response(get_visit_detail(code, doctor=get_current_doctor()))


class DoctorVisitDraftAPIView(APIView):
    def patch(self, request, code, *args, **kwargs):
        return Response(save_visit_draft(code, request.data, doctor=get_current_doctor()))


class DoctorVisitCompleteAPIView(APIView):
    def post(self, request, code, *args, **kwargs):
        return Response(complete_visit(code, request.data, doctor=get_current_doctor()))


class ReceptionPatientsAPIView(APIView):
    def get(self, request, *args, **kwargs):
        return Response(get_reception_patients_data())


class ReceptionDashboardAPIView(APIView):
    def get(self, request, *args, **kwargs):
        _staff_request_user(request)
        return Response(get_receptionist_dashboard_data())


class ReceptionProfileAPIView(APIView):
    def get(self, request, *args, **kwargs):
        user = _staff_request_user(request)
        return Response(get_receptionist_profile(user))

    def patch(self, request, *args, **kwargs):
        user = _staff_request_user(request)
        return Response(update_receptionist_profile(user, request.data))


class ReceptionChangePasswordAPIView(APIView):
    def post(self, request, *args, **kwargs):
        user = _staff_request_user(request)
        return Response(change_receptionist_password(user, request.data))


class AdminAuditLogsAPIView(APIView):
    def get(self, request, *args, **kwargs):
        return Response(get_audit_logs_data())


class AdminReportsAPIView(APIView):
    def get(self, request, *args, **kwargs):
        return Response(get_reports_data(request.query_params.get('period', 'year')))
