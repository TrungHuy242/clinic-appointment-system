from django.db import models

from appointments.models import Appointment
from catalog.models import Doctor


class UserRole(models.TextChoices):
    ADMIN = 'admin', 'Admin'
    RECEPTIONIST = 'receptionist', 'Receptionist'
    DOCTOR = 'doctor', 'Doctor'


class User(models.Model):
    """Staff user model for admin, receptionist, doctor roles."""

    username = models.CharField(max_length=150, unique=True)
    password = models.CharField(max_length=128)
    email = models.EmailField(blank=True)
    full_name = models.CharField(max_length=150)
    phone = models.CharField(max_length=20, blank=True)
    notes = models.TextField(blank=True)
    role = models.CharField(
        max_length=20,
        choices=UserRole.choices,
        default=UserRole.RECEPTIONIST,
    )
    doctor = models.OneToOneField(
        Doctor,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='user',
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['username']

    def __str__(self):
        return f'{self.full_name} ({self.role})'


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


class AuditAction(models.TextChoices):
    CREATE = 'CREATE', 'Tạo mới'
    UPDATE = 'UPDATE', 'Cập nhật'
    DELETE = 'DELETE', 'Xóa'
    RESET_PASSWORD = 'RESET_PASSWORD', 'Đặt lại mật khẩu'
    STATUS_CHANGE = 'STATUS_CHANGE', 'Đổi trạng thái'
    RESCHEDULE = 'RESCHEDULE', 'Đổi lịch hẹn'
    CREATE_ACCOUNT = 'CREATE_ACCOUNT', 'Tạo tài khoản'


class AdminAuditLog(models.Model):
    """Immutable admin audit log — captures every staff action across catalog/portal/appointments."""

    action = models.CharField(max_length=32, choices=AuditAction.choices)
    resource_type = models.CharField(
        max_length=32,
        help_text='e.g. Specialty, Doctor, Receptionist, Appointment, User',
    )
    resource_id = models.CharField(max_length=64, blank=True)
    resource_label = models.CharField(
        max_length=255,
        blank=True,
        help_text='Human-readable resource name, e.g. "BS. Nguyễn Văn A"',
    )
    actor_name = models.CharField(max_length=150, blank=True)
    actor_role = models.CharField(max_length=20, blank=True)
    detail = models.TextField(blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Admin Audit Log'
        verbose_name_plural = 'Admin Audit Logs'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['action']),
            models.Index(fields=['resource_type']),
            models.Index(fields=['actor_role']),
            models.Index(fields=['-created_at']),
        ]

    def __str__(self):
        return f'[{self.created_at:%Y-%m-%d %H:%M}] {self.actor_name} — {self.action} {self.resource_type}:{self.resource_label}'
