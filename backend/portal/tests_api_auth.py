"""
Integration tests for public authentication endpoints using pytest style.
"""
from datetime import timedelta

import pytest
from django.utils import timezone

from portal.models import PatientProfile
from appointments.services import create_guest_appointment


@pytest.mark.django_db
class TestPublicLoginAPI:
    def test_login_patient_success(self, patient_profile, api_client):
        result = api_client.post('/auth/login/', {
            'identifier': '0909123456',
            'password': 'patient123',
        }, format='json')
        assert result.status_code == 200
        assert result.data['success'] is True
        assert result.data['role'] == 'patient'

    def test_login_staff_success(self, admin_user, api_client):
        result = api_client.post('/auth/login/', {
            'identifier': 'test_admin',
            'password': 'admin123',
        }, format='json')
        assert result.status_code == 200
        assert result.data['success'] is True
        assert result.data['role'] == 'admin'

    def test_login_wrong_password(self, patient_profile, api_client):
        result = api_client.post('/auth/login/', {
            'identifier': '0909123456',
            'password': 'wrongpassword',
        }, format='json')
        assert result.status_code == 400

    def test_login_nonexistent_user(self, api_client):
        result = api_client.post('/auth/login/', {
            'identifier': 'nonexistent',
            'password': 'anypassword',
        }, format='json')
        assert result.status_code == 400

    def test_login_missing_fields(self, api_client):
        result = api_client.post('/auth/login/', {}, format='json')
        assert result.status_code == 400


@pytest.mark.django_db
class TestPublicRegisterAPI:
    def test_register_new_patient(self, api_client):
        result = api_client.post('/patient/auth/register/', {
            'name': 'Brand New Patient',
            'phone': '0909111999',
            'password': 'securepass123',
        }, format='json')
        assert result.status_code == 200
        assert result.data['success'] is True
        assert PatientProfile.objects.filter(phone='0909111999').exists()

    def test_register_duplicate_phone_updates(self, patient_profile, api_client):
        result = api_client.post('/patient/auth/register/', {
            'name': 'Updated Name',
            'phone': '0909123456',
            'password': 'newpass456',
        }, format='json')
        assert result.status_code == 200
        patient_profile.refresh_from_db()
        assert patient_profile.full_name == 'Updated Name'

    def test_register_invalid_phone(self, api_client):
        result = api_client.post('/patient/auth/register/', {
            'name': 'Test',
            'phone': '12345',
            'password': 'password123',
        }, format='json')
        assert result.status_code == 400

    def test_register_short_password(self, api_client):
        result = api_client.post('/patient/auth/register/', {
            'name': 'Test',
            'phone': '0909111998',
            'password': '12345',
        }, format='json')
        assert result.status_code == 400


@pytest.mark.django_db
class TestPublicOTPAPI:
    def test_send_otp_success(self, patient_profile, api_client):
        result = api_client.post('/patient/auth/send-otp/', {
            'phone': '0909123456',
        }, format='json')
        assert result.status_code == 200
        assert result.data['success'] is True
        assert 'otp_code_dev' in result.data

    def test_send_otp_nonexistent_phone(self, api_client):
        result = api_client.post('/patient/auth/send-otp/', {
            'phone': '0999999999',
        }, format='json')
        assert result.status_code == 400

    def test_verify_otp_success(self, patient_profile, api_client):
        patient_profile.otp_code = '555444'
        patient_profile.otp_created_at = timezone.now()
        patient_profile.save()

        result = api_client.post('/patient/auth/verify-otp/', {
            'phone': '0909123456',
            'otp_code': '555444',
        }, format='json')
        assert result.status_code == 200
        assert result.data['success'] is True

    def test_verify_otp_wrong_code(self, patient_profile, api_client):
        patient_profile.otp_code = '555444'
        patient_profile.otp_created_at = timezone.now()
        patient_profile.save()

        result = api_client.post('/patient/auth/verify-otp/', {
            'phone': '0909123456',
            'otp_code': '999999',
        }, format='json')
        assert result.status_code == 400


@pytest.mark.django_db
class TestForgotPasswordAPI:
    def test_forgot_password_send_otp(self, patient_profile, api_client):
        result = api_client.post('/patient/auth/forgot-password/send-otp/', {
            'phone': '0909123456',
        }, format='json')
        assert result.status_code == 200
        assert result.data['success'] is True

    def test_forgot_password_reset(self, patient_profile, api_client):
        patient_profile.otp_reset_token = '777888'
        patient_profile.otp_created_at = timezone.now()
        patient_profile.otp_reset_verified = True
        patient_profile.save()

        result = api_client.post('/patient/auth/forgot-password/reset/', {
            'phone': '0909123456',
            'otp_code': '777888',
            'newPassword': 'resetpassword123',
            'confirmPassword': 'resetpassword123',
        }, format='json')
        assert result.status_code == 200
        assert result.data['success'] is True


@pytest.mark.django_db
class TestPublicAppointmentLookupAPI:
    def test_lookup_appointment(self, api_client, doctor, specialty, slot_8am):
        apt = create_guest_appointment({
            'patient_full_name': 'Lookup Patient',
            'patient_phone': '0909888777',
            'specialty': specialty,
            'doctor': doctor,
            'scheduled_start': slot_8am,
            'scheduled_end': slot_8am + timedelta(minutes=25),
            'visit_type': 'VISIT_20',
        })

        result = api_client.get('/public/appointments/lookup/', {
            'code': apt.code,
            'phone': '0909888777',
        })
        assert result.status_code == 200
        assert result.data['code'] == apt.code

    def test_lookup_wrong_phone(self, api_client, doctor, specialty, slot_8am):
        apt = create_guest_appointment({
            'patient_full_name': 'Lookup Patient',
            'patient_phone': '0909888777',
            'specialty': specialty,
            'doctor': doctor,
            'scheduled_start': slot_8am,
            'scheduled_end': slot_8am + timedelta(minutes=25),
            'visit_type': 'VISIT_20',
        })

        result = api_client.get('/public/appointments/lookup/', {
            'code': apt.code,
            'phone': '0999999999',
        })
        assert result.status_code == 404
