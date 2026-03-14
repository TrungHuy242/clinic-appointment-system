import re

from rest_framework import serializers

from catalog.models import Doctor, Specialty

from .models import Appointment, AppointmentStatus


PHONE_PATTERN = re.compile(r'^\+?[0-9][0-9\s\-()]{7,18}$')
STATUS_VALUES = [choice for choice, _label in AppointmentStatus.choices]
STATUS_MESSAGE = f"status must be one of: {', '.join(STATUS_VALUES)}."


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
    status = serializers.ChoiceField(
        choices=AppointmentStatus.choices,
        required=False,
        error_messages={
            'invalid_choice': STATUS_MESSAGE,
        },
    )
    specialty_name = serializers.CharField(source='specialty.name', read_only=True)
    doctor_name = serializers.CharField(source='doctor.full_name', read_only=True)

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
            'status',
            'is_deleted',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'code',
            'specialty_name',
            'doctor_name',
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

        if specialty and doctor and doctor.specialty_id != specialty.id:
            raise serializers.ValidationError(
                {'doctor': 'Doctor does not belong to the selected specialty.'}
            )

        if scheduled_start and scheduled_end and scheduled_end <= scheduled_start:
            raise serializers.ValidationError(
                {'scheduled_end': 'scheduled_end must be later than scheduled_start.'}
            )

        return attrs


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

    class Meta:
        model = Appointment
        fields = [
            'patient_full_name',
            'patient_phone',
            'specialty',
            'doctor',
            'scheduled_start',
            'scheduled_end',
        ]

    def validate_patient_full_name(self, value):
        value = value.strip()
        if len(value) < 2:
            raise serializers.ValidationError('patient_full_name must be at least 2 characters long.')
        return value

    def validate_patient_phone(self, value):
        return validate_phone_number(value, 'patient_phone', required=True)

    def validate(self, attrs):
        doctor = attrs['doctor']
        specialty = attrs['specialty']

        if doctor.specialty_id != specialty.id:
            raise serializers.ValidationError(
                {'doctor': 'Doctor does not belong to the selected specialty.'}
            )

        if attrs['scheduled_end'] <= attrs['scheduled_start']:
            raise serializers.ValidationError(
                {'scheduled_end': 'scheduled_end must be later than scheduled_start.'}
            )

        return attrs

    def create(self, validated_data):
        return Appointment.objects.create(
            **validated_data,
            status=AppointmentStatus.PENDING,
        )
