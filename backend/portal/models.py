from django.db import models

from appointments.models import Appointment
from catalog.models import Doctor


class PatientProfile(models.Model):
    class Gender(models.TextChoices):
        MALE = 'male', 'Male'
        FEMALE = 'female', 'Female'
        OTHER = 'other', 'Other'

    full_name = models.CharField(max_length=150)
    phone = models.CharField(max_length=20, unique=True)
    dob = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=10, choices=Gender.choices, blank=True)
    allergies = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    emergency_name = models.CharField(max_length=150, blank=True)
    emergency_phone = models.CharField(max_length=20, blank=True)
    account_username = models.CharField(max_length=150, unique=True)
    account_email = models.EmailField(blank=True)
    account_password = models.CharField(max_length=128, default='huy0610')
    is_current = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['full_name']

    def __str__(self):
        return f'{self.full_name} ({self.phone})'


class PatientNotification(models.Model):
    profile = models.ForeignKey(
        PatientProfile,
        on_delete=models.CASCADE,
        related_name='notifications',
    )
    message = models.CharField(max_length=255)
    is_read = models.BooleanField(default=False)
    is_deleted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'Notification<{self.profile.full_name}: {self.message[:30]}>'


class MedicalRecord(models.Model):
    code = models.CharField(max_length=32, unique=True)
    appointment = models.OneToOneField(
        Appointment,
        on_delete=models.CASCADE,
        related_name='medical_record',
    )
    patient_profile = models.ForeignKey(
        PatientProfile,
        on_delete=models.CASCADE,
        related_name='medical_records',
    )
    doctor = models.ForeignKey(
        Doctor,
        on_delete=models.PROTECT,
        related_name='medical_records',
    )
    location = models.CharField(max_length=255, default='Cơ sở Hải Châu - Phòng khám số 1')
    chief_complaint = models.TextField(blank=True)
    diagnosis_name = models.CharField(max_length=255, blank=True)
    diagnosis_icd_code = models.CharField(max_length=32, blank=True)
    clinical_notes = models.TextField(blank=True)
    medicines = models.JSONField(default=list, blank=True)
    timeline = models.JSONField(default=list, blank=True)
    draft = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-appointment__scheduled_start', '-created_at']

    def __str__(self):
        return f'{self.code} - {self.appointment.code}'
