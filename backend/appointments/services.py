from datetime import datetime, time, timedelta

from django.db.models import Q
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from catalog.models import Doctor, Specialty

from .models import Appointment, AppointmentStatus


STATUS_VALUES = [choice for choice, _label in AppointmentStatus.choices]
STATUS_MESSAGE = f"status must be one of: {', '.join(STATUS_VALUES)}."
SLOT_BLOCK_MINUTES = 25
CHECKIN_OPEN_OFFSET_MIN = 15
CHECKIN_CLOSE_OFFSET_MIN = 10
PENDING_HOLD_MINUTES = 15
CLINIC_START_TIME = time(hour=8, minute=0)
LUNCH_START_TIME = time(hour=12, minute=0)
LUNCH_END_TIME = time(hour=13, minute=30)
CLINIC_END_TIME = time(hour=17, minute=0)


def get_active_appointments_queryset():
    return Appointment.objects.select_related('specialty', 'doctor').order_by(
        '-scheduled_start',
        '-created_at',
    )


def validate_time_range(start, end):
    if start is None or end is None:
        return

    if end <= start:
        raise ValidationError({'scheduled_end': 'scheduled_end must be later than scheduled_start.'})


def validate_doctor_specialty(doctor, specialty):
    if doctor is None or specialty is None:
        return

    if doctor.specialty_id != specialty.id:
        raise ValidationError({'doctor': 'Doctor does not belong to the selected specialty.'})


def _require_value(data, field_name):
    value = data.get(field_name)
    if value is None:
        raise ValidationError({field_name: f'{field_name} is required.'})

    if isinstance(value, str):
        value = value.strip()
        if not value:
            raise ValidationError({field_name: f'{field_name} is required.'})

    return value


def _normalize_specialty(value):
    if isinstance(value, Specialty):
        specialty = value
    else:
        try:
            specialty = Specialty.objects.get(pk=value)
        except Specialty.DoesNotExist as exc:
            raise ValidationError({'specialty': 'specialty does not exist or is inactive.'}) from exc

    if not specialty.is_active:
        raise ValidationError({'specialty': 'specialty does not exist or is inactive.'})

    return specialty


def _normalize_doctor(value):
    if isinstance(value, Doctor):
        doctor = value
    else:
        try:
            doctor = Doctor.objects.get(pk=value)
        except Doctor.DoesNotExist as exc:
            raise ValidationError({'doctor': 'doctor does not exist or is inactive.'}) from exc

    if not doctor.is_active:
        raise ValidationError({'doctor': 'doctor does not exist or is inactive.'})

    return doctor


def create_guest_appointment(data):
    patient_full_name = _require_value(data, 'patient_full_name')
    patient_phone = _require_value(data, 'patient_phone')
    specialty = _normalize_specialty(_require_value(data, 'specialty'))
    doctor = _normalize_doctor(_require_value(data, 'doctor'))
    scheduled_start = _require_value(data, 'scheduled_start')
    scheduled_end = _require_value(data, 'scheduled_end')

    validate_doctor_specialty(doctor, specialty)
    validate_time_range(scheduled_start, scheduled_end)

    return Appointment.objects.create(
        patient_full_name=patient_full_name,
        patient_phone=patient_phone,
        specialty=specialty,
        doctor=doctor,
        scheduled_start=scheduled_start,
        scheduled_end=scheduled_end,
        status=AppointmentStatus.PENDING,
    )


def set_appointment_status(appointment, new_status):
    if new_status not in STATUS_VALUES:
        raise ValidationError({'status': STATUS_MESSAGE})

    appointment.status = new_status
    appointment.save(update_fields=['status', 'updated_at'])
    return appointment


def soft_delete_appointment(appointment):
    appointment.is_deleted = True
    appointment.save(update_fields=['is_deleted', 'updated_at'])
    return appointment


def expire_pending_appointment_if_needed(appointment, now=None):
    if appointment.status != AppointmentStatus.PENDING:
        return appointment

    now = now or timezone.now()
    if appointment.created_at + timedelta(minutes=PENDING_HOLD_MINUTES) <= now:
        set_appointment_status(appointment, AppointmentStatus.CANCELLED)

    return appointment


def get_appointment_by_id_or_code(value):
    lookup_value = str(value).strip()
    queryset = get_active_appointments_queryset()

    if lookup_value.isdigit():
        appointment = queryset.get(pk=int(lookup_value))
    else:
        appointment = queryset.get(code=lookup_value.upper())

    return expire_pending_appointment_if_needed(appointment)


def get_appointment_by_code_and_phone(code, phone):
    appointment = get_active_appointments_queryset().get(
        code=str(code).strip().upper(),
        patient_phone=str(phone).strip(),
    )
    return expire_pending_appointment_if_needed(appointment)


def _make_aware_datetime(date_value, time_value):
    return timezone.make_aware(
        datetime.combine(date_value, time_value),
        timezone.get_current_timezone(),
    )


def build_doctor_slots(doctor_id, appointment_date):
    day_start = _make_aware_datetime(appointment_date, CLINIC_START_TIME)
    lunch_start = _make_aware_datetime(appointment_date, LUNCH_START_TIME)
    lunch_end = _make_aware_datetime(appointment_date, LUNCH_END_TIME)
    day_end = _make_aware_datetime(appointment_date, CLINIC_END_TIME)

    appointments = list(
        get_active_appointments_queryset()
        .filter(doctor_id=doctor_id, scheduled_start__date=appointment_date)
        .exclude(status=AppointmentStatus.CANCELLED)
        .order_by('scheduled_start')
    )

    active_appointments = []
    for appointment in appointments:
        expire_pending_appointment_if_needed(appointment)
        if appointment.status != AppointmentStatus.CANCELLED:
            active_appointments.append(appointment)

    slots = []
    cursor = day_start
    block_index = 0

    while cursor + timedelta(minutes=SLOT_BLOCK_MINUTES) <= day_end:
        block_end = cursor + timedelta(minutes=SLOT_BLOCK_MINUTES)

        if lunch_start <= cursor < lunch_end:
            cursor = lunch_end
            continue

        if cursor < lunch_start < block_end:
            cursor = lunch_end
            continue

        has_conflict = any(
            appointment.scheduled_start < block_end and appointment.scheduled_end > cursor
            for appointment in active_appointments
        )

        slots.append(
            {
                'id': f'{doctor_id}-{appointment_date.isoformat()}-{block_index}',
                'start': timezone.localtime(cursor).strftime('%H:%M'),
                'end': timezone.localtime(block_end).strftime('%H:%M'),
                'duration': SLOT_BLOCK_MINUTES,
                'status': 'conflict' if has_conflict else 'available',
                'occupies': 1,
                'blockIndexes': [block_index],
                'primaryBlockIndex': block_index,
                'nextBlockIndex': None,
            }
        )

        cursor = block_end
        block_index += 1

    return slots


def lookup_appointment_for_checkin(query, appointment_date, now=None):
    normalized_query = str(query or '').strip()
    if not normalized_query:
        raise ValidationError({'query': 'query is required.'})

    now = now or timezone.now()
    appointment = (
        get_active_appointments_queryset()
        .filter(scheduled_start__date=appointment_date)
        .exclude(status=AppointmentStatus.CANCELLED)
        .filter(Q(code__iexact=normalized_query.upper()) | Q(patient_phone=normalized_query))
        .order_by('scheduled_start')
        .first()
    )

    if not appointment:
        return {'state': 'not_found', 'appointment': None}

    expire_pending_appointment_if_needed(appointment, now=now)

    if appointment.status == AppointmentStatus.CANCELLED:
        return {'state': 'not_found', 'appointment': None}

    if appointment.status == AppointmentStatus.CHECKED_IN:
        return {'state': 'valid', 'appointment': appointment}

    if appointment.status != AppointmentStatus.CONFIRMED:
        return {'state': 'not_found', 'appointment': None}

    appointment_start = timezone.localtime(appointment.scheduled_start)
    current_time = timezone.localtime(now)
    diff_minutes = int((current_time - appointment_start).total_seconds() // 60)

    if diff_minutes < -CHECKIN_OPEN_OFFSET_MIN:
        return {'state': 'early', 'appointment': appointment}

    if diff_minutes > CHECKIN_CLOSE_OFFSET_MIN:
        return {'state': 'late', 'appointment': appointment}

    set_appointment_status(appointment, AppointmentStatus.CHECKED_IN)
    return {'state': 'valid', 'appointment': appointment}
