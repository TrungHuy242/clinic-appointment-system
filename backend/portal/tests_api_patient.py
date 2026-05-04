"""
Integration tests for patient portal API endpoints using pytest style.
"""
import pytest
from django.utils import timezone

from portal.models import PatientNotification


@pytest.mark.django_db
class TestPatientHealthProfileAPI:
    def test_get_health_profile(self, api_client_patient, patient_profile):
        result = api_client_patient.get('/patient/profile/')
        assert result.status_code == 200
        assert 'name' in result.data
        assert 'phone' in result.data
        assert 'gender' in result.data

    def test_patch_health_profile(self, api_client_patient, patient_profile):
        result = api_client_patient.patch('/patient/profile/', {
            'name': 'Updated Profile',
            'phone': '0909123456',
            'gender': 'female',
            'allergies': 'Aspirin',
        }, format='json')
        assert result.status_code == 200
        patient_profile.refresh_from_db()
        assert patient_profile.full_name == 'Updated Profile'
        assert patient_profile.gender == 'female'

    def test_get_health_profile_unauthenticated(self, api_client, patient_profile):
        result = api_client.get('/patient/profile/')
        assert result.status_code == 401


@pytest.mark.django_db
class TestPatientAccountAPI:
    def test_get_account_info(self, api_client_patient, patient_profile):
        result = api_client_patient.get('/patient/account/')
        assert result.status_code == 200
        assert result.data['name'] == 'Nguyen Van Patient'

    def test_patch_account_info(self, api_client_patient, patient_profile):
        result = api_client_patient.patch('/patient/account/', {
            'name': 'Renamed Account',
            'email': 'newemail@test.com',
        }, format='json')
        assert result.status_code == 200
        assert result.data['name'] == 'Renamed Account'


@pytest.mark.django_db
class TestPatientChangePasswordAPI:
    def test_change_password_success(self, api_client_patient, patient_profile):
        result = api_client_patient.post('/patient/change-password/', {
            'currentPassword': 'patient123',
            'newPassword': 'newpassword999',
            'confirmPassword': 'newpassword999',
        }, format='json')
        assert result.status_code == 200
        assert result.data['success'] is True

    def test_change_password_wrong_current(self, api_client_patient, patient_profile):
        result = api_client_patient.post('/patient/change-password/', {
            'currentPassword': 'wrongpass',
            'newPassword': 'newpass999',
            'confirmPassword': 'newpass999',
        }, format='json')
        assert result.status_code == 400


@pytest.mark.django_db
class TestPatientNotificationsAPI:
    def test_get_notifications(self, api_client_patient, patient_profile):
        PatientNotification.objects.create(
            profile=patient_profile, message='Test notification 1',
        )
        PatientNotification.objects.create(
            profile=patient_profile, message='Test notification 2',
        )

        result = api_client_patient.get('/patient/notifications/')
        assert result.status_code == 200
        assert len(result.data) == 2

    def test_mark_notification_read(self, api_client_patient, patient_profile):
        notification = PatientNotification.objects.create(
            profile=patient_profile, message='Mark me read',
        )
        result = api_client_patient.patch(
            f'/patient/notifications/{notification.id}/'
        )
        assert result.status_code == 200
        notification.refresh_from_db()
        assert notification.is_read is True

    def test_mark_all_notifications_read(self, api_client_patient, patient_profile):
        PatientNotification.objects.create(profile=patient_profile, message='Notif 1')
        PatientNotification.objects.create(profile=patient_profile, message='Notif 2')

        result = api_client_patient.post('/patient/notifications/mark-all-read/')
        assert result.status_code == 200
        unread = PatientNotification.objects.filter(
            profile=patient_profile, is_read=False
        ).count()
        assert unread == 0

    def test_delete_notification(self, api_client_patient, patient_profile):
        notification = PatientNotification.objects.create(
            profile=patient_profile, message='Delete me',
        )
        result = api_client_patient.delete(
            f'/patient/notifications/{notification.id}/'
        )
        assert result.status_code == 200
        notification.refresh_from_db()
        assert notification.is_deleted is True
