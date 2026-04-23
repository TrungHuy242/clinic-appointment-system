import re

from rest_framework import serializers

from catalog.models import Doctor, Specialty

from .models import Appointment, AppointmentStatus, AppointmentVisitType
from .services import (
    STATUS_MESSAGE,
    VISIT_TYPE_MESSAGE,
    build_appointment_qr_text,
    create_guest_appointment,
    create_reception_appointment,
    get_pending_expiry,
    get_visit_type_blocks,
    set_appointment_status,
    validate_doctor_specialty,
    validate_time_range,
)


PHONE_PATTERN = re.compile(r'^\+?[0-9][0-9\s\-()]{7,18}$')


class ActiveSpecialtyPrimaryKeyRelatedField(serializers.PrimaryKeyRelatedField):
    default_error_messages = {
        'required': 'specialty is required.',
        'null': 'specialty is required.',
        'does_not_exist': 'specialty does not exist or is inactive.',
        'incorrect_type': 'specialty must be an integer id.',
    }


class ActiveDoctorPrimaryKeyRelatedField(serializers.PrimaryKeyRelatedField):
    default_error_messages = {
        'required': 'doctor is required.',
        'null': 'doctor is required.',
        'does_not_exist': 'doctor does not exist or is inactive.',
        'incorrect_type': 'doctor must be an integer id.',
    }


def validate_phone_number(value, field_name, required):
    if value is None:
        if required:
            raise serializers.ValidationError(f'{field_name} is required.')
        return value

    value = value.strip()
    if not value:
        if required:
            raise serializers.ValidationError(f'{field_name} is required.')
        return ''

    if not PHONE_PATTERN.match(value):
        raise serializers.ValidationError(
            f'{field_name} must contain 8-15 digits and may include +, spaces, parentheses, or hyphens.'
        )

    digits = ''.join(char for char in value if char.isdigit())
    if not 8 <= len(digits) <= 15:
        raise serializers.ValidationError(
            f'{field_name} must contain 8-15 digits and may include +, spaces, parentheses, or hyphens.'
        )

    return value


class AppointmentSerializer(serializers.ModelSerializer):
    patient_full_name = serializers.CharField(
        required=False,
        allow_blank=False,
        trim_whitespace=True,
        max_length=150,
        error_messages={
            'blank': 'patient_full_name is required.',
            'max_length': 'patient_full_name must be at most 150 characters.',
        },
    )
    patient_phone = serializers.CharField(
        required=False,
        allow_blank=False,
        max_length=20,
        error_messages={
            'blank': 'patient_phone is required.',
            'max_length': 'patient_phone must be at most 20 characters.',
        },
    )
    specialty = ActiveSpecialtyPrimaryKeyRelatedField(
        queryset=Specialty.objects.filter(is_active=True),
        required=False,
    )
    doctor = ActiveDoctorPrimaryKeyRelatedField(
        queryset=Doctor.objects.filter(is_active=True),
        required=False,
    )
    scheduled_start = serializers.DateTimeField(
        required=False,
        error_messages={
            'invalid': 'scheduled_start must be a valid datetime.',
            'null': 'scheduled_start is required.',
        },
    )
    scheduled_end = serializers.DateTimeField(
        required=False,
        error_messages={
            'invalid': 'scheduled_end must be a valid datetime.',
            'null': 'scheduled_end is required.',
        },
    )
    visit_type = serializers.ChoiceField(
        choices=AppointmentVisitType.choices,
        required=False,
        default=AppointmentVisitType.VISIT_20,
        error_messages={
            'invalid_choice': VISIT_TYPE_MESSAGE,
        },
    )
    status = serializers.ChoiceField(
        choices=AppointmentStatus.choices,
        required=False,
        error_messages={
            'invalid_choice': STATUS_MESSAGE,
        },
    )
    specialty_name = serializers.CharField(source='specialty.name', read_only=True)
    doctor_name = serializers.CharField(source='doctor.full_name', read_only=True)
    visit_type_label = serializers.CharField(source='get_visit_type_display', read_only=True)
    visit_blocks = serializers.SerializerMethodField()
    expires_at = serializers.SerializerMethodField()
    qr_text = serializers.SerializerMethodField()

    class Meta:
        model = Appointment
        fields = [
            'id',
            'code',
            'patient_full_name',
            'patient_phone',
            'specialty',
            'specialty_name',
            'doctor',
            'doctor_name',
            'scheduled_start',
            'scheduled_end',
            'visit_type',
            'visit_type_label',
            'visit_blocks',
            'status',
            'qr_text',
            'expires_at',
            'is_deleted',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'code',
            'specialty_name',
            'doctor_name',
            'visit_type_label',
            'visit_blocks',
            'qr_text',
            'expires_at',
            'is_deleted',
            'created_at',
            'updated_at',
        ]

    def validate_patient_full_name(self, value):
        value = value.strip()
        if len(value) < 2:
            raise serializers.ValidationError('patient_full_name must be at least 2 characters long.')
        return value

    def validate_patient_phone(self, value):
        return validate_phone_number(value, 'patient_phone', required=True)

    def validate(self, attrs):
        specialty = attrs.get('specialty') or getattr(self.instance, 'specialty', None)
        doctor = attrs.get('doctor') or getattr(self.instance, 'doctor', None)
        scheduled_start = attrs.get('scheduled_start') or getattr(self.instance, 'scheduled_start', None)
        scheduled_end = attrs.get('scheduled_end') or getattr(self.instance, 'scheduled_end', None)

        validate_doctor_specialty(doctor, specialty)
        validate_time_range(scheduled_start, scheduled_end)
        return attrs

    def update(self, instance, validated_data):
        new_status = validated_data.pop('status', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if validated_data:
            instance.save()

        if new_status is not None:
            set_appointment_status(instance, new_status)

        return instance

    def get_visit_blocks(self, obj):
        return get_visit_type_blocks(obj.visit_type)

    def get_expires_at(self, obj):
        if obj.status != AppointmentStatus.PENDING:
            return None
        return get_pending_expiry(obj)

    def get_qr_text(self, obj):
        return build_appointment_qr_text(obj)


class AppointmentGuestSerializer(serializers.ModelSerializer):
    patient_full_name = serializers.CharField(
        required=True,
        allow_blank=False,
        trim_whitespace=True,
        max_length=150,
        error_messages={
            'required': 'patient_full_name is required.',
            'blank': 'patient_full_name is required.',
            'max_length': 'patient_full_name must be at most 150 characters.',
        },
    )
    patient_phone = serializers.CharField(
        required=True,
        allow_blank=False,
        max_length=20,
        error_messages={
            'required': 'patient_phone is required.',
            'blank': 'patient_phone is required.',
            'max_length': 'patient_phone must be at most 20 characters.',
        },
    )
    specialty = ActiveSpecialtyPrimaryKeyRelatedField(
        queryset=Specialty.objects.filter(is_active=True),
    )
    doctor = ActiveDoctorPrimaryKeyRelatedField(
        queryset=Doctor.objects.filter(is_active=True),
    )
    scheduled_start = serializers.DateTimeField(
        required=True,
        error_messages={
            'required': 'scheduled_start is required.',
            'invalid': 'scheduled_start must be a valid datetime.',
            'null': 'scheduled_start is required.',
        },
    )
    scheduled_end = serializers.DateTimeField(
        required=True,
        error_messages={
            'required': 'scheduled_end is required.',
            'invalid': 'scheduled_end must be a valid datetime.',
            'null': 'scheduled_end is required.',
        },
    )
    visit_type = serializers.ChoiceField(
        choices=AppointmentVisitType.choices,
        required=False,
        default=AppointmentVisitType.VISIT_20,
        error_messages={
            'invalid_choice': VISIT_TYPE_MESSAGE,
        },
    )

    class Meta:
        model = Appointment
        fields = [
            'patient_full_name',
            'patient_phone',
            'specialty',
            'doctor',
            'scheduled_start',
            'scheduled_end',
            'visit_type',
        ]

    def validate_patient_full_name(self, value):
        value = value.strip()
        if len(value) < 2:
            raise serializers.ValidationError('patient_full_name must be at least 2 characters long.')
        return value

    def validate_patient_phone(self, value):
        return validate_phone_number(value, 'patient_phone', required=True)

    def validate(self, attrs):
        validate_doctor_specialty(attrs['doctor'], attrs['specialty'])
        validate_time_range(attrs['scheduled_start'], attrs['scheduled_end'])
        return attrs

    def create(self, validated_data):
        return create_guest_appointment(validated_data)


class ReceptionAppointmentSerializer(AppointmentGuestSerializer):
    def create(self, validated_data):
        return create_reception_appointment(validated_data)
