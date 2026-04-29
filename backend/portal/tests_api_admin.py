"""
Integration tests for admin portal API endpoints using pytest style.
Tests API endpoints with proper authentication and error handling.

NOTE: The custom exception handler in common/auth.py wraps all DRF errors into
the format: {"success": false, "error": {"code": "...", "message": "...", "details": {...}}}
Therefore assertion checks look for status_code on the response, not in response.data.
"""
import pytest

from portal.models import AdminAuditLog, PatientProfile


@pytest.mark.django_db
class TestAdminDashboardAPI:
    def test_get_dashboard_authenticated(self, api_client_authenticated, admin_user):
        result = api_client_authenticated.get('/admin/dashboard/')
        assert result.status_code == 200
        assert 'statCards' in result.data
        assert 'recentAppointments' in result.data
        assert 'alerts' in result.data

    def test_get_dashboard_unauthenticated(self, api_client):
        result = api_client.get('/admin/dashboard/')
        assert result.status_code == 401

    def test_get_dashboard_non_admin_forbidden(self, api_client_receptionist, receptionist_user):
        result = api_client_receptionist.get('/admin/dashboard/')
        assert result.status_code == 403


@pytest.mark.django_db
class TestAdminPatientProfilesAPI:
    def test_list_patient_profiles_authenticated(self, api_client_authenticated, admin_user, patient_profile):
        result = api_client_authenticated.get('/admin/patient-profiles/')
        assert result.status_code == 200
        assert len(result.data) >= 1

    def test_list_patient_profiles_unauthenticated(self, api_client):
        result = api_client.get('/admin/patient-profiles/')
        assert result.status_code == 401

    def test_delete_patient_profile(self, api_client_authenticated, admin_user, patient_profile):
        profile_id = patient_profile.id
        result = api_client_authenticated.delete(f'/admin/patient-profiles/{profile_id}/')
        assert result.status_code == 204
        assert not PatientProfile.objects.filter(id=profile_id).exists()

    def test_reset_patient_password_valid(self, api_client_authenticated, admin_user, patient_profile):
        result = api_client_authenticated.post(
            f'/admin/patient-profiles/{patient_profile.id}/reset-password/',
            {'new_password': 'adminreset123'},
            format='json'
        )
        assert result.status_code == 200
        assert result.data.get('success') is True

    def test_reset_patient_password_short(self, api_client_authenticated, admin_user, patient_profile):
        result = api_client_authenticated.post(
            f'/admin/patient-profiles/{patient_profile.id}/reset-password/',
            {'new_password': '12345'},
            format='json'
        )
        assert result.status_code == 400

    def test_delete_nonexistent_profile(self, api_client_authenticated, admin_user):
        result = api_client_authenticated.delete('/admin/patient-profiles/99999/')
        assert result.status_code in (404, 400)


@pytest.mark.django_db
class TestAdminReceptionistProfilesAPI:
    def test_list_receptionists(self, api_client_authenticated, admin_user, receptionist_user):
        result = api_client_authenticated.get('/admin/receptionist-profiles/')
        assert result.status_code == 200
        assert len(result.data) >= 1

    def test_create_receptionist_valid(self, api_client_authenticated, admin_user):
        result = api_client_authenticated.post('/admin/receptionist-profiles/', {
            'username': 'new_reception',
            'password': 'securepass123',
            'full_name': 'New Receptionist',
            'email': 'new@clinic.com',
        }, format='json')
        assert result.status_code == 201
        assert result.data['username'] == 'new_reception'

    def test_create_receptionist_duplicate_username(self, api_client_authenticated, admin_user, receptionist_user):
        result = api_client_authenticated.post('/admin/receptionist-profiles/', {
            'username': 'test_reception',
            'password': 'pass123456',
            'full_name': 'Duplicate',
        }, format='json')
        assert result.status_code == 400

    def test_create_receptionist_short_password(self, api_client_authenticated, admin_user):
        result = api_client_authenticated.post('/admin/receptionist-profiles/', {
            'username': 'short_pass_test',
            'password': '12345',
            'full_name': 'Short Pass Test',
        }, format='json')
        assert result.status_code == 400

    def test_update_receptionist(self, api_client_authenticated, admin_user, receptionist_user):
        result = api_client_authenticated.patch(
            f'/admin/receptionist-profiles/{receptionist_user.id}/',
            {'full_name': 'Updated Receptionist', 'email': 'updated@clinic.com'},
            format='json'
        )
        assert result.status_code == 200
        receptionist_user.refresh_from_db()
        assert receptionist_user.full_name == 'Updated Receptionist'

    def test_delete_receptionist(self, api_client_authenticated, admin_user, receptionist_user):
        user_id = receptionist_user.id
        result = api_client_authenticated.delete(f'/admin/receptionist-profiles/{user_id}/')
        assert result.status_code == 204

    def test_reset_receptionist_password(self, api_client_authenticated, admin_user, receptionist_user):
        result = api_client_authenticated.post(
            f'/admin/receptionist-profiles/{receptionist_user.id}/reset-password/',
            {'new_password': 'adminreset999'},
            format='json'
        )
        assert result.status_code == 200


@pytest.mark.django_db
class TestAdminDoctorDetailAPI:
    def test_get_doctor_detail(self, api_client_authenticated, admin_user, doctor):
        result = api_client_authenticated.get(f'/admin/doctor-detail/{doctor.id}/')
        assert result.status_code == 200
        assert 'full_name' in result.data
        assert 'stats' in result.data

    def test_get_nonexistent_doctor(self, api_client_authenticated, admin_user):
        result = api_client_authenticated.get('/admin/doctor-detail/99999/')
        assert result.status_code == 400


@pytest.mark.django_db
class TestAdminAuditLogsAPI:
    def test_get_audit_logs(self, api_client_authenticated, admin_user):
        result = api_client_authenticated.get('/admin/audit-logs/')
        assert result.status_code == 200
        assert 'items' in result.data
        assert 'stats' in result.data

    def test_audit_log_after_create(self, api_client_authenticated, admin_user):
        count_before = AdminAuditLog.objects.count()
        api_client_authenticated.post('/admin/receptionist-profiles/', {
            'username': 'audit_test_reception',
            'password': 'pass123456',
            'full_name': 'Audit Test Receptionist',
        }, format='json')
        count_after = AdminAuditLog.objects.count()
        assert count_after > count_before


@pytest.mark.django_db
class TestAdminReportsAPI:
    def test_get_reports_year(self, api_client_authenticated, admin_user):
        result = api_client_authenticated.get('/admin/reports/')
        assert result.status_code == 200
        assert result.data['period'] == 'year'
        assert 'labels' in result.data
        assert 'kpis' in result.data

    def test_get_reports_week(self, api_client_authenticated, admin_user):
        result = api_client_authenticated.get('/admin/reports/', {'period': 'week'})
        assert result.status_code == 200
        assert result.data['period'] == 'week'

    def test_get_reports_month(self, api_client_authenticated, admin_user):
        result = api_client_authenticated.get('/admin/reports/', {'period': 'month'})
        assert result.status_code == 200
        assert result.data['period'] == 'month'

    def test_get_reports_quarter(self, api_client_authenticated, admin_user):
        result = api_client_authenticated.get('/admin/reports/', {'period': 'quarter'})
        assert result.status_code == 200
        assert result.data['period'] == 'quarter'

    def test_get_reports_invalid_period_defaults_to_year(self, api_client_authenticated, admin_user):
        result = api_client_authenticated.get('/admin/reports/', {'period': 'invalid'})
        assert result.status_code == 200
        assert result.data['period'] == 'year'
