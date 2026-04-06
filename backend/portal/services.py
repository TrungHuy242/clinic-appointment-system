import re
from datetime import date, timedelta

from django.db import transaction
from django.db.models import Count, Q
from django.utils import timezone
from django.utils.dateparse import parse_date
from rest_framework.exceptions import ValidationError

from common.auth import SESSION_USER_KEY

from appointments.models import Appointment, AppointmentStatus
from appointments.services import get_active_appointments_queryset, set_appointment_status
from catalog.models import Doctor, Specialty

from .models import AdminAuditLog, MedicalRecord, PatientNotification, PatientProfile, User, UserRole


BRANCH_NAME = 'Cơ sở Hải Châu'
DEFAULT_LOCATION = 'Cơ sở Hải Châu - P.204'
WEEKDAY_LABELS = {
    0: 'Thứ Hai',
    1: 'Thứ Ba',
    2: 'Thứ Tư',
    3: 'Thứ Năm',
    4: 'Thứ Sáu',
    5: 'Thứ Bảy',
    6: 'Chủ Nhật',
}
PATIENT_STATUS_MAP = {
    AppointmentStatus.PENDING: ('pending', 'Chờ xác nhận'),
    AppointmentStatus.CONFIRMED: ('confirmed', 'Đã xác nhận'),
    AppointmentStatus.CHECKED_IN: ('confirmed', 'Đã check-in'),
    AppointmentStatus.IN_PROGRESS: ('confirmed', 'Đang khám'),
    AppointmentStatus.COMPLETED: ('completed', 'Đã hoàn tất'),
    AppointmentStatus.CANCELLED: ('cancelled', 'Đã hủy'),
    AppointmentStatus.NO_SHOW: ('cancelled', 'Không đến khám'),
}
SCHEDULE_STATUS_MAP = {
    AppointmentStatus.PENDING: 'waiting',
    AppointmentStatus.CONFIRMED: 'waiting',
    AppointmentStatus.CHECKED_IN: 'checked_in',
    AppointmentStatus.WAITING: 'waiting',
    AppointmentStatus.IN_PROGRESS: 'in_progress',
    AppointmentStatus.COMPLETED: 'done',
}
QUEUE_STATUS_MAP = {
    AppointmentStatus.PENDING: 'waiting',
    AppointmentStatus.CONFIRMED: 'waiting',
    AppointmentStatus.CHECKED_IN: 'waiting',
    AppointmentStatus.WAITING: 'waiting',
    AppointmentStatus.IN_PROGRESS: 'in_progress',
    AppointmentStatus.COMPLETED: 'done',
}
GENDER_LABELS = {
    PatientProfile.Gender.MALE: 'Nam',
    PatientProfile.Gender.FEMALE: 'Nữ',
    PatientProfile.Gender.OTHER: 'Khác',
    '': 'Khác',
}
PHONE_PATTERN = re.compile(r'^0\d{9}$')


def log_admin_action(action, resource_type, resource_id='', resource_label='',
                     actor_name='', actor_role='', detail='', ip_address=None):
    """Persist an admin audit log entry. Safe to call even if the caller fails."""
    from .models import AdminAuditLog
    try:
        AdminAuditLog.objects.create(
            action=action,
            resource_type=resource_type,
            resource_id=str(resource_id),
            resource_label=resource_label,
            actor_name=actor_name,
            actor_role=actor_role,
            detail=detail,
            ip_address=ip_address,
        )
    except Exception:
        pass


def normalize_text(value):
    return ' '.join((value or '').strip().lower().split())


def format_day_name(date_value):
    return WEEKDAY_LABELS[date_value.weekday()]


def format_time(dt_value):
    return timezone.localtime(dt_value).strftime('%H:%M')


def format_date_display(date_value):
    return date_value.strftime('%d/%m/%Y') if date_value else ''


def format_datetime_display(dt_value):
    return timezone.localtime(dt_value).strftime('%d/%m/%Y %H:%M')


def build_patient_code(profile_id):
    return f'BN-{profile_id:04d}'


def parse_optional_date(raw_value, field_name='date'):
    if not raw_value:
        return None

    parsed = parse_date(str(raw_value))
    if parsed is None:
        raise ValidationError({field_name: f'{field_name} must be in YYYY-MM-DD format.'})
    return parsed


def validate_phone(phone):
    normalized = str(phone or '').strip()
    if not PHONE_PATTERN.match(normalized):
        raise ValidationError({'phone': 'Số điện thoại phải gồm 10 số và bắt đầu bằng 0.'})
    return normalized


def get_current_profile(request=None):
    """Get the current patient profile from session or database fallback."""
    from django.contrib.sessions.backends.db import SessionStore

    # Try to get from session first
    if request and hasattr(request, 'session') and request.session.session_key:
        profile_id = request.session.get('patient_profile_id')
        if profile_id:
            profile = PatientProfile.objects.filter(pk=profile_id).first()
            if profile:
                return profile

    # Fallback to is_current flag (legacy behavior)
    profile = PatientProfile.objects.filter(is_current=True).first()
    if profile:
        return profile

    # Last resort: get first profile
    profile = PatientProfile.objects.order_by('id').first()
    if not profile:
        raise ValidationError('No patient profile available.')

    profile.is_current = True
    profile.save(update_fields=['is_current', 'updated_at'])
    return profile


@transaction.atomic
def set_current_profile(profile, request=None):
    """Set the current patient profile in session and database."""
    PatientProfile.objects.filter(is_current=True).exclude(pk=profile.pk).update(is_current=False)
    if not profile.is_current:
        profile.is_current = True
        profile.save(update_fields=['is_current', 'updated_at'])

    # Save to session if request is provided
    if request and hasattr(request, 'session'):
        request.session['patient_profile_id'] = profile.id
        request.session.modified = True

    return profile

@transaction.atomic
def unified_login(payload, request=None):
    from django.contrib.auth.hashers import check_password as django_check_password
 
    identifier = str(
        payload.get('identifier')
        or payload.get('phone')
        or payload.get('username')
        or ''
    ).strip()
    password = str(payload.get('password') or '').strip()
 
    if not identifier:
        raise ValidationError({'identifier': 'Vui lòng nhập số điện thoại hoặc tên đăng nhập.'})
    if not password:
        raise ValidationError({'password': 'Vui lòng nhập mật khẩu.'})
 
    # bệnh nhân (PatientProfile – plain-text password) ─────────────
    patient = PatientProfile.objects.filter(
        Q(phone=identifier)
        | Q(account_username__iexact=identifier)
        | Q(account_email__iexact=identifier)
    ).first()
 
    if patient and patient.account_password == password:
        set_current_profile(patient, request)
        return {
            'success': True,
            'role': 'patient',
            'account': get_account_info(patient),
        }
 
    # nhân viên (portal_user – hashed password) ────────────────────
    staff = User.objects.filter(username=identifier, is_active=True).first()
 
    # Fallback: thử case-insensitive nếu exact không có kết quả
    if not staff:
        staff = User.objects.filter(username__iexact=identifier, is_active=True).first()
 
    if staff and django_check_password(password, staff.password):
        # doctor_id trong portal_user đang NULL → tự tra catalog_doctor theo full_name
        doctor_id = staff.doctor_id
        if doctor_id is None and staff.role == 'doctor':
            matched_doctor = Doctor.objects.filter(
                full_name=staff.full_name, is_active=True
            ).first()
            if matched_doctor:
                doctor_id = matched_doctor.id
                # Cập nhật luôn vào DB để lần sau khỏi tra lại
                User.objects.filter(pk=staff.pk).update(doctor_id=doctor_id)

        user_payload = {
            'id': staff.id,
            'username': staff.username,
            'full_name': staff.full_name,
            'role': staff.role,
            'doctor_id': doctor_id,
            'is_active': staff.is_active,
        }

        # Store in session so SessionUserAuthentication can read it on subsequent requests
        if request and hasattr(request, 'session'):
            request.session[SESSION_USER_KEY] = user_payload
            request.session.modified = True

        return {
            'success': True,
            'role': staff.role,   # 'admin' | 'receptionist' | 'doctor'
            'user': {
                'id': staff.id,
                'username': staff.username,
                'fullName': staff.full_name,
                'email': staff.email,
                'role': staff.role,
                'doctorId': doctor_id,
            },
        }
 
    # Sai thông tin ────────────────────────────────────────────────────
    raise ValidationError({'non_field_errors': 'Thông tin đăng nhập không hợp lệ.'})
@transaction.atomic
def register_patient_account(payload):
    full_name = str(payload.get('name') or payload.get('fullName') or '').strip()
    phone = validate_phone(payload.get('phone'))
    password = str(payload.get('password') or '').strip()
    confirm_password = str(payload.get('confirmPassword') or '').strip()
    email = str(payload.get('email') or '').strip()
    dob = parse_optional_date(payload.get('dob'), 'dob')
    gender = str(payload.get('gender') or '').strip()

    if not full_name:
        raise ValidationError({'name': 'name is required.'})
    if len(password) < 6:
        raise ValidationError({'password': 'Mật khẩu phải từ 6 ký tự trở lên.'})
    if confirm_password and confirm_password != password:
        raise ValidationError({'confirmPassword': 'Mật khẩu xác nhận không khớp.'})

    profile = PatientProfile.objects.filter(phone=phone).first()
    if profile is None:
        profile = PatientProfile.objects.create(
            full_name=full_name,
            phone=phone,
            dob=dob,
            gender=gender,
            account_username=phone,
            account_email=email,
            account_password=password,
            is_current=False,
        )
    else:
        profile.full_name = full_name
        profile.dob = dob
        profile.gender = gender
        profile.account_email = email or profile.account_email
        profile.account_password = password
        if not profile.account_username:
            profile.account_username = phone
        profile.save()

    set_current_profile(profile)
    return {
        'success': True,
        'account': get_account_info(profile),
    }


def get_profile_by_appointment(code, full_name):
    appointment = get_active_appointments_queryset().filter(code=str(code).strip().upper()).first()
    if not appointment:
        raise ValidationError('CLAIM_NOT_FOUND')

    if normalize_text(appointment.patient_full_name) != normalize_text(full_name):
        raise ValidationError('CLAIM_NAME_MISMATCH')

    profile = PatientProfile.objects.filter(phone=appointment.patient_phone).first()
    if not profile:
        profile = PatientProfile.objects.create(
            full_name=appointment.patient_full_name,
            phone=appointment.patient_phone,
            account_username=appointment.patient_phone,
            account_email='',
            is_current=False,
        )

    return profile, appointment


@transaction.atomic
def claim_profile(code, full_name):
    profile, appointment = get_profile_by_appointment(code, full_name)
    already_claimed = profile.is_current
    set_current_profile(profile)
    linked_appointments = get_profile_appointments_queryset(profile).count()
    linked_records = MedicalRecord.objects.filter(patient_profile=profile).count()
    return {
        'patientName': profile.full_name,
        'appointmentCode': appointment.code,
        'linkedAppointments': linked_appointments,
        'linkedRecords': linked_records,
        'alreadyClaimed': already_claimed,
    }

def get_profile_appointments_queryset(profile):
    return get_active_appointments_queryset().filter(patient_phone=profile.phone)


def map_patient_appointment(appointment):
    status, status_label = PATIENT_STATUS_MAP.get(
        appointment.status,
        ('pending', appointment.status.title()),
    )
    start = timezone.localtime(appointment.scheduled_start)
    end = timezone.localtime(appointment.scheduled_end)
    record = getattr(appointment, 'medical_record', None)
    return {
        'id': appointment.code,
        'recordId': record.code if record else None,
        'code': appointment.code,
        'date': start.date().isoformat(),
        'day': format_day_name(start.date()),
        'timeStart': start.strftime('%H:%M'),
        'timeEnd': end.strftime('%H:%M'),
        'service': appointment.specialty.name,
        'doctor': {
            'name': appointment.doctor.full_name,
            'avatar': '',
        },
        'location': record.location if record else DEFAULT_LOCATION,
        'status': status,
        'statusLabel': status_label,
    }


def get_patient_appointments(profile, tab):
    today = timezone.localdate()
    queryset = get_profile_appointments_queryset(profile).select_related('doctor', 'specialty', 'medical_record')

    if tab == 'history':
        queryset = queryset.filter(status=AppointmentStatus.COMPLETED)
    elif tab == 'cancelled':
        queryset = queryset.filter(status__in=[AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW])
    else:
        queryset = queryset.filter(scheduled_start__date__gte=today).exclude(
            status__in=[AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW]
        )

    return [map_patient_appointment(item) for item in queryset.order_by('-scheduled_start')]


def get_health_profile(profile):
    return {
        'name': profile.full_name,
        'phone': profile.phone,
        'dob': profile.dob.isoformat() if profile.dob else '',
        'gender': profile.gender,
        'allergies': profile.allergies,
        'notes': profile.notes,
        'emergency': {
            'name': profile.emergency_name,
            'phone': profile.emergency_phone,
        },
    }


@transaction.atomic
def update_health_profile(profile, payload):
    emergency = payload.get('emergency') or {}
    next_phone = validate_phone(payload.get('phone') or profile.phone)
    if next_phone != profile.phone and PatientProfile.objects.filter(phone=next_phone).exclude(pk=profile.pk).exists():
        raise ValidationError({'phone': 'Số điện thoại đã tồn tại.'})

    dob = parse_optional_date(payload.get('dob'), 'dob')
    profile.full_name = str(payload.get('name') or profile.full_name).strip() or profile.full_name
    profile.phone = next_phone
    profile.dob = dob
    profile.gender = str(payload.get('gender') or profile.gender).strip()
    profile.allergies = str(payload.get('allergies') or '').strip()
    profile.notes = str(payload.get('notes') or '').strip()
    profile.emergency_name = str(emergency.get('name') or '').strip()
    profile.emergency_phone = str(emergency.get('phone') or '').strip()
    profile.save()
    return get_health_profile(profile)


def get_account_info(profile):
    return {
        'username': profile.account_username,
        'email': profile.account_email,
        'name': profile.full_name,
    }


@transaction.atomic
def update_account_info(profile, payload):
    profile.full_name = str(payload.get('name') or profile.full_name).strip() or profile.full_name
    profile.account_email = str(payload.get('email') or '').strip()
    profile.save(update_fields=['full_name', 'account_email', 'updated_at'])
    return get_account_info(profile)


@transaction.atomic
def change_password(profile, payload):
    current_password = str(payload.get('currentPassword') or '').strip()
    new_password = str(payload.get('newPassword') or '').strip()
    confirm_password = str(payload.get('confirmPassword') or '').strip()

    if current_password != profile.account_password:
        raise ValidationError({'currentPassword': 'Mật khẩu hiện tại không đúng.'})
    if len(new_password) < 6:
        raise ValidationError({'newPassword': 'Mật khẩu mới phải từ 6 ký tự trở lên.'})
    if new_password != confirm_password:
        raise ValidationError({'confirmPassword': 'Mật khẩu xác nhận không khớp.'})

    profile.account_password = new_password
    profile.save(update_fields=['account_password', 'updated_at'])
    return {'success': True}


def get_notifications(profile):
    return [
        {
            'id': item.id,
            'message': item.message,
            'date': timezone.localtime(item.created_at).date().isoformat(),
            'read': item.is_read,
        }
        for item in profile.notifications.filter(is_deleted=False)
    ]


@transaction.atomic
def mark_notification_read(profile, notification_id):
    notification = profile.notifications.get(pk=notification_id, is_deleted=False)
    notification.is_read = True
    notification.save(update_fields=['is_read', 'updated_at'])
    return {
        'id': notification.id,
        'read': notification.is_read,
    }


@transaction.atomic
def mark_all_notifications_read(profile):
    profile.notifications.filter(is_deleted=False, is_read=False).update(
        is_read=True,
        updated_at=timezone.now(),
    )
    return {'success': True}


@transaction.atomic
def delete_notification(profile, notification_id):
    notification = profile.notifications.get(pk=notification_id, is_deleted=False)
    notification.is_deleted = True
    notification.save(update_fields=['is_deleted', 'updated_at'])
    return {'success': True}

def build_default_timeline(record):
    appointment = record.appointment
    timeline = [
        {
            'status': 'scheduled',
            'label': 'Chờ xác nhận',
            'icon': 'schedule',
            'dateTime': format_datetime_display(appointment.created_at),
            'isCompleted': True,
        }
    ]

    if appointment.status in {
        AppointmentStatus.CONFIRMED,
        AppointmentStatus.CHECKED_IN,
        AppointmentStatus.IN_PROGRESS,
        AppointmentStatus.COMPLETED,
    }:
        timeline.append(
            {
                'status': 'confirmed',
                'label': 'Đã xác nhận',
                'icon': 'check_circle',
                'dateTime': format_datetime_display(appointment.updated_at),
                'isCompleted': True,
            }
        )

    if appointment.status in {
        AppointmentStatus.CHECKED_IN,
        AppointmentStatus.IN_PROGRESS,
        AppointmentStatus.COMPLETED,
    }:
        timeline.append(
            {
                'status': 'checkin',
                'label': 'Đã check-in',
                'icon': 'where_to_vote',
                'dateTime': format_datetime_display(appointment.updated_at - timedelta(minutes=5)),
                'isCompleted': True,
            }
        )

    if appointment.status == AppointmentStatus.COMPLETED:
        timeline.append(
            {
                'status': 'completed',
                'label': 'Hoàn thành',
                'icon': 'assignment_turned_in',
                'dateTime': format_datetime_display(appointment.updated_at),
                'isCompleted': True,
            }
        )

    return timeline


def get_record_detail(profile, record_code):
    record = MedicalRecord.objects.select_related(
        'appointment',
        'doctor',
        'doctor__specialty',
        'patient_profile',
    ).filter(code=record_code, patient_profile=profile).first()

    if not record:
        raise ValidationError('Record not found.')

    appointment = record.appointment
    history_queryset = MedicalRecord.objects.select_related(
        'appointment',
        'doctor',
    ).filter(
        patient_profile=profile,
        appointment__status=AppointmentStatus.COMPLETED,
    ).exclude(pk=record.pk)[:5]

    timeline = record.timeline or build_default_timeline(record)
    return {
        'id': record.code,
        'appointmentCode': appointment.code,
        'status': 'completed' if appointment.status == AppointmentStatus.COMPLETED else 'confirmed',
        'statusLabel': 'Đã hoàn tất' if appointment.status == AppointmentStatus.COMPLETED else 'Đã xác nhận',
        'examDate': timezone.localtime(appointment.scheduled_start).date().isoformat(),
        'examTime': format_time(appointment.scheduled_start),
        'location': record.location,
        'doctor': {
            'name': record.doctor.full_name,
            'department': f'Khoa {record.doctor.specialty.name}',
            'branch': BRANCH_NAME,
            'avatar': '',
        },
        'timeline': timeline,
        'diagnosis': {
            'name': record.diagnosis_name or 'Chưa cập nhật',
            'icdCode': record.diagnosis_icd_code or 'N/A',
        },
        'clinicalNotes': record.clinical_notes or 'Chưa có ghi chú lâm sàng.',
        'medicines': record.medicines,
        'history': [
            {
                'date': timezone.localtime(item.appointment.scheduled_start).date().isoformat(),
                'diagnosis': item.diagnosis_name or 'Chưa cập nhật',
                'doctor': item.doctor.full_name,
            }
            for item in history_queryset
        ],
    }


def get_current_doctor():
    doctor = Doctor.objects.filter(full_name='BS. Trần Ngọc Emily', is_active=True).first()
    if doctor:
        return doctor

    doctor = Doctor.objects.filter(is_active=True).order_by('full_name').first()
    if not doctor:
        raise ValidationError('No active doctor available.')
    return doctor


def get_doctor_schedule_queryset(doctor=None, appointment_date=None):
    doctor = doctor or get_current_doctor()
    appointment_date = appointment_date or timezone.localdate()
    return get_active_appointments_queryset().filter(
        doctor=doctor,
        scheduled_start__date=appointment_date,
    ).exclude(status__in=[AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW])


def get_doctor_schedule(doctor=None, appointment_date=None):
    doctor = doctor or get_current_doctor()
    appointment_date = appointment_date or timezone.localdate()
    appointments = get_doctor_schedule_queryset(doctor=doctor, appointment_date=appointment_date).order_by('scheduled_start')
    items = []
    for appointment in appointments:
        items.append(
            {
                'time': format_time(appointment.scheduled_start),
                'patientName': appointment.patient_full_name,
                'phone': appointment.patient_phone,
                'service': f'{appointment.specialty.name} - Khám',
                'status': SCHEDULE_STATUS_MAP.get(appointment.status, 'waiting'),
                'code': appointment.code,
            }
        )

    return {
        'doctorName': doctor.full_name,
        'specialtyName': doctor.specialty.name,
        'date': appointment_date.isoformat(),
        'items': items,
    }


def get_visit_queue(doctor=None, appointment_date=None):
    doctor = doctor or get_current_doctor()
    appointments = get_doctor_schedule_queryset(doctor=doctor, appointment_date=appointment_date).order_by('scheduled_start')
    return [
        {
            'code': appointment.code,
            'patientName': appointment.patient_full_name,
            'slot': format_time(appointment.scheduled_start),
            'status': QUEUE_STATUS_MAP.get(appointment.status, 'waiting'),
        }
        for appointment in appointments
    ]


def get_doctor_visits(doctor=None, status='all'):
    from appointments.models import AppointmentStatus, Appointment
    doctor = doctor or get_current_doctor()
    queryset = Appointment.objects.select_related('specialty', 'doctor', 'medical_record').filter(
        doctor=doctor,
    )
    if status == 'completed':
        queryset = queryset.filter(status=AppointmentStatus.COMPLETED)
    elif status == 'draft':
        queryset = queryset.filter(
            status__in=[AppointmentStatus.IN_PROGRESS, AppointmentStatus.WAITING],
            medical_record__isnull=False,
        ).exclude(medical_record__draft={})
    else:
        queryset = queryset.exclude(status=AppointmentStatus.CANCELLED)
    
    queryset = queryset.order_by('-scheduled_start')[:50]
    return [
        {
            'id': appointment.id,
            'code': appointment.code,
            'patientName': appointment.patient_full_name,
            'date': timezone.localtime(appointment.scheduled_start).strftime('%d/%m/%Y'),
            'status': appointment.status,
            'diagnosis': appointment.medical_record.diagnosis_name if appointment.medical_record else None,
        }
        for appointment in queryset
    ]


def get_or_create_record_for_appointment(appointment):
    record = getattr(appointment, 'medical_record', None)
    if record:
        return record

    profile = PatientProfile.objects.filter(phone=appointment.patient_phone).first()
    if not profile:
        profile = PatientProfile.objects.create(
            full_name=appointment.patient_full_name,
            phone=appointment.patient_phone,
            account_username=appointment.patient_phone,
        )

    return MedicalRecord.objects.create(
        code=f'REC-{appointment.code}',
        appointment=appointment,
        patient_profile=profile,
        doctor=appointment.doctor,
        location=DEFAULT_LOCATION,
        chief_complaint='',
        medicines=[],
        timeline=[],
        draft={},
    )


def get_visit_detail(code, doctor=None):
    doctor = doctor or get_current_doctor()
    appointment = get_doctor_schedule_queryset(doctor=doctor).filter(code=str(code).strip().upper()).first()
    if not appointment:
        raise ValidationError('Visit not found.')

    record = get_or_create_record_for_appointment(appointment)
    profile = record.patient_profile
    history_queryset = MedicalRecord.objects.select_related('appointment', 'doctor').filter(
        patient_profile=profile,
        appointment__status=AppointmentStatus.COMPLETED,
    ).exclude(appointment=appointment)[:5]

    return {
        'code': appointment.code,
        'patientName': appointment.patient_full_name,
        'dob': profile.dob.isoformat() if profile.dob else 'N/A',
        'gender': GENDER_LABELS.get(profile.gender, 'Khác'),
        'phone': profile.phone,
        'specialty': appointment.specialty.name,
        'slot': f'{format_time(appointment.scheduled_start)} - {format_time(appointment.scheduled_end)}',
        'chiefComplaint': record.chief_complaint,
        'history': [
            {
                'date': timezone.localtime(item.appointment.scheduled_start).date().isoformat(),
                'diagnosis': item.diagnosis_name or 'Chưa cập nhật',
                'doctor': item.doctor.full_name,
            }
            for item in history_queryset
        ],
        'draft': record.draft or None,
    }


@transaction.atomic
def save_visit_draft(code, payload, doctor=None):
    doctor = doctor or get_current_doctor()
    appointment = get_doctor_schedule_queryset(doctor=doctor).filter(code=str(code).strip().upper()).first()
    if not appointment:
        raise ValidationError('Visit not found.')

    record = get_or_create_record_for_appointment(appointment)
    record.draft = {
        'diagnosis': payload.get('diagnosis', ''),
        'notes': payload.get('notes', ''),
        'prescription': payload.get('prescription', []),
    }
    record.save(update_fields=['draft', 'updated_at'])

    if appointment.status in {AppointmentStatus.CONFIRMED, AppointmentStatus.CHECKED_IN, AppointmentStatus.PENDING}:
        set_appointment_status(appointment, AppointmentStatus.IN_PROGRESS)

    return {'ok': True}


@transaction.atomic
def complete_visit(code, payload, doctor=None):
    doctor = doctor or get_current_doctor()
    appointment = get_doctor_schedule_queryset(doctor=doctor).filter(code=str(code).strip().upper()).first()
    if not appointment:
        raise ValidationError('Visit not found.')

    record = get_or_create_record_for_appointment(appointment)
    record.diagnosis_name = str(payload.get('diagnosis') or '').strip() or 'Chưa cập nhật'
    record.diagnosis_icd_code = str(payload.get('diagnosisIcdCode') or '').strip()
    record.clinical_notes = str(payload.get('notes') or '').strip()
    record.medicines = [
        {
            'id': index + 1,
            'name': item.get('drug', ''),
            'dosage': f"{item.get('dose', '')} {item.get('unit', '')}".strip(),
            'duration': f"{item.get('days', '')} ngày".strip(),
            'usage': ' · '.join(filter(None, [item.get('freq', ''), item.get('note', '')])),
        }
        for index, item in enumerate(payload.get('prescription', []))
        if item.get('drug')
    ]
    record.draft = {
        'diagnosis': payload.get('diagnosis', ''),
        'notes': payload.get('notes', ''),
        'prescription': payload.get('prescription', []),
    }
    set_appointment_status(appointment, AppointmentStatus.COMPLETED)
    record.timeline = build_default_timeline(record)
    record.save(
        update_fields=[
            'diagnosis_name',
            'diagnosis_icd_code',
            'clinical_notes',
            'medicines',
            'draft',
            'timeline',
            'updated_at',
        ]
    )

    PatientNotification.objects.create(
        profile=record.patient_profile,
        message=f'Hồ sơ khám {appointment.code} đã được bác sĩ cập nhật.',
        is_read=False,
    )

    return {'ok': True, 'code': appointment.code}

def get_reception_patients_data():
    profiles = list(PatientProfile.objects.order_by('full_name'))
    items = []
    current_month_start = timezone.localdate().replace(day=1)
    new_patients = 0
    total_visits = 0

    for profile in profiles:
        if timezone.localtime(profile.created_at).date() >= current_month_start:
            new_patients += 1

        appointments = list(
            get_active_appointments_queryset()
            .filter(patient_phone=profile.phone)
            .order_by('-scheduled_start')
        )
        last_visit_date = timezone.localtime(appointments[0].scheduled_start).date() if appointments else None
        completed_count = sum(1 for item in appointments if item.status == AppointmentStatus.COMPLETED)
        total_visits += completed_count
        is_active = any(
            timezone.localtime(item.scheduled_start).date() >= timezone.localdate()
            or item.status in {AppointmentStatus.CONFIRMED, AppointmentStatus.CHECKED_IN, AppointmentStatus.IN_PROGRESS}
            for item in appointments
        )

        items.append(
            {
                'id': profile.id,
                'code': build_patient_code(profile.id),
                'name': profile.full_name,
                'phone': profile.phone,
                'dob': format_date_display(profile.dob),
                'gender': GENDER_LABELS.get(profile.gender, 'Khác'),
                'lastVisit': format_date_display(last_visit_date),
                'totalVisits': completed_count,
                'status': 'active' if is_active else 'inactive',
            }
        )

    stats = {
        'totalPatients': len(items),
        'activePatients': sum(1 for item in items if item['status'] == 'active'),
        'newPatients': new_patients,
        'totalVisits': total_visits,
    }
    return {
        'items': items,
        'stats': stats,
    }


def _build_log_item(log_id, when, actor, role, action, resource, detail, ip='127.0.0.1'):
    return {
        'id': log_id,
        'actor': actor,
        'role': role,
        'action': action,
        'resource': resource,
        'time': format_datetime_display(when),
        'ip': ip,
        'detail': detail,
        '_sort': when,
    }


def get_audit_logs_data():
    """Read real audit logs from AdminAuditLog table.
    NOTE: Logs are written from v2.1 onwards. Historical data before this
    migration is captured via _seed_historical_logs() which runs once.
    """
    from .models import AdminAuditLog

    _seed_historical_logs()

    queryset = AdminAuditLog.objects.all().order_by('-created_at')
    items = [
        {
            'id': log.id,
            'time': format_datetime_display(log.created_at),
            'actor': log.actor_name,
            'role': log.actor_role,
            'action': log.action,
            'resource': f'{log.resource_type}:{log.resource_label}',
            'detail': log.detail,
            'ip': log.ip_address or '',
        }
        for log in queryset
    ]

    stats = {
        'total': len(items),
        'create': sum(1 for item in items if item['action'] == 'CREATE'),
        'update': sum(1 for item in items if item['action'] in {'UPDATE', 'RESCHEDULE', 'STATUS_CHANGE'}),
        'delete': sum(1 for item in items if item['action'] in {'DELETE', 'RESET_PASSWORD', 'CREATE_ACCOUNT'}),
    }
    return {
        'items': items,
        'stats': stats,
    }


def _seed_historical_logs():
    """One-time backfill: create AdminAuditLog entries from existing database records.
    Idempotent — skips if AdminAuditLog already has records.
    """
    from .models import AdminAuditLog
    from catalog.models import Doctor, Specialty

    if AdminAuditLog.objects.exists():
        return

    logs_to_create = []

    for specialty in Specialty.objects.all():
        logs_to_create.append(AdminAuditLog(
            action='CREATE', resource_type='Specialty', resource_id=str(specialty.id),
            resource_label=specialty.name, actor_name='System', actor_role='admin',
            detail=f'Tạo chuyên khoa "{specialty.name}" (historical)',
        ))

    for doctor in Doctor.objects.select_related('specialty').all():
        logs_to_create.append(AdminAuditLog(
            action='CREATE', resource_type='Doctor', resource_id=str(doctor.id),
            resource_label=f'{doctor.full_name} ({doctor.specialty.name})',
            actor_name='System', actor_role='admin',
            detail=f'Tạo hồ sơ bác sĩ "{doctor.full_name}" - {doctor.specialty.name} (historical)',
        ))

    if logs_to_create:
        AdminAuditLog.objects.bulk_create(logs_to_create, ignore_conflicts=True)


def _month_labels():
    return [f'T{index}' for index in range(1, 13)]


def _build_report_series(period):
    today = timezone.localdate()
    appointments = list(
        Appointment.all_objects.filter(is_deleted=False)
        .select_related('specialty')
        .order_by('scheduled_start')
    )

    if period == 'week':
        start_date = today - timedelta(days=6)
        labels = [(start_date + timedelta(days=offset)).strftime('%d/%m') for offset in range(7)]
        appointment_series = [0] * 7
        revenue_series = [0] * 7
        for item in appointments:
            current_date = timezone.localtime(item.scheduled_start).date()
            if start_date <= current_date <= today:
                index = (current_date - start_date).days
                appointment_series[index] += 1
                if item.status == AppointmentStatus.COMPLETED:
                    revenue_series[index] += 2
        return start_date, today, labels, appointment_series, revenue_series

    if period == 'month':
        start_date = today - timedelta(days=27)
        labels = [f'Tuần {index}' for index in range(1, 5)]
        appointment_series = [0] * 4
        revenue_series = [0] * 4
        for item in appointments:
            current_date = timezone.localtime(item.scheduled_start).date()
            if start_date <= current_date <= today:
                index = min((current_date - start_date).days // 7, 3)
                appointment_series[index] += 1
                if item.status == AppointmentStatus.COMPLETED:
                    revenue_series[index] += 6
        return start_date, today, labels, appointment_series, revenue_series

    if period == 'quarter':
        current_month = today.month
        months = [max(1, current_month - 2), max(1, current_month - 1), current_month]
        labels = [f'T{month}' for month in months]
        appointment_series = [0] * 3
        revenue_series = [0] * 3
        month_to_index = {month: index for index, month in enumerate(months)}
        start_date = date(today.year, months[0], 1)
        for item in appointments:
            current_date = timezone.localtime(item.scheduled_start).date()
            if current_date.year == today.year and current_date.month in month_to_index:
                index = month_to_index[current_date.month]
                appointment_series[index] += 1
                if item.status == AppointmentStatus.COMPLETED:
                    revenue_series[index] += 12
        return start_date, today, labels, appointment_series, revenue_series

    start_date = date(today.year, 1, 1)
    labels = _month_labels()
    appointment_series = [0] * 12
    revenue_series = [0] * 12
    for item in appointments:
        current_date = timezone.localtime(item.scheduled_start).date()
        if current_date.year == today.year:
            index = current_date.month - 1
            appointment_series[index] += 1
            if item.status == AppointmentStatus.COMPLETED:
                revenue_series[index] += 18
    return start_date, today, labels, appointment_series, revenue_series


def get_reports_data(period='year'):
    period = period if period in {'week', 'month', 'quarter', 'year'} else 'year'
    start_date, end_date, labels, appointment_series, revenue_series = _build_report_series(period)

    queryset = Appointment.all_objects.filter(
        is_deleted=False,
        scheduled_start__date__gte=start_date,
        scheduled_start__date__lte=end_date,
    ).select_related('specialty')

    total_appointments = queryset.count()
    completed_count = queryset.filter(status=AppointmentStatus.COMPLETED).count()
    cancelled_count = queryset.filter(status__in=[AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW]).count()
    new_patients = PatientProfile.objects.filter(created_at__date__gte=start_date, created_at__date__lte=end_date).count()
    total_revenue = sum(revenue_series)
    completion_rate = round((completed_count / total_appointments) * 100, 1) if total_appointments else 0

    specialty_counts = list(
        queryset.values('specialty__name').annotate(count=Count('id')).order_by('-count', 'specialty__name')
    )
    specialty_total = sum(item['count'] for item in specialty_counts) or 1
    specialty_stats = [
        {
            'name': item['specialty__name'],
            'count': item['count'],
            'pct': round((item['count'] / specialty_total) * 100),
        }
        for item in specialty_counts[:6]
    ]

    summary_rows = [
        {'label': 'Tổng lịch hẹn', 'value': str(total_appointments)},
        {'label': 'Bệnh nhân mới', 'value': str(new_patients)},
        {'label': 'Đã hoàn tất', 'value': f'{completed_count} ({completion_rate}%)'},
        {'label': 'Đã hủy / No-show', 'value': str(cancelled_count)},
        {'label': 'Doanh thu thực tế', 'value': f'{total_revenue} triệu đồng'},
        {
            'label': 'Lịch hẹn trung bình',
            'value': f'{round(total_appointments / max(len(labels), 1), 1)} / kỳ',
        },
    ]

    return {
        'period': period,
        'labels': labels,
        'appointmentSeries': appointment_series,
        'revenueSeries': revenue_series,
        'kpis': {
            'appointments': f'{total_appointments}',
            'revenue': f'{total_revenue}',
            'newPatients': f'{new_patients}',
            'completionRate': f'{completion_rate:.1f}%'.replace('.0%', '%'),
        },
        'specialtyStats': specialty_stats,
        'summaryRows': summary_rows,
    }


# ── Admin Dashboard ────────────────────────────────────────────────────────────

def get_dashboard_data():
    """Return dashboard data for admin overview."""
    today = timezone.localdate()
    now = timezone.localtime()

    today_qs = Appointment.objects.filter(
        is_deleted=False,
        scheduled_start__date=today,
    ).select_related('doctor', 'specialty')

    pending = today_qs.filter(status=AppointmentStatus.PENDING).count()
    confirmed = today_qs.filter(status=AppointmentStatus.CONFIRMED).count()
    checked_in = today_qs.filter(status=AppointmentStatus.CHECKED_IN).count()
    in_progress = today_qs.filter(status=AppointmentStatus.IN_PROGRESS).count()
    completed = today_qs.filter(status=AppointmentStatus.COMPLETED).count()

    stat_cards = [
        {'key': 'total_today', 'label': 'Tổng lịch hẹn hôm nay', 'value': today_qs.count()},
        {'key': 'pending',      'label': 'Chờ xác nhận',          'value': pending},
        {'key': 'confirmed',    'label': 'Đã xác nhận',           'value': confirmed},
        {'key': 'checked_in',  'label': 'Đã check-in',            'value': checked_in},
        {'key': 'in_progress', 'label': 'Đang khám',             'value': in_progress},
        {'key': 'completed',   'label': 'Đã hoàn thành',         'value': completed},
    ]

    # Recent appointments (up to 10)
    recent_qs = Appointment.objects.filter(
        is_deleted=False,
    ).exclude(
        status__in=[AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW]
    ).select_related('doctor').order_by('-scheduled_start')[:10]

    recent_appointments = []
    for apt in recent_qs:
        start = timezone.localtime(apt.scheduled_start)
        recent_appointments.append({
            'code':         apt.code,
            'patient':      apt.patient_full_name,
            'doctor_name':  apt.doctor.full_name if apt.doctor else '—',
            'date':        start.strftime('%d/%m/%Y'),
            'time':        start.strftime('%H:%M'),
            'status':      apt.status,
        })

    # Alerts
    alerts = []
    if pending > 0:
        alerts.append({'type': 'warning', 'message': f'Có {pending} lịch hẹn đang chờ xác nhận.'})
    if today_qs.filter(status=AppointmentStatus.NO_SHOW).exists():
        alerts.append({'type': 'danger', 'message': 'Có bệnh nhân không đến khám hôm nay.'})
    if today_qs.filter(status=AppointmentStatus.CHECKED_IN).exists():
        alerts.append({'type': 'info', 'message': 'Một số bệnh nhân đã check-in và đang chờ khám.'})
    if not alerts:
        alerts.append({'type': 'info', 'message': 'Không có cảnh báo nào.'})

    return {
        'statCards':            stat_cards,
        'recentAppointments':   recent_appointments,
        'alerts':               alerts,
    }


# ── Admin Doctor Detail ────────────────────────────────────────────────────────

def get_admin_doctor_detail(doctor_id):
    """Return doctor profile with stats for admin detail page."""
    doctor = Doctor.objects.select_related('specialty').filter(pk=doctor_id).first()
    if not doctor:
        raise ValidationError({'detail': 'Không tìm thấy bác sĩ.'})

    from portal.models import User
    linked_user = None
    u = User.objects.filter(doctor=doctor, role='doctor').first()
    if u:
        linked_user = {
            'id':       u.id,
            'username': u.username,
            'full_name': u.full_name,
            'is_active': u.is_active,
        }

    total = Appointment.objects.filter(is_deleted=False, doctor=doctor).count()
    completed = Appointment.objects.filter(
        is_deleted=False, doctor=doctor, status=AppointmentStatus.COMPLETED
    ).count()

    return {
        'id':              doctor.id,
        'full_name':       doctor.full_name,
        'phone':           doctor.phone or '',
        'email':           doctor.email or '',
        'specialty':       doctor.specialty_id,        # ID used by frontend edit form
        'specialty_name':  doctor.specialty.name if doctor.specialty else '',
        'bio':             doctor.bio or '',
        'is_active':       doctor.is_active,
        'linked_user':     linked_user,
        'stats': {
            'total_appointments':       total,
            'completed_appointments':   completed,
        },
    }


# ── Admin Patient Profiles ─────────────────────────────────────────────────────

def get_admin_patient_profiles():
    """Return all patient profiles with account info."""
    return list(PatientProfile.objects.all().order_by('-created_at').values(
        'id', 'full_name', 'phone', 'dob', 'gender',
        'account_username', 'account_email', 'is_current', 'created_at',
    ))


def delete_admin_patient_profile(profile_id):
    """Soft-delete a patient profile."""
    profile = PatientProfile.objects.filter(pk=profile_id).first()
    if not profile:
        raise ValidationError({'detail': 'Không tìm thấy bệnh nhân.'})
    profile.delete()
    return True


def reset_admin_patient_password(profile_id, new_password):
    """Reset patient account password."""
    profile = PatientProfile.objects.filter(pk=profile_id).first()
    if not profile:
        raise ValidationError({'detail': 'Không tìm thấy bệnh nhân.'})
    if len(new_password) < 6:
        raise ValidationError({'new_password': 'Mật khẩu phải ít nhất 6 ký tự.'})
    profile.account_password = new_password
    profile.save(update_fields=['account_password', 'updated_at'])
    return True


# ── Admin Receptionist Profiles ─────────────────────────────────────────────────

def get_admin_receptionist_profiles():
    """Return all receptionist accounts."""
    return list(
        User.objects.filter(role=UserRole.RECEPTIONIST)
        .order_by('-created_at')
        .values('id', 'username', 'full_name', 'email', 'phone', 'notes', 'is_active', 'created_at')
    )


def get_admin_receptionist_profile(receptionist_id):
    """Return single receptionist profile."""
    user = User.objects.filter(pk=receptionist_id, role=UserRole.RECEPTIONIST).first()
    if not user:
        raise ValidationError({'detail': 'Không tìm thấy lễ tân.'})
    return {
        'id':        user.id,
        'username':  user.username,
        'full_name': user.full_name,
        'email':     user.email or '',
        'phone':     user.phone or '',
        'notes':     user.notes or '',
        'is_active': user.is_active,
        'created_at': user.created_at,
    }


@transaction.atomic
def create_admin_receptionist_profile(payload):
    """Create a new receptionist account."""
    from django.contrib.auth.hashers import make_password
    username = str(payload.get('username') or '').strip()
    password = str(payload.get('password') or '').strip()
    full_name = str(payload.get('full_name') or '').strip()
    if not username:
        raise ValidationError({'username': 'Tên đăng nhập là bắt buộc.'})
    if not password or len(password) < 6:
        raise ValidationError({'password': 'Mật khẩu phải ít nhất 6 ký tự.'})
    if not full_name:
        raise ValidationError({'full_name': 'Họ tên là bắt buộc.'})
    if User.objects.filter(username__iexact=username).exists():
        raise ValidationError({'username': 'Tên đăng nhập đã tồn tại.'})

    user = User.objects.create(
        username=username,
        password=make_password(password),
        full_name=full_name,
        email=str(payload.get('email') or '').strip(),
        phone=str(payload.get('phone') or '').strip(),
        notes=str(payload.get('notes') or '').strip(),
        role=UserRole.RECEPTIONIST,
        is_active=bool(payload.get('is_active', True)),
    )
    return {
        'id':        user.id,
        'username':  user.username,
        'full_name': user.full_name,
        'email':     user.email,
        'phone':     user.phone,
        'notes':     user.notes,
        'is_active': user.is_active,
        'created_at': user.created_at,
    }


@transaction.atomic
def update_admin_receptionist_profile(receptionist_id, payload):
    """Update receptionist profile."""
    user = User.objects.filter(pk=receptionist_id, role=UserRole.RECEPTIONIST).first()
    if not user:
        raise ValidationError({'detail': 'Không tìm thấy lễ tân.'})

    if 'full_name' in payload:
        user.full_name = str(payload['full_name']).strip()
    if 'email' in payload:
        user.email = str(payload['email']).strip()
    if 'phone' in payload:
        user.phone = str(payload['phone']).strip()
    if 'notes' in payload:
        user.notes = str(payload['notes']).strip()
    if 'is_active' in payload:
        user.is_active = bool(payload['is_active'])

    user.save()
    return {
        'id':        user.id,
        'username':  user.username,
        'full_name': user.full_name,
        'email':     user.email,
        'phone':     user.phone,
        'notes':     user.notes,
        'is_active': user.is_active,
        'created_at': user.created_at,
    }


@transaction.atomic
def delete_admin_receptionist_profile(receptionist_id):
    """Delete receptionist account."""
    user = User.objects.filter(pk=receptionist_id, role=UserRole.RECEPTIONIST).first()
    if not user:
        raise ValidationError({'detail': 'Không tìm thấy lễ tân.'})
    user.delete()
    return True


@transaction.atomic
def reset_admin_receptionist_password(receptionist_id, new_password):
    """Reset receptionist account password."""
    from django.contrib.auth.hashers import make_password
    user = User.objects.filter(pk=receptionist_id, role=UserRole.RECEPTIONIST).first()
    if not user:
        raise ValidationError({'detail': 'Không tìm thấy lễ tân.'})
    if len(new_password) < 6:
        raise ValidationError({'new_password': 'Mật khẩu phải ít nhất 6 ký tự.'})
    user.password = make_password(new_password)
    user.save(update_fields=['password', 'updated_at'])
    return True
