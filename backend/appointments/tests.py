from datetime import timedelta

from django.test import TestCase
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from appointments.models import Appointment, AppointmentStatus
from appointments.services import (
    create_guest_appointment,
    get_appointment_by_id_or_code,
    set_appointment_status,
    soft_delete_appointment,
    validate_time_range,
)
from catalog.models import Doctor, Specialty


class AppointmentServiceTests(TestCase):
    def setUp(self):
        self.specialty = Specialty.objects.create(
            name='Cardiology',
            description='Heart care',
            is_active=True,
        )
        self.doctor = Doctor.objects.create(
            full_name='Dr. Nguyen',
            phone='+84901234567',
            specialty=self.specialty,
            is_active=True,
        )
        self.scheduled_start = timezone.now() + timedelta(days=1)
        self.scheduled_end = self.scheduled_start + timedelta(minutes=30)

    def create_appointment(self):
        return create_guest_appointment(
            {
                'patient_full_name': 'Tran Van A',
                'patient_phone': '+84987654321',
                'specialty': self.specialty,
                'doctor': self.doctor,
                'scheduled_start': self.scheduled_start,
                'scheduled_end': self.scheduled_end,
            }
        )

    def test_create_guest_appointment_generates_code_and_default_pending_status(self):
        appointment = self.create_appointment()

        self.assertRegex(appointment.code, rf'^APT-{timezone.now().year}-\d{{4}}$')
        self.assertEqual(appointment.status, AppointmentStatus.PENDING)

    def test_validate_time_range_raises_when_end_not_after_start(self):
        with self.assertRaises(ValidationError):
            validate_time_range(self.scheduled_start, self.scheduled_start)

    def test_set_appointment_status_raises_for_invalid_status(self):
        appointment = self.create_appointment()

        with self.assertRaises(ValidationError):
            set_appointment_status(appointment, 'INVALID_STATUS')

    def test_get_appointment_by_id_or_code_returns_the_same_appointment(self):
        appointment = self.create_appointment()

        self.assertEqual(get_appointment_by_id_or_code(appointment.code), appointment)
        self.assertEqual(get_appointment_by_id_or_code(appointment.id), appointment)

    def test_soft_delete_appointment_hides_record_from_default_queryset(self):
        appointment = self.create_appointment()

        soft_delete_appointment(appointment)

        deleted_appointment = Appointment.all_objects.get(pk=appointment.pk)
        self.assertTrue(deleted_appointment.is_deleted)
        self.assertFalse(Appointment.objects.filter(pk=appointment.pk).exists())
        self.assertTrue(Appointment.all_objects.filter(pk=appointment.pk).exists())
