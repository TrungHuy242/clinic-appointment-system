from django.db import models


class Specialty(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']
        verbose_name_plural = 'specialties'

    def __str__(self):
        return self.name


class Doctor(models.Model):
    full_name = models.CharField(max_length=150)
    phone = models.CharField(max_length=20, blank=True)
    email = models.CharField(max_length=254, blank=True)
    specialty = models.ForeignKey(
        Specialty,
        on_delete=models.PROTECT,
        related_name='doctors',
    )
    bio = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['full_name']

    def __str__(self):
        return f'{self.full_name} ({self.specialty.name})'


class DoctorSchedule(models.Model):
    """
    Cấu hình lịch làm việc mặc định cho mỗi bác sĩ.
    Mỗi bản ghi đại diện cho một ngày trong tuần (0=Thứ Hai, 6=Chủ Nhật).
    """
    doctor = models.ForeignKey(
        Doctor,
        on_delete=models.CASCADE,
        related_name='schedules',
    )
    weekday = models.PositiveSmallIntegerField(
        help_text='0=Thứ Hai, 1=Thứ Ba, ..., 6=Chủ Nhật',
    )
    is_working = models.BooleanField(default=True)

    class Meta:
        ordering = ['doctor', 'weekday']
        constraints = [
            models.UniqueConstraint(
                fields=['doctor', 'weekday'],
                name='uniq_schedule_per_doctor_weekday',
            )
        ]

    def __str__(self):
        day_name = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật']
        return f'{self.doctor.full_name} - {day_name[self.weekday]}: {"Làm việc" if self.is_working else "Nghỉ"}'


class DoctorTimeOff(models.Model):
    """
    Ngày nghỉ phép / xin nghỉ cụ thể của bác sĩ.
    VD: nghỉ ngày 25/04/2026 với lý do "Nghỉ phép năm".
    """
    doctor = models.ForeignKey(
        Doctor,
        on_delete=models.CASCADE,
        related_name='time_offs',
    )
    off_date = models.DateField(help_text='Ngày nghỉ')
    reason = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['doctor', 'off_date']
        constraints = [
            models.UniqueConstraint(
                fields=['doctor', 'off_date'],
                name='uniq_timeoff_per_doctor_date',
            )
        ]

    def __str__(self):
        return f'{self.doctor.full_name} nghỉ {self.off_date}: {self.reason}'


class VisitType(models.Model):
    name = models.CharField(max_length=100)
    duration_minutes = models.PositiveIntegerField(default=25)
    price = models.DecimalField(max_digits=10, decimal_places=0, default=0)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name
