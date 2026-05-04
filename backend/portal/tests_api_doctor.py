"""
Integration tests for doctor portal API endpoints using pytest style.
"""
import pytest
from datetime import timedelta
from django.utils import timezone


@pytest.mark.django_db
class TestDoctorScheduleAPI:
    def test_get_schedule_returns_structure(self, api_client_doctor, doctor, doctor_user):
        result = api_client_doctor.get('/doctor/schedule/')
        assert result.status_code == 200
        assert 'doctorName' in result.data
        assert 'date' in result.data
        assert 'items' in result.data

    def test_get_schedule_with_date_param(self, api_client_doctor, doctor, doctor_user):
        result = api_client_doctor.get(
            '/doctor/schedule/',
            {'date': timezone.localdate().isoformat()}
        )
        assert result.status_code == 200

    def test_get_schedule_requires_auth(self, api_client):
        result = api_client.get('/doctor/schedule/')
        assert result.status_code == 401


@pytest.mark.django_db
class TestDoctorQueueAPI:
    def test_get_queue_returns_list(self, api_client_doctor, doctor, doctor_user):
        result = api_client_doctor.get('/doctor/queue/')
        assert result.status_code == 200
        assert isinstance(result.data, list)

    def test_get_queue_requires_auth(self, api_client):
        result = api_client.get('/doctor/queue/')
        assert result.status_code == 401


@pytest.mark.django_db
class TestDoctorVisitsAPI:
    def test_get_visits_returns_list(self, api_client_doctor, doctor, doctor_user):
        result = api_client_doctor.get('/doctor/visits/')
        assert result.status_code == 200
        assert isinstance(result.data, list)

    def test_get_visits_filter_completed(self, api_client_doctor, doctor, doctor_user):
        result = api_client_doctor.get('/doctor/visits/', {'status': 'completed'})
        assert result.status_code == 200


@pytest.mark.django_db
class TestDoctorProfileAPI:
    def test_get_profile(self, api_client_doctor, doctor, doctor_user):
        result = api_client_doctor.get('/doctor/profile/')
        assert result.status_code == 200
        assert 'fullName' in result.data

    def test_patch_profile(self, api_client_doctor, doctor, doctor_user):
        result = api_client_doctor.patch('/doctor/profile/', {
            'bio': 'Updated bio for doctor',
            'phone': '0912345678',
        }, format='json')
        assert result.status_code == 200


@pytest.mark.django_db
class TestDoctorScheduleConfigAPI:
    def test_get_schedule_config(self, api_client_doctor, doctor, doctor_user):
        result = api_client_doctor.get('/doctor/schedule-config/')
        assert result.status_code == 200
        assert 'schedule' in result.data
        assert 'timeOffs' in result.data

    def test_update_schedule_config(self, api_client_doctor, doctor, doctor_user):
        result = api_client_doctor.patch('/doctor/schedule-config/', {
            'schedule': [
                {'weekday': 0, 'isWorking': True},
                {'weekday': 1, 'isWorking': False},
            ]
        }, format='json')
        assert result.status_code == 200


@pytest.mark.django_db
class TestDoctorTimeOffAPI:
    def test_add_time_off(self, api_client_doctor, doctor, doctor_user):
        future_date = (timezone.localdate() + timedelta(days=30)).isoformat()
        result = api_client_doctor.post('/doctor/time-off/', {
            'offDate': future_date,
            'reason': 'Annual leave',
        }, format='json')
        assert result.status_code == 201
        assert 'id' in result.data

    def test_delete_time_off(self, api_client_doctor, doctor, doctor_user):
        from catalog.models import DoctorTimeOff
        future_date = timezone.localdate() + timedelta(days=30)
        time_off = DoctorTimeOff.objects.create(
            doctor=doctor, off_date=future_date, reason='Test leave',
        )
        result = api_client_doctor.delete(f'/doctor/time-off/?id={time_off.id}')
        assert result.status_code == 200

    def test_add_time_off_invalid_date(self, api_client_doctor, doctor, doctor_user):
        result = api_client_doctor.post('/doctor/time-off/', {
            'offDate': 'invalid-date',
            'reason': 'Test',
        }, format='json')
        assert result.status_code == 400
