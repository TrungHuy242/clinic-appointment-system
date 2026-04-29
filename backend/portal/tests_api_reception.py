"""
Integration tests for receptionist portal API endpoints using pytest style.
"""
import pytest


@pytest.mark.django_db
class TestReceptionistDashboardAPI:
    def test_get_dashboard_authenticated(self, api_client_receptionist, receptionist_user):
        result = api_client_receptionist.get('/reception/dashboard/')
        assert result.status_code == 200
        assert 'stats' in result.data
        assert 'upcoming' in result.data

    def test_get_dashboard_unauthenticated(self, api_client, receptionist_user):
        result = api_client.get('/reception/dashboard/')
        assert result.status_code == 401


@pytest.mark.django_db
class TestReceptionistPatientsAPI:
    def test_get_patients_requires_receptionist(self, api_client, admin_user):
        """Reception patients endpoint: admin AND receptionist are both allowed (IsReceptionist)."""
        # api_client_authenticated (admin) SHOULD be allowed since IsReceptionist allows admin too
        result = api_client.get('/reception/patients/')
        # No auth at all -> 401
        assert result.status_code == 401

    def test_get_patients_receptionist_role(self, api_client_receptionist, receptionist_user):
        result = api_client_receptionist.get('/reception/patients/')
        assert result.status_code == 200
        assert 'items' in result.data
        assert 'stats' in result.data


@pytest.mark.django_db
class TestReceptionistProfileAPI:
    def test_get_profile(self, api_client_receptionist, receptionist_user):
        result = api_client_receptionist.get('/reception/profile/')
        assert result.status_code == 200
        assert 'username' in result.data

    def test_patch_profile(self, api_client_receptionist, receptionist_user):
        result = api_client_receptionist.patch('/reception/profile/', {
            'fullName': 'Updated Reception Name',
            'email': 'updated@clinic.com',
        }, format='json')
        assert result.status_code == 200
        receptionist_user.refresh_from_db()
        assert receptionist_user.full_name == 'Updated Reception Name'


@pytest.mark.django_db
class TestReceptionistChangePasswordAPI:
    def test_change_password_success(self, api_client_receptionist, receptionist_user):
        result = api_client_receptionist.post('/reception/change-password/', {
            'currentPassword': 'reception123',
            'newPassword': 'newreception123',
            'confirmPassword': 'newreception123',
        }, format='json')
        assert result.status_code == 200
        assert result.data['success'] is True

    def test_change_password_wrong_current(self, api_client_receptionist, receptionist_user):
        result = api_client_receptionist.post('/reception/change-password/', {
            'currentPassword': 'wrongpass',
            'newPassword': 'newpass123',
            'confirmPassword': 'newpass123',
        }, format='json')
        assert result.status_code == 400
