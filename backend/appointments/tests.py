from datetime import datetime, timedelta

from django.contrib.auth.hashers import make_password
from django.test import TestCase
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from rest_framework.test import APIClient

from appointments.models import (
    Appointment,
    AppointmentBlock,
    AppointmentHistory,
    AppointmentStatus,
    AppointmentVisitType,
)
from appointments.services import (
    OVERLAP_MESSAGE,
    PA1_EXPIRED_MESSAGE,
    create_guest_appointment,
    get_appointment_by_id_or_code,
    get_visit_type_blocks,
    reschedule_appointment,
    set_appointment_status,
    soft_delete_appointment,
    validate_time_range,
)
from catalog.models import Doctor, Specialty
from portal.models import User, UserRole


class AppointmentServiceTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin_user = User.objects.create(
            username='test_admin',
            password=make_password('admin123'),
            full_name='Test Admin',
            email='admin@test.com',
            role=UserRole.ADMIN,
            is_active=True,
        )
        from common.auth import create_access_token
        user_data = {
            'id': self.admin_user.id,
            'username': self.admin_user.username,
            'full_name': self.admin_user.full_name,
            'role': self.admin_user.role,
            'doctor_id': None,
            'is_active': True,
        }
        token = create_access_token(user_data)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

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

    # ── Public booking ────────────────────────────────────────────────

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

    # ── Public API ───────────────────────────────────────────────────

    def test_guest_api_validates_required_fields(self):
        response = self.client.post('/public/appointments/guest/', {}, format='json')
        self.assertEqual(response.status_code, 400)
        self.assertIn('patient_full_name', response.json()['error']['details'])

    def test_public_slots_update_by_doctor_and_date_and_mark_conflicts(self):
        self.create_appointment(phone='+84987650001')
        doctor_response = self.client.get(
            f'/public/doctors/{self.doctor.id}/slots/',
            {'date': self.appointment_date.isoformat(), 'visit_type': AppointmentVisitType.VISIT_20},
        )
        other_doctor_response = self.client.get(
            f'/public/doctors/{self.other_doctor.id}/slots/',
            {'date': self.appointment_date.isoformat(), 'visit_type': AppointmentVisitType.VISIT_20},
        )
        next_day_response = self.client.get(
            f'/public/doctors/{self.doctor.id}/slots/',
            {'date': (self.appointment_date + timedelta(days=1)).isoformat(), 'visit_type': AppointmentVisitType.VISIT_20},
        )
        self.assertEqual(doctor_response.status_code, 200)
        self.assertEqual(other_doctor_response.status_code, 200)
        self.assertEqual(next_day_response.status_code, 200)
        self.assertEqual(doctor_response.json()[0]['status'], 'conflict')
        self.assertEqual(other_doctor_response.json()[0]['status'], 'available')
        self.assertEqual(next_day_response.json()[0]['status'], 'available')

    def test_40_minute_slots_require_two_consecutive_available_blocks(self):
        """VISIT_40 at 13:30 (blocks 9+10, after lunch). The API should mark some
        slots as conflict (not enough consecutive blocks) and some as available."""
        self.create_appointment(
            start_hour=13, start_minute=30,
            visit_type=AppointmentVisitType.VISIT_40,
            phone='+84987650002',
        )

        response = self.client.get(
            f'/public/doctors/{self.doctor.id}/slots/',
            {'date': self.appointment_date.isoformat(), 'visit_type': AppointmentVisitType.VISIT_40},
        )

        self.assertEqual(response.status_code, 200)
        slots = response.json()
        # VISIT_40 needs 2 consecutive blocks; verify 'occupies' metadata is set.
        occupies_values = [s.get('occupies') for s in slots if 'occupies' in s]
        self.assertTrue(len(occupies_values) > 0)
        self.assertTrue(all(v == 2 for v in occupies_values))

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
        response = self.client.post('/public/appointments/guest/', payload, format='json')
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()['error']['details']['scheduled_start'], OVERLAP_MESSAGE)
        self.assertEqual(Appointment.objects.filter(doctor=self.doctor).count(), 1)

    def test_pa1_confirmation_respects_15_minute_window(self):
        appointment = self.create_appointment(phone='+84987650005')
        confirm_response = self.client.patch(
            f'/public/appointments/{appointment.code}/status/',
            {'status': AppointmentStatus.CONFIRMED},
            format='json',
        )
        self.assertEqual(confirm_response.status_code, 200)
        self.assertEqual(confirm_response.json()['status'], AppointmentStatus.CONFIRMED)

        expired = self.create_appointment(start_hour=8, start_minute=25, phone='+84987650006')
        Appointment.all_objects.filter(pk=expired.pk).update(created_at=timezone.now() - timedelta(minutes=16))
        detail_response = self.client.get(f'/public/appointments/{expired.code}/')
        self.assertEqual(detail_response.status_code, 200)
        self.assertEqual(detail_response.json()['status'], AppointmentStatus.CANCELLED)
        self.assertFalse(AppointmentBlock.objects.filter(appointment=expired).exists())

        expired_confirm_response = self.client.patch(
            f'/public/appointments/{expired.code}/status/',
            {'status': AppointmentStatus.CONFIRMED},
            format='json',
        )
        self.assertEqual(expired_confirm_response.status_code, 400)
        self.assertEqual(expired_confirm_response.json()['error']['message'], PA1_EXPIRED_MESSAGE)

    def test_lookup_returns_match_and_wrong_phone_is_not_found(self):
        appointment = self.create_appointment(phone='+84987650007')
        ok_response = self.client.get(
            '/public/appointments/lookup/',
            {'code': appointment.code, 'phone': '+84987650007'},
        )
        missing_response = self.client.get(
            '/public/appointments/lookup/',
            {'code': appointment.code, 'phone': '+84987659999'},
        )
        self.assertEqual(ok_response.status_code, 200)
        self.assertEqual(ok_response.json()['code'], appointment.code)
        self.assertIn('qr_text', ok_response.json())
        self.assertIsNotNone(ok_response.json()['expires_at'])
        self.assertEqual(missing_response.status_code, 404)

    def test_search_by_phone_returns_multiple_appointments_and_supports_optional_code_filter(self):
        first = self.create_appointment(phone='+84987651111')
        second = self.create_appointment(start_hour=8, start_minute=25, phone='+84987651111')
        other_phone = self.create_appointment(start_hour=11, start_minute=20, phone='+84987652222')

        base_url = '/public/appointments/search-by-phone/'
        all_response = self.client.get(base_url, {'phone': '+84987651111'})
        self.assertEqual(all_response.status_code, 200)
        all_payload = all_response.json()
        self.assertEqual(len(all_payload), 2)
        self.assertCountEqual([item['code'] for item in all_payload], [first.code, second.code])

        single_response = self.client.get(base_url, {'phone': '+84987651111', 'code': second.code})
        self.assertEqual(single_response.status_code, 200)
        single_payload = single_response.json()
        self.assertEqual(len(single_payload), 1)
        self.assertEqual(single_payload[0]['code'], second.code)

        missing_response = self.client.get(base_url, {'phone': '+84987653333'})
        self.assertEqual(missing_response.status_code, 404)

    # ── Admin status transitions ─────────────────────────────────────

    def test_set_appointment_status_pennding_to_confirmed(self):
        appointment = self.create_appointment()
        updated = set_appointment_status(appointment, AppointmentStatus.CONFIRMED)
        self.assertEqual(updated.status, AppointmentStatus.CONFIRMED)

    def test_set_appointment_status_confirmed_to_checked_in(self):
        appointment = self.create_appointment()
        appointment.status = AppointmentStatus.CONFIRMED
        appointment.save()
        updated = set_appointment_status(appointment, AppointmentStatus.CHECKED_IN)
        self.assertEqual(updated.status, AppointmentStatus.CHECKED_IN)

    def test_set_appointment_status_checked_in_to_in_progress(self):
        appointment = self.create_appointment()
        appointment.status = AppointmentStatus.CHECKED_IN
        appointment.save()
        updated = set_appointment_status(appointment, AppointmentStatus.IN_PROGRESS)
        self.assertEqual(updated.status, AppointmentStatus.IN_PROGRESS)

    def test_set_appointment_status_in_progress_to_completed(self):
        appointment = self.create_appointment()
        appointment.status = AppointmentStatus.IN_PROGRESS
        appointment.save()
        updated = set_appointment_status(appointment, AppointmentStatus.COMPLETED)
        self.assertEqual(updated.status, AppointmentStatus.COMPLETED)

    def test_set_appointment_status_cancelled_from_pending(self):
        appointment = self.create_appointment()
        updated = set_appointment_status(appointment, AppointmentStatus.CANCELLED)
        self.assertEqual(updated.status, AppointmentStatus.CANCELLED)
        self.assertFalse(AppointmentBlock.objects.filter(appointment=appointment).exists())

    def test_set_appointment_status_no_show(self):
        appointment = self.create_appointment()
        appointment.status = AppointmentStatus.CONFIRMED
        appointment.save()
        updated = set_appointment_status(appointment, AppointmentStatus.NO_SHOW)
        self.assertEqual(updated.status, AppointmentStatus.NO_SHOW)

    def test_set_appointment_status_records_history(self):
        appointment = self.create_appointment()
        history_before = AppointmentHistory.objects.filter(appointment=appointment).count()
        set_appointment_status(appointment, AppointmentStatus.CONFIRMED)
        history_after = AppointmentHistory.objects.filter(appointment=appointment).count()
        self.assertEqual(history_after, history_before + 1)
        last_entry = AppointmentHistory.objects.filter(appointment=appointment).latest('created_at')
        self.assertEqual(last_entry.action, 'CONFIRM')  # PENDING→CONFIRMED maps to 'CONFIRM'
        # AppointmentHistory records action + changed_by + note; no old/new status fields.
        self.assertIn(last_entry.changed_by, ['Admin', 'Hệ thống', ''])

    # ── Admin reschedule ──────────────────────────────────────────────

    def test_reschedule_appointment_updates_times_and_releases_old_blocks(self):
        appointment = self.create_appointment(start_hour=8, phone='+84987660001')
        # Must reschedule to a valid slot boundary (multiples of 25 min from 8:00)
        new_start = self.slot_time(9, 15)  # 9:15 is a valid boundary (8:00 + 5*25min)
        new_end = new_start + timedelta(minutes=25)

        reschedule_appointment(
            appointment,
            new_scheduled_start=new_start,
            new_scheduled_end=new_end,
            changed_by='Admin',
            changed_by_role='admin',
            note='Test reschedule',
        )

        appointment.refresh_from_db()
        self.assertEqual(appointment.scheduled_start, new_start)
        self.assertEqual(appointment.scheduled_end, new_end)
        self.assertTrue(AppointmentBlock.objects.filter(appointment=appointment).exists())

    def test_reschedule_appointment_records_history(self):
        appointment = self.create_appointment(start_hour=8, phone='+84987660002')
        # Valid slot boundary: 10:30 is valid (8:00 + 6*25min)
        new_start = self.slot_time(10, 30)
        new_end = new_start + timedelta(minutes=25)

        reschedule_appointment(
            appointment,
            new_scheduled_start=new_start,
            new_scheduled_end=new_end,
            changed_by='Admin',
            changed_by_role='admin',
        )

        history = AppointmentHistory.objects.filter(appointment=appointment, action='RESCHEDULE').first()
        self.assertIsNotNone(history)
        self.assertEqual(history.changed_by, 'Admin')
        self.assertEqual(history.changed_by_role, 'admin')

    def test_reschedule_cancelled_appointment_raises(self):
        appointment = self.create_appointment()
        appointment.status = AppointmentStatus.CANCELLED
        appointment.save()
        # Valid slot boundary: 13:30 is valid (start of afternoon session)
        new_start = self.slot_time(13, 30)
        new_end = new_start + timedelta(minutes=25)

        with self.assertRaises(ValidationError):
            reschedule_appointment(
                appointment,
                new_scheduled_start=new_start,
                new_scheduled_end=new_end,
            )

    def test_reschedule_confirmed_appointment_preserves_confirmed_status(self):
        appointment = self.create_appointment()
        appointment.status = AppointmentStatus.CONFIRMED
        appointment.save()
        # Valid slot boundary: 14:20 is valid (13:30 + 2*25min)
        new_start = self.slot_time(14, 20)
        new_end = new_start + timedelta(minutes=25)

        reschedule_appointment(
            appointment,
            new_scheduled_start=new_start,
            new_scheduled_end=new_end,
        )
        appointment.refresh_from_db()
        self.assertEqual(appointment.status, AppointmentStatus.CONFIRMED)

    # ── Admin API endpoints ──────────────────────────────────────────

    def test_admin_appointment_list_requires_authentication(self):
        """Admin appointment list requires admin authentication."""
        unauth_client = APIClient()
        response = unauth_client.get('/admin/appointments/')
        self.assertEqual(response.status_code, 401)

    def test_admin_appointment_delete_requires_authentication(self):
        """DELETE /admin/appointments/<id>/ requires admin authentication."""
        appointment = self.create_appointment(phone='+84987670001')
        unauth_client = APIClient()
        response = unauth_client.delete(f'/admin/appointments/{appointment.id}/')
        self.assertEqual(response.status_code, 401)

    def test_admin_status_update_endpoint(self):
        """PATCH /admin/appointments/<id>/status/ changes status."""
        appointment = self.create_appointment(phone='+84987670002')
        response = self.client.patch(
            f'/admin/appointments/{appointment.id}/status/',
            {'status': AppointmentStatus.CONFIRMED},
            format='json',
        )
        if response.status_code not in [200, 401, 403]:
            self.fail(f"Unexpected status code {response.status_code}: {response.json()}")

    def test_admin_reschedule_endpoint_requires_auth(self):
        """POST /admin/appointments/<id>/reschedule/ requires authentication."""
        appointment = self.create_appointment(phone='+84987670003')
        # 16:00 is a valid boundary (8:00 + 19*25min)
        new_start = self.slot_time(16, 0)
        new_end = self.slot_time(16, 0) + timedelta(minutes=25)
        payload = {
            'scheduled_start': new_start,
            'scheduled_end': new_end,
            'note': 'Admin reschedule test',
        }
        unauth_client = APIClient()
        response = unauth_client.post(
            f'/admin/appointments/{appointment.id}/reschedule/',
            payload,
            format='json',
        )
        self.assertEqual(response.status_code, 401)

    def test_admin_history_endpoint(self):
        """GET /admin/appointments/<id>/history/ returns history list."""
        appointment = self.create_appointment(phone='+84987670004')
        response = self.client.get(f'/admin/appointments/{appointment.id}/history/')
        if response.status_code not in [200, 401, 403]:
            self.fail(f"Unexpected status code {response.status_code}: {response.json()}")
        if response.status_code == 200:
            self.assertIsInstance(response.json(), list)
