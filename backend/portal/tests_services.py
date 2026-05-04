"""
Unit tests for portal services using pytest style.
"""
import pytest
from datetime import timedelta
from django.utils import timezone
from django.contrib.auth.hashers import check_password
from rest_framework.exceptions import ValidationError

from portal.models import PatientProfile, PatientNotification
from portal.services import (
    normalize_text, validate_phone, PHONE_PATTERN,
    unified_login, register_patient_account,
    get_health_profile, update_health_profile,
    get_account_info, update_account_info, change_password,
    send_otp, verify_otp,
    forgot_password_send_otp, forgot_password_reset,
    PATIENT_STATUS_MAP,
)


class TestUtilityFunctions:
    def test_normalize_text(self):
        assert normalize_text('  Hello   WORLD  ') == 'hello world'
        assert normalize_text('') == ''
        assert normalize_text(None) == ''

    def test_validate_phone_valid(self):
        assert validate_phone('0912345678') == '0912345678'

    def test_validate_phone_strips_whitespace(self):
        assert validate_phone('  0912345678  ') == '0912345678'

    def test_validate_phone_invalid_short(self):
        with pytest.raises(ValidationError) as ctx:
            validate_phone('09123')
        assert 'phone' in ctx.value.detail

    def test_validate_phone_invalid_format(self):
        with pytest.raises(ValidationError):
            validate_phone('1234567890')
        with pytest.raises(ValidationError):
            validate_phone('abcdefghij')

    def test_validate_phone_empty(self):
        with pytest.raises(ValidationError):
            validate_phone('')
        with pytest.raises(ValidationError):
            validate_phone(None)

    def test_phone_pattern_valid(self):
        assert PHONE_PATTERN.match('0912345678')
        assert PHONE_PATTERN.match('0987654321')

    def test_phone_pattern_invalid(self):
        assert not PHONE_PATTERN.match('091234567')   # 9 digits
        assert not PHONE_PATTERN.match('09123456789')  # 11 digits


@pytest.mark.django_db
class TestUnifiedLogin:
    def test_login_patient_with_phone(self, patient_profile):
        result = unified_login({
            'phone': '0909123456',
            'password': 'patient123',
        })
        assert result['success'] is True
        assert result['role'] == 'patient'
        assert 'access_token' in result
        assert 'refresh_token' in result

    def test_login_patient_with_username(self, patient_profile):
        result = unified_login({
            'identifier': 'patient1',
            'password': 'patient123',
        })
        assert result['success'] is True
        assert result['role'] == 'patient'

    def test_login_staff_with_username(self, admin_user):
        result = unified_login({
            'identifier': 'test_admin',
            'password': 'admin123',
        })
        assert result['success'] is True
        assert result['role'] == 'admin'

    def test_login_wrong_password_returns_error(self, patient_profile):
        with pytest.raises(ValidationError) as ctx:
            unified_login({
                'phone': '0909123456',
                'password': 'wrongpassword',
            })
        assert 'non_field_errors' in ctx.value.detail

    def test_login_nonexistent_user_returns_error(self):
        with pytest.raises(ValidationError) as ctx:
            unified_login({
                'phone': '0999999999',
                'password': 'anypassword',
            })
        assert 'non_field_errors' in ctx.value.detail

    def test_login_missing_identifier(self):
        with pytest.raises(ValidationError) as ctx:
            unified_login({'password': 'test'})
        assert 'identifier' in ctx.value.detail

    def test_login_missing_password(self):
        with pytest.raises(ValidationError) as ctx:
            unified_login({'identifier': 'test'})
        assert 'password' in ctx.value.detail


@pytest.mark.django_db
class TestRegisterPatientAccount:
    def test_register_new_patient(self):
        result = register_patient_account({
            'name': 'New Patient',
            'phone': '0909111001',
            'password': 'securepass',
            'email': 'new@email.com',
            'gender': 'female',
        })
        assert result['success'] is True
        assert 'account' in result
        assert PatientProfile.objects.filter(phone='0909111001').exists()
        profile = PatientProfile.objects.get(phone='0909111001')
        assert profile.full_name == 'New Patient'
        assert profile.gender == 'female'

    def test_register_existing_phone_updates_profile(self, patient_profile):
        result = register_patient_account({
            'name': 'Updated Name',
            'phone': '0909123456',
            'password': 'newpass',
        })
        assert result['success'] is True
        patient_profile.refresh_from_db()
        assert patient_profile.full_name == 'Updated Name'

    def test_register_short_password_fails(self):
        with pytest.raises(ValidationError) as ctx:
            register_patient_account({
                'name': 'Test',
                'phone': '0909111002',
                'password': '12345',
            })
        assert 'password' in ctx.value.detail

    def test_register_missing_name_fails(self):
        with pytest.raises(ValidationError) as ctx:
            register_patient_account({
                'phone': '0909111003',
                'password': 'password123',
            })
        assert 'name' in ctx.value.detail

    def test_register_invalid_phone_fails(self):
        with pytest.raises(ValidationError):
            register_patient_account({
                'name': 'Test',
                'phone': '12345',
                'password': 'password123',
            })


@pytest.mark.django_db
class TestHealthProfile:
    def test_get_health_profile(self, patient_profile):
        from datetime import date
        patient_profile.dob = date(1990, 1, 1)
        patient_profile.gender = 'male'
        patient_profile.allergies = 'Penicillin'
        patient_profile.emergency_name = 'Emergency Contact'
        patient_profile.emergency_phone = '0912345678'
        patient_profile.save()

        result = get_health_profile(patient_profile)
        assert result['name'] == 'Nguyen Van Patient'
        assert result['gender'] == 'male'
        assert result['allergies'] == 'Penicillin'
        assert result['emergency']['name'] == 'Emergency Contact'

    def test_update_health_profile(self, patient_profile):
        result = update_health_profile(patient_profile, {
            'name': 'Updated Patient',
            'phone': '0909123456',
            'dob': '1990-01-01',
            'gender': 'female',
            'allergies': 'Aspirin',
            'emergency': {
                'name': 'Emergency Person',
                'phone': '0909111222',
            },
        })
        patient_profile.refresh_from_db()
        assert patient_profile.full_name == 'Updated Patient'
        assert patient_profile.gender == 'female'
        assert patient_profile.allergies == 'Aspirin'


@pytest.mark.django_db
class TestAccountInfo:
    def test_get_account_info(self, patient_profile):
        result = get_account_info(patient_profile)
        assert result['username'] == 'patient1'
        assert result['email'] == 'patient@test.com'
        assert result['name'] == 'Nguyen Van Patient'

    def test_update_account_info(self, patient_profile):
        result = update_account_info(patient_profile, {
            'name': 'Renamed Patient',
            'email': 'newemail@test.com',
        })
        patient_profile.refresh_from_db()
        assert patient_profile.full_name == 'Renamed Patient'
        assert patient_profile.account_email == 'newemail@test.com'


@pytest.mark.django_db
class TestChangePassword:
    def test_change_password_success(self, patient_profile):
        result = change_password(patient_profile, {
            'currentPassword': 'patient123',
            'newPassword': 'newpassword456',
            'confirmPassword': 'newpassword456',
        })
        assert result['success'] is True
        patient_profile.refresh_from_db()
        assert check_password('newpassword456', patient_profile.account_password)

    def test_change_password_wrong_current(self, patient_profile):
        with pytest.raises(ValidationError) as ctx:
            change_password(patient_profile, {
                'currentPassword': 'wrongpassword',
                'newPassword': 'newpass123',
                'confirmPassword': 'newpass123',
            })
        assert 'currentPassword' in ctx.value.detail

    def test_change_password_mismatch(self, patient_profile):
        with pytest.raises(ValidationError) as ctx:
            change_password(patient_profile, {
                'currentPassword': 'patient123',
                'newPassword': 'newpass123',
                'confirmPassword': 'differentpass',
            })
        assert 'confirmPassword' in ctx.value.detail

    def test_change_password_too_short(self, patient_profile):
        with pytest.raises(ValidationError) as ctx:
            change_password(patient_profile, {
                'currentPassword': 'patient123',
                'newPassword': '12345',
                'confirmPassword': '12345',
            })
        assert 'newPassword' in ctx.value.detail


@pytest.mark.django_db
class TestOTPServices:
    def test_send_otp_existing_patient(self, patient_profile):
        result = send_otp({'phone': '0909123456'})
        assert result['success'] is True
        assert 'otp_code_dev' in result
        assert 'expires_in' in result
        patient_profile.refresh_from_db()
        assert patient_profile.otp_code != ''

    def test_send_otp_nonexistent_patient(self):
        with pytest.raises(ValidationError) as ctx:
            send_otp({'phone': '0999999999'})
        assert 'phone' in ctx.value.detail

    def test_verify_otp_valid(self, patient_profile):
        patient_profile.otp_code = '123456'
        patient_profile.otp_created_at = timezone.now()
        patient_profile.save()

        result = verify_otp({
            'phone': '0909123456',
            'otp_code': '123456',
        })
        assert result['success'] is True
        assert result['role'] == 'patient'
        patient_profile.refresh_from_db()
        assert patient_profile.otp_code == ''

    def test_verify_otp_invalid_code(self, patient_profile):
        patient_profile.otp_code = '123456'
        patient_profile.otp_created_at = timezone.now()
        patient_profile.save()

        with pytest.raises(ValidationError) as ctx:
            verify_otp({'phone': '0909123456', 'otp_code': '999999'})
        assert 'otp_code' in ctx.value.detail

    def test_verify_otp_expired(self, patient_profile):
        patient_profile.otp_code = '123456'
        patient_profile.otp_created_at = timezone.now() - timedelta(minutes=10)
        patient_profile.save()

        with pytest.raises(ValidationError) as ctx:
            verify_otp({'phone': '0909123456', 'otp_code': '123456'})
        assert 'otp_code' in ctx.value.detail

    def test_forgot_password_send_otp(self, patient_profile):
        result = forgot_password_send_otp({'phone': '0909123456'})
        assert result['success'] is True
        assert 'otp_code_dev' in result
        patient_profile.refresh_from_db()
        assert patient_profile.otp_reset_token != ''


@pytest.mark.django_db
class TestForgotPasswordReset:
    def test_reset_password_with_valid_otp(self, patient_profile):
        patient_profile.otp_reset_token = '654321'
        patient_profile.otp_created_at = timezone.now()
        patient_profile.otp_reset_verified = True
        patient_profile.save()

        result = forgot_password_reset({
            'phone': '0909123456',
            'otp_code': '654321',
            'newPassword': 'resetpass123',
            'confirmPassword': 'resetpass123',
        })
        assert result['success'] is True
        patient_profile.refresh_from_db()
        assert check_password('resetpass123', patient_profile.account_password)
        assert patient_profile.otp_reset_verified is False

    def test_reset_password_unverified_otp_fails(self, patient_profile):
        patient_profile.otp_reset_token = '654321'
        patient_profile.otp_created_at = timezone.now()
        patient_profile.save()

        with pytest.raises(ValidationError) as ctx:
            forgot_password_reset({
                'phone': '0909123456',
                'otp_code': '654321',
                'newPassword': 'newpass',
                'confirmPassword': 'newpass',
            })
        assert 'otp_code' in ctx.value.detail


class TestPatientStatusMap:
    def test_status_map_covers_all_appointment_statuses(self):
        from appointments.models import AppointmentStatus
        for status in AppointmentStatus:
            assert status in PATIENT_STATUS_MAP, f"Status {status} not in PATIENT_STATUS_MAP"

    def test_status_map_returns_tuple(self):
        for status, value in PATIENT_STATUS_MAP.items():
            assert isinstance(value, tuple)
            assert len(value) == 2
