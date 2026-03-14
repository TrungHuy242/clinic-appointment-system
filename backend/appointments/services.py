from rest_framework.exceptions import ValidationError

from catalog.models import Doctor, Specialty

from .models import Appointment, AppointmentStatus


STATUS_VALUES = [choice for choice, _label in AppointmentStatus.choices]
STATUS_MESSAGE = f"status must be one of: {', '.join(STATUS_VALUES)}."


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


def get_appointment_by_id_or_code(value):
    lookup_value = str(value).strip()
    queryset = get_active_appointments_queryset()

    if lookup_value.isdigit():
        return queryset.get(pk=int(lookup_value))

    return queryset.get(code=lookup_value)
