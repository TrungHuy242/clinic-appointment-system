from rest_framework import serializers

from catalog.models import Doctor, Specialty

from .models import Appointment, AppointmentStatus


class AppointmentSerializer(serializers.ModelSerializer):
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
    specialty = serializers.PrimaryKeyRelatedField(queryset=Specialty.objects.filter(is_active=True))
    doctor = serializers.PrimaryKeyRelatedField(queryset=Doctor.objects.filter(is_active=True))

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
