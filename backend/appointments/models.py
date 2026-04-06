import secrets

from django.db import models
from django.utils import timezone

from catalog.models import Doctor, Specialty


class AppointmentStatus(models.TextChoices):
    PENDING = 'PENDING', 'Pending'
    CONFIRMED = 'CONFIRMED', 'Confirmed'
    CHECKED_IN = 'CHECKED_IN', 'Checked in'
    WAITING = 'WAITING', 'Waiting'
    IN_PROGRESS = 'IN_PROGRESS', 'In progress'
    COMPLETED = 'COMPLETED', 'Completed'
    CANCELLED = 'CANCELLED', 'Cancelled'
    NO_SHOW = 'NO_SHOW', 'No show'


class AppointmentVisitType(models.TextChoices):
    VISIT_15 = 'VISIT_15', 'Khám 15 phút'
    VISIT_20 = 'VISIT_20', 'Khám 20 phút'
    VISIT_40 = 'VISIT_40', 'Khám 40 phút'


class AppointmentQuerySet(models.QuerySet):
    def active(self):
        return self.filter(is_deleted=False)


class ActiveAppointmentManager(models.Manager.from_queryset(AppointmentQuerySet)):
    def get_queryset(self):
        return super().get_queryset().active()


class Appointment(models.Model):
    code = models.CharField(max_length=13, unique=True, editable=False)
    patient_full_name = models.CharField(max_length=150)
    patient_phone = models.CharField(max_length=20)
    specialty = models.ForeignKey(
        Specialty,
        on_delete=models.PROTECT,
        related_name='appointments',
    )
    doctor = models.ForeignKey(
        Doctor,
        on_delete=models.PROTECT,
        related_name='appointments',
    )
    scheduled_start = models.DateTimeField()
    scheduled_end = models.DateTimeField()
    visit_type = models.CharField(
        max_length=20,
        choices=AppointmentVisitType.choices,
        default=AppointmentVisitType.VISIT_20,
    )
    status = models.CharField(
        max_length=20,
        choices=AppointmentStatus.choices,
        default=AppointmentStatus.PENDING,
    )
    is_deleted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = ActiveAppointmentManager()
    all_objects = models.Manager()

    class Meta:
        ordering = ['-scheduled_start', '-created_at']
        base_manager_name = 'all_objects'
        default_manager_name = 'objects'

    def save(self, *args, **kwargs):
        if not self.code:
            self.code = generate_appointment_code()
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.code} - {self.patient_full_name}'


class AppointmentBlock(models.Model):
    appointment = models.ForeignKey(
        Appointment,
        on_delete=models.CASCADE,
        related_name='occupied_blocks',
    )
    doctor = models.ForeignKey(
        Doctor,
        on_delete=models.CASCADE,
        related_name='appointment_blocks',
    )
    appointment_date = models.DateField()
    block_index = models.PositiveSmallIntegerField()

    class Meta:
        ordering = ['appointment_date', 'block_index']
        constraints = [
            models.UniqueConstraint(
                fields=['doctor', 'appointment_date', 'block_index'],
                name='uniq_appointment_block_per_doctor',
            )
        ]

    def __str__(self):
        return f'{self.doctor_id}:{self.appointment_date}:{self.block_index}'


class AppointmentHistory(models.Model):
    """Audit trail ghi lại từng thay đổi trạng thái / lịch của một appointment."""

    ACTION_CHOICES = [
        ('CREATE', 'Tạo mới'),
        ('CONFIRM', 'Xác nhận'),
        ('CANCEL', 'Hủy lịch'),
        ('CHECKIN', 'Check-in'),
        ('MOVE_TO_DOCTOR', 'Chuyển sang bác sĩ'),
        ('NO_SHOW', 'No-show'),
        ('RESCHEDULE', 'Dời lịch'),
        ('COMPLETE', 'Hoàn tất khám'),
        ('DELETE', 'Xóa'),
    ]

    appointment = models.ForeignKey(
        Appointment,
        on_delete=models.CASCADE,
        related_name='history',
    )
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    changed_by = models.CharField(max_length=150, blank=True, help_text='Tên người thực hiện (staff name hoặc "Hệ thống")')
    changed_by_role = models.CharField(max_length=20, blank=True, help_text='Vai trò: admin / receptionist / doctor')
    note = models.TextField(blank=True, help_text='Ghi chú bổ sung (vd: lý do hủy, lịch cũ → lịch mới)')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Appointment History'
        verbose_name_plural = 'Appointment Histories'

    def __str__(self):
        return f'{self.appointment.code} — {self.action} @ {self.created_at}'


def generate_appointment_code():
    year = timezone.now().year
    while True:
        suffix = f'{secrets.randbelow(10000):04d}'
        code = f'APT-{year}-{suffix}'
        if not Appointment.all_objects.filter(code=code).exists():
            return code
