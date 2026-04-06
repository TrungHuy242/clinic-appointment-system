from datetime import datetime, timedelta

from django.test import TestCase
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from rest_framework.test import APIClient

from appointments.models import Appointment, AppointmentBlock, AppointmentStatus, AppointmentVisitType
from appointments.services import (
    OVERLAP_MESSAGE,
    PA1_EXPIRED_MESSAGE,
    create_guest_appointment,
    get_appointment_by_id_or_code,
    get_visit_type_blocks,
    set_appointment_status,
    soft_delete_appointment,
    validate_time_range,
)
from catalog.models import Doctor, Specialty


class AppointmentServiceTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.specialty = Specialty.objects.create(
            name='Cardiology',
            description='Heart care',
            is_active=True,
        )
        self.other_specialty = Specialty.objects.create(
            name='Dermatology',
            description='Skin care',
            is_active=True,
        )
        self.doctor = Doctor.objects.create(
            full_name='Dr. Nguyen',
            phone='+84901234567',
            specialty=self.specialty,
            is_active=True,
        )
        self.other_doctor = Doctor.objects.create(
            full_name='Dr. Tran',
            phone='+84901234568',
            specialty=self.other_specialty,
            is_active=True,
        )
        self.appointment_date = timezone.localdate() + timedelta(days=1)

    def slot_time(self, hour, minute=0):
        return timezone.make_aware(
            datetime.combine(self.appointment_date, datetime.min.time()).replace(hour=hour, minute=minute),
            timezone.get_current_timezone(),
        )

    def create_appointment(self, start_hour=8, start_minute=0, visit_type=AppointmentVisitType.VISIT_20, phone='+84987654321'):
        return create_guest_appointment(
            {
                'patient_full_name': 'Tran Van A',
                'patient_phone': phone,
                'specialty': self.specialty,
                'doctor': self.doctor,
                'scheduled_start': self.slot_time(start_hour, start_minute),
                'scheduled_end': self.slot_time(start_hour, start_minute) + timedelta(minutes=25),
                'visit_type': visit_type,
            }
        )

    def test_create_guest_appointment_generates_code_and_default_pending_status(self):
        appointment = self.create_appointment()

        self.assertRegex(appointment.code, rf'^APT-{timezone.now().year}-\d{{4}}$')
        self.assertEqual(appointment.status, AppointmentStatus.PENDING)
        self.assertEqual(appointment.visit_type, AppointmentVisitType.VISIT_20)
        self.assertEqual(appointment.occupied_blocks.count(), 1)

    def test_40_minute_booking_reserves_two_consecutive_blocks(self):
        appointment = self.create_appointment(visit_type=AppointmentVisitType.VISIT_40)

        self.assertEqual(appointment.scheduled_end, self.slot_time(8, 50))
        self.assertEqual(get_visit_type_blocks(appointment.visit_type), 2)
        self.assertEqual(
            list(appointment.occupied_blocks.order_by('block_index').values_list('block_index', flat=True)),
            [0, 1],
        )

    def test_validate_time_range_raises_when_end_not_after_start(self):
        start = self.slot_time(8, 0)
        with self.assertRaises(ValidationError):
            validate_time_range(start, start)

    def test_set_appointment_status_raises_for_invalid_status(self):
        appointment = self.create_appointment()

        with self.assertRaises(ValidationError):
            set_appointment_status(appointment, 'INVALID_STATUS')

    def test_get_appointment_by_id_or_code_returns_the_same_appointment(self):
        appointment = self.create_appointment()

        self.assertEqual(get_appointment_by_id_or_code(appointment.code), appointment)
        self.assertEqual(get_appointment_by_id_or_code(appointment.id), appointment)

    def test_soft_delete_appointment_hides_record_from_default_queryset_and_releases_blocks(self):
        appointment = self.create_appointment()

        soft_delete_appointment(appointment)

        deleted_appointment = Appointment.all_objects.get(pk=appointment.pk)
        self.assertTrue(deleted_appointment.is_deleted)
        self.assertFalse(Appointment.objects.filter(pk=appointment.pk).exists())
        self.assertTrue(Appointment.all_objects.filter(pk=appointment.pk).exists())
        self.assertFalse(AppointmentBlock.objects.filter(appointment=appointment).exists())

    def test_guest_api_validates_required_fields(self):
        response = self.client.post('/api/v1/public/appointments/guest/', {}, format='json')

        self.assertEqual(response.status_code, 400)
        self.assertIn('patient_full_name', response.json())

    def test_public_slots_update_by_doctor_and_date_and_mark_conflicts(self):
        self.create_appointment(phone='+84987650001')

        doctor_response = self.client.get(
            f'/api/v1/public/doctors/{self.doctor.id}/slots/',
            {'date': self.appointment_date.isoformat(), 'visit_type': AppointmentVisitType.VISIT_20},
        )
        other_doctor_response = self.client.get(
            f'/api/v1/public/doctors/{self.other_doctor.id}/slots/',
            {'date': self.appointment_date.isoformat(), 'visit_type': AppointmentVisitType.VISIT_20},
        )
        next_day_response = self.client.get(
            f'/api/v1/public/doctors/{self.doctor.id}/slots/',
            {'date': (self.appointment_date + timedelta(days=1)).isoformat(), 'visit_type': AppointmentVisitType.VISIT_20},
        )

        self.assertEqual(doctor_response.status_code, 200)
        self.assertEqual(other_doctor_response.status_code, 200)
        self.assertEqual(next_day_response.status_code, 200)
        self.assertEqual(doctor_response.json()[0]['status'], 'conflict')
        self.assertEqual(other_doctor_response.json()[0]['status'], 'available')
        self.assertEqual(next_day_response.json()[0]['status'], 'available')

    def test_40_minute_slots_require_two_consecutive_available_blocks(self):
        self.create_appointment(start_hour=8, start_minute=25, phone='+84987650002')

        response = self.client.get(
            f'/api/v1/public/doctors/{self.doctor.id}/slots/',
            {'date': self.appointment_date.isoformat(), 'visit_type': AppointmentVisitType.VISIT_40},
        )

        self.assertEqual(response.status_code, 200)
        slots = response.json()
        self.assertEqual(slots[0]['status'], 'conflict')
        self.assertEqual(slots[0]['occupies'], 2)
        self.assertEqual(slots[2]['status'], 'available')
        self.assertEqual(slots[2]['end'], '09:40')

    def test_overlapping_guest_booking_is_rejected_with_clear_error(self):
        self.create_appointment(phone='+84987650003')

        payload = {
            'patient_full_name': 'Overlap',
            'patient_phone': '+84987650004',
            'specialty': self.specialty.id,
            'doctor': self.doctor.id,
            'scheduled_start': self.slot_time(8, 0).isoformat(),
            'scheduled_end': (self.slot_time(8, 0) + timedelta(minutes=25)).isoformat(),
            'visit_type': AppointmentVisitType.VISIT_20,
        }
        response = self.client.post('/api/v1/public/appointments/guest/', payload, format='json')

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()['scheduled_start'], OVERLAP_MESSAGE)
        self.assertEqual(Appointment.objects.filter(doctor=self.doctor).count(), 1)

    def test_pa1_confirmation_respects_15_minute_window(self):
        appointment = self.create_appointment(phone='+84987650005')
        confirm_response = self.client.patch(
            f'/api/v1/public/appointments/{appointment.code}/status/',
            {'status': AppointmentStatus.CONFIRMED},
            format='json',
        )
        self.assertEqual(confirm_response.status_code, 200)
        self.assertEqual(confirm_response.json()['status'], AppointmentStatus.CONFIRMED)

        expired = self.create_appointment(start_hour=8, start_minute=25, phone='+84987650006')
        Appointment.all_objects.filter(pk=expired.pk).update(created_at=timezone.now() - timedelta(minutes=16))

        detail_response = self.client.get(f'/api/v1/public/appointments/{expired.code}/')
        self.assertEqual(detail_response.status_code, 200)
        self.assertEqual(detail_response.json()['status'], AppointmentStatus.CANCELLED)
        self.assertFalse(AppointmentBlock.objects.filter(appointment=expired).exists())

        expired_confirm_response = self.client.patch(
            f'/api/v1/public/appointments/{expired.code}/status/',
            {'status': AppointmentStatus.CONFIRMED},
            format='json',
        )
        self.assertEqual(expired_confirm_response.status_code, 400)
        self.assertEqual(expired_confirm_response.json()['status'], PA1_EXPIRED_MESSAGE)

    def test_lookup_returns_match_and_wrong_phone_is_not_found(self):
        appointment = self.create_appointment(phone='+84987650007')

        ok_response = self.client.get(
            '/api/v1/public/appointments/lookup/',
            {'code': appointment.code, 'phone': '+84987650007'},
        )
        missing_response = self.client.get(
            '/api/v1/public/appointments/lookup/',
            {'code': appointment.code, 'phone': '+84987659999'},
        )

        self.assertEqual(ok_response.status_code, 200)
        self.assertEqual(ok_response.json()['code'], appointment.code)
        self.assertIn('qr_text', ok_response.json())
        self.assertIsNotNone(ok_response.json()['expires_at'])
        self.assertEqual(missing_response.status_code, 404)

    def test_reception_can_move_checked_in_appointment_to_waiting(self):
        appointment = self.create_appointment(phone='+84987650008')
        set_appointment_status(appointment, AppointmentStatus.CHECKED_IN)

        move_response = self.client.patch(
            f'/api/v1/reception/move-to-waiting/{appointment.id}/',
            {},
            format='json',
        )
        self.assertEqual(move_response.status_code, 200)
        self.assertEqual(move_response.json()['appointment']['status'], AppointmentStatus.WAITING)

    def test_search_by_phone_returns_multiple_appointments_and_supports_optional_code_filter(self):
        first = self.create_appointment(phone='+84987651111')
        second = self.create_appointment(start_hour=8, start_minute=25, phone='+84987651111')
        other_phone = self.create_appointment(start_hour=8, start_minute=50, phone='+84987652222')

        base_url = '/api/v1/public/appointments/search-by-phone/'

        all_response = self.client.get(base_url, {'phone': '+84987651111'})
        self.assertEqual(all_response.status_code, 200)
        all_payload = all_response.json()
        self.assertEqual(len(all_payload), 2)
        self.assertCountEqual([item['code'] for item in all_payload], [first.code, second.code])

        single_response = self.client.get(
            base_url,
            {
                'phone': '+84987651111',
                'code': second.code,
            },
        )
        self.assertEqual(single_response.status_code, 200)
        single_payload = single_response.json()
        self.assertEqual(len(single_payload), 1)
        self.assertEqual(single_payload[0]['code'], second.code)

        missing_response = self.client.get(base_url, {'phone': '+84987653333'})
        self.assertEqual(missing_response.status_code, 404)
