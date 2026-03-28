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
