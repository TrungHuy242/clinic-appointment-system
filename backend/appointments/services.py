from datetime import datetime, time, timedelta
from time import sleep

from django.db import IntegrityError, OperationalError, transaction
from django.db.models import Q
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from catalog.models import Doctor, Specialty

from .models import Appointment, AppointmentBlock, AppointmentHistory, AppointmentStatus, AppointmentVisitType


STATUS_VALUES = [choice for choice, _label in AppointmentStatus.choices]
STATUS_MESSAGE = f"status must be one of: {', '.join(STATUS_VALUES)}."
VISIT_TYPE_VALUES = [choice for choice, _label in AppointmentVisitType.choices]
VISIT_TYPE_MESSAGE = f"visit_type must be one of: {', '.join(VISIT_TYPE_VALUES)}."
SLOT_BLOCK_MINUTES = 25
CHECKIN_OPEN_OFFSET_MIN = 15
CHECKIN_CLOSE_OFFSET_MIN = 10
PENDING_HOLD_MINUTES = 15
CLINIC_START_TIME = time(hour=8, minute=0)
LUNCH_START_TIME = time(hour=12, minute=0)
LUNCH_END_TIME = time(hour=13, minute=30)
CLINIC_END_TIME = time(hour=17, minute=0)
OVERLAP_MESSAGE = 'Selected time overlaps with another appointment for this doctor.'
PA1_EXPIRED_MESSAGE = 'PA1 confirmation window has expired.'

VISIT_TYPE_CONFIG = {
    AppointmentVisitType.VISIT_15: {
        'duration_minutes': 15,
        'blocks': 1,
    },
    AppointmentVisitType.VISIT_20: {
        'duration_minutes': 20,
        'blocks': 1,
    },
    AppointmentVisitType.VISIT_40: {
        'duration_minutes': 40,
        'blocks': 2,
    },
}


def get_active_appointments_queryset():
    return Appointment.objects.select_related('specialty', 'doctor').order_by(
        '-scheduled_start',
        '-created_at',
    )


def normalize_visit_type(value):
    if isinstance(value, AppointmentVisitType):
        value = value.value

    normalized = str(value or AppointmentVisitType.VISIT_20).strip().upper()
    if normalized not in VISIT_TYPE_CONFIG:
        raise ValidationError({'visit_type': VISIT_TYPE_MESSAGE})
    return normalized


def get_visit_type_config(visit_type):
    return VISIT_TYPE_CONFIG[normalize_visit_type(visit_type)]


def get_visit_type_blocks(visit_type):
    return get_visit_type_config(visit_type)['blocks']


def get_visit_type_duration(visit_type):
    return get_visit_type_config(visit_type)['duration_minutes']


def get_pending_expiry(appointment):
    return appointment.created_at + timedelta(minutes=PENDING_HOLD_MINUTES)


def build_appointment_qr_text(appointment):
    scheduled_start = timezone.localtime(appointment.scheduled_start).isoformat()
    return f'MEDICARE|{appointment.code}|{appointment.patient_phone}|{scheduled_start}'


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


def _make_aware_datetime(date_value, time_value):
    return timezone.make_aware(
        datetime.combine(date_value, time_value),
        timezone.get_current_timezone(),
    )


def get_daily_block_frames(appointment_date):
    day_start = _make_aware_datetime(appointment_date, CLINIC_START_TIME)
    lunch_start = _make_aware_datetime(appointment_date, LUNCH_START_TIME)
    lunch_end = _make_aware_datetime(appointment_date, LUNCH_END_TIME)
    day_end = _make_aware_datetime(appointment_date, CLINIC_END_TIME)

    frames = []
    cursor = day_start
    block_index = 0

    while cursor + timedelta(minutes=SLOT_BLOCK_MINUTES) <= day_end:
        block_end = cursor + timedelta(minutes=SLOT_BLOCK_MINUTES)

        if lunch_start <= cursor < lunch_end or cursor < lunch_start < block_end:
            cursor = lunch_end
            continue

        frames.append(
            {
                'index': block_index,
                'start': cursor,
                'end': block_end,
            }
        )
        cursor = block_end
        block_index += 1

    return frames


def get_overlapping_block_indexes(scheduled_start, scheduled_end):
    local_start = timezone.localtime(scheduled_start)
    local_end = timezone.localtime(scheduled_end)
    if local_start.date() != local_end.date():
        raise ValidationError({'scheduled_end': 'scheduled_end must be on the same day as scheduled_start.'})

    return [
        frame['index']
        for frame in get_daily_block_frames(local_start.date())
        if frame['start'] < local_end and frame['end'] > local_start
    ]


def get_reserved_block_indexes_for_visit(scheduled_start, visit_type):
    local_start = timezone.localtime(scheduled_start)
    frames = get_daily_block_frames(local_start.date())
    required_blocks = get_visit_type_blocks(visit_type)

    for position, frame in enumerate(frames):
        if frame['start'] != local_start:
            continue

        selected_frames = frames[position : position + required_blocks]
        if len(selected_frames) < required_blocks:
            raise ValidationError({'scheduled_start': 'Selected visit type requires consecutive blocks.'})

        for current_frame, next_frame in zip(selected_frames, selected_frames[1:]):
            if current_frame['end'] != next_frame['start']:
                raise ValidationError({'scheduled_start': 'Selected visit type requires consecutive blocks.'})

        return [item['index'] for item in selected_frames], selected_frames[-1]['end']

    raise ValidationError({'scheduled_start': 'scheduled_start must match an available slot boundary.'})


def release_appointment_blocks(appointment):
    appointment.occupied_blocks.all().delete()


def sync_appointment_blocks(appointment, block_indexes=None):
    release_appointment_blocks(appointment)

    if appointment.is_deleted or appointment.status == AppointmentStatus.CANCELLED:
        return []

    if block_indexes is None:
        block_indexes = get_overlapping_block_indexes(appointment.scheduled_start, appointment.scheduled_end)

    appointment_date = timezone.localtime(appointment.scheduled_start).date()
    blocks = [
        AppointmentBlock(
            appointment=appointment,
            doctor=appointment.doctor,
            appointment_date=appointment_date,
            block_index=block_index,
        )
        for block_index in block_indexes
    ]
    AppointmentBlock.objects.bulk_create(blocks)
    return block_indexes


def create_guest_appointment(data):
    patient_full_name = _require_value(data, 'patient_full_name')
    patient_phone = _require_value(data, 'patient_phone')
    specialty = _normalize_specialty(_require_value(data, 'specialty'))
    doctor = _normalize_doctor(_require_value(data, 'doctor'))
    scheduled_start = _require_value(data, 'scheduled_start')
    scheduled_end = _require_value(data, 'scheduled_end')
    visit_type = normalize_visit_type(data.get('visit_type'))

    validate_doctor_specialty(doctor, specialty)
    validate_time_range(scheduled_start, scheduled_end)

    reserved_block_indexes, normalized_end = get_reserved_block_indexes_for_visit(scheduled_start, visit_type)
    appointment_date = timezone.localtime(scheduled_start).date()

    if AppointmentBlock.objects.filter(
        doctor=doctor,
        appointment_date=appointment_date,
        block_index__in=reserved_block_indexes,
    ).exists():
        raise ValidationError({'scheduled_start': OVERLAP_MESSAGE})

    for attempt in range(3):
        try:
            with transaction.atomic():
                appointment = Appointment.objects.create(
                    patient_full_name=patient_full_name,
                    patient_phone=patient_phone,
                    specialty=specialty,
                    doctor=doctor,
                    scheduled_start=scheduled_start,
                    scheduled_end=normalized_end,
                    visit_type=visit_type,
                    status=AppointmentStatus.PENDING,
                )
                sync_appointment_blocks(appointment, block_indexes=reserved_block_indexes)
            return appointment
        except IntegrityError as exc:
            raise ValidationError({'scheduled_start': OVERLAP_MESSAGE}) from exc
        except OperationalError as exc:
            if 'database is locked' not in str(exc).lower():
                raise
            if AppointmentBlock.objects.filter(
                doctor=doctor,
                appointment_date=appointment_date,
                block_index__in=reserved_block_indexes,
            ).exists():
                raise ValidationError({'scheduled_start': OVERLAP_MESSAGE}) from exc
            if attempt == 2:
                raise ValidationError({'scheduled_start': OVERLAP_MESSAGE}) from exc
            sleep(0.05 * (attempt + 1))

    raise ValidationError({'scheduled_start': OVERLAP_MESSAGE})


def _save_status(appointment, new_status):
    appointment.status = new_status
    appointment.save(update_fields=['status', 'updated_at'])
    return appointment


def set_appointment_status(appointment, new_status, changed_by='', changed_by_role='', note=''):
    if new_status not in STATUS_VALUES:
        raise ValidationError({'status': STATUS_MESSAGE})

    appointment.refresh_from_db()

    if new_status == AppointmentStatus.CONFIRMED:
        expire_pending_appointment_if_needed(appointment)
        appointment.refresh_from_db()
        if appointment.status == AppointmentStatus.CANCELLED:
            raise ValidationError({'status': PA1_EXPIRED_MESSAGE})

    if appointment.status == AppointmentStatus.CANCELLED and new_status != AppointmentStatus.CANCELLED:
        raise ValidationError({'status': 'Cancelled appointments cannot be reopened through this endpoint.'})

    if appointment.status != new_status:
        old_status = appointment.status
        _save_status(appointment, new_status)
        _record_history(
            appointment=appointment,
            action=_status_to_history_action(new_status),
            changed_by=changed_by,
            changed_by_role=changed_by_role,
            note=note,
        )
        _log_admin_status_change(appointment, old_status, new_status, changed_by, changed_by_role)

    if new_status == AppointmentStatus.CANCELLED:
        release_appointment_blocks(appointment)

    return appointment


def _status_to_history_action(status):
    mapping = {
        AppointmentStatus.CONFIRMED: 'CONFIRM',
        AppointmentStatus.CANCELLED: 'CANCEL',
        AppointmentStatus.CHECKED_IN: 'CHECKIN',
        AppointmentStatus.WAITING: 'MOVE_TO_DOCTOR',
        AppointmentStatus.NO_SHOW: 'NO_SHOW',
        AppointmentStatus.IN_PROGRESS: 'IN_PROGRESS',
        AppointmentStatus.COMPLETED: 'COMPLETE',
    }
    return mapping.get(status, status)


def _record_history(appointment, action, changed_by='', changed_by_role='', note=''):
    AppointmentHistory.objects.create(
        appointment=appointment,
        action=action,
        changed_by=changed_by or 'Hệ thống',
        changed_by_role=changed_by_role,
        note=note,
    )


def move_appointment_to_waiting(appointment, changed_by='', changed_by_role=''):
    """Chuyển appointment từ CHECKED_IN sang WAITING để bác sĩ thấy trong danh sách khám."""
    if appointment.status not in (AppointmentStatus.CHECKED_IN, AppointmentStatus.CONFIRMED):
        raise ValidationError({
            'status': f'Chỉ có thể chuyển lịch hẹn ở trạng thái Đã check-in hoặc Đã xác nhận. Trạng thái hiện tại: {appointment.status}'
        })
    return set_appointment_status(
        appointment,
        AppointmentStatus.WAITING,
        changed_by=changed_by,
        changed_by_role=changed_by_role,
        note='Receptionist chuyển bệnh nhân sang bác sĩ.',
    )


def _log_admin_status_change(appointment, old_status, new_status, changed_by, changed_by_role):
    """Write to AdminAuditLog for status changes (admin or doctor actions)."""
    try:
        from portal.services import log_admin_action as _log
        _log(
            'STATUS_CHANGE', 'Appointment', appointment.id, appointment.code,
            actor_name=changed_by or 'Hệ thống',
            actor_role=changed_by_role or 'admin',
            detail=f'Đổi trạng thái {appointment.code}: {old_status} → {new_status}',
        )
    except Exception:
        pass


def soft_delete_appointment(appointment):
    appointment.is_deleted = True
    appointment.save(update_fields=['is_deleted', 'updated_at'])
    release_appointment_blocks(appointment)
    _record_history(
        appointment=appointment,
        action='DELETE',
        changed_by='Hệ thống',
        changed_by_role='admin',
        note='Xóa mềm qua Admin',
    )
    return appointment


def reschedule_appointment(appointment, new_scheduled_start, new_scheduled_end,
                            changed_by='', changed_by_role='', note=''):
    """Đổi giờ hẹn: cập nhật scheduled_start/end, sync blocks, ghi history."""
    CANCELLED = AppointmentStatus.CANCELLED
    if appointment.status == CANCELLED:
        raise ValidationError({'status': 'Không thể dời lịch của lịch hẹn đã hủy.'})

    old_start = timezone.localtime(appointment.scheduled_start).strftime('%d/%m/%Y %H:%M')
    old_end = timezone.localtime(appointment.scheduled_end).strftime('%d/%m/%Y %H:%M')

    appointment.scheduled_start = new_scheduled_start
    appointment.scheduled_end = new_scheduled_end
    appointment.save(update_fields=['scheduled_start', 'scheduled_end', 'updated_at'])

    block_indexes = sync_appointment_blocks(appointment)

    history_note = note or f'Lịch cũ: {old_start} – {old_end}'
    _record_history(
        appointment=appointment,
        action='RESCHEDULE',
        changed_by=changed_by or 'Admin',
        changed_by_role=changed_by_role or 'admin',
        note=history_note,
    )

    return appointment


def expire_pending_appointment_if_needed(appointment, now=None):
    if appointment.status != AppointmentStatus.PENDING:
        return appointment

    now = now or timezone.now()
    if get_pending_expiry(appointment) <= now:
        _save_status(appointment, AppointmentStatus.CANCELLED)
        release_appointment_blocks(appointment)

    return appointment


def get_appointments_by_phone(phone):
    normalized_phone = str(phone or '').strip()
    if not normalized_phone:
        raise ValidationError({'phone': 'phone is required.'})

    queryset = get_active_appointments_queryset().filter(patient_phone=normalized_phone)
    appointments = []

    for appointment in queryset:
        expire_pending_appointment_if_needed(appointment)
        appointment.refresh_from_db()
        appointments.append(appointment)

    return appointments


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


def build_doctor_slots(doctor_id, appointment_date, visit_type=AppointmentVisitType.VISIT_20):
    normalized_visit_type = normalize_visit_type(visit_type)
    required_blocks = get_visit_type_blocks(normalized_visit_type)
    visit_duration = get_visit_type_duration(normalized_visit_type)

    appointments = list(
        get_active_appointments_queryset()
        .filter(doctor_id=doctor_id, scheduled_start__date=appointment_date)
        .exclude(status=AppointmentStatus.CANCELLED)
    )
    for appointment in appointments:
        expire_pending_appointment_if_needed(appointment)

    occupied_blocks = set(
        AppointmentBlock.objects.filter(
            doctor_id=doctor_id,
            appointment_date=appointment_date,
        ).values_list('block_index', flat=True)
    )

    frames = get_daily_block_frames(appointment_date)
    slots = []

    for position, frame in enumerate(frames):
        selected_frames = frames[position : position + required_blocks]
        has_enough_blocks = len(selected_frames) == required_blocks
        is_consecutive = has_enough_blocks and all(
            current_frame['end'] == next_frame['start']
            for current_frame, next_frame in zip(selected_frames, selected_frames[1:])
        )
        block_indexes = [item['index'] for item in selected_frames]
        has_conflict = (
            not has_enough_blocks
            or not is_consecutive
            or any(block_index in occupied_blocks for block_index in block_indexes)
        )

        slot_end = selected_frames[-1]['end'] if has_enough_blocks else frame['end']
        next_block_index = selected_frames[1]['index'] if len(selected_frames) > 1 else None

        slots.append(
            {
                'id': f'{doctor_id}-{appointment_date.isoformat()}-{frame["index"]}-{normalized_visit_type}',
                'start': timezone.localtime(frame['start']).strftime('%H:%M'),
                'end': timezone.localtime(slot_end).strftime('%H:%M'),
                'duration': visit_duration,
                'status': 'conflict' if has_conflict else 'available',
                'occupies': required_blocks,
                'blockIndexes': block_indexes or [frame['index']],
                'primaryBlockIndex': frame['index'],
                'nextBlockIndex': next_block_index,
                'visitType': normalized_visit_type,
            }
        )

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
    appointment.refresh_from_db()

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
