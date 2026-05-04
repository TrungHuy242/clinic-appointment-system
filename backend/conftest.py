"""
Global pytest fixtures for the Django test suite.
"""
import os
import pytest
from datetime import timedelta, datetime, time

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

SESSION_USER_KEY = 'portal_user'


@pytest.fixture
def specialty(db):
    from catalog.models import Specialty
    return Specialty.objects.create(
        name='Cardiology',
        description='Heart care specialists',
        is_active=True,
    )


@pytest.fixture
def specialty_2(db):
    from catalog.models import Specialty
    return Specialty.objects.create(
        name='Dermatology',
        description='Skin care specialists',
        is_active=True,
    )


@pytest.fixture
def doctor(specialty):
    from catalog.models import Doctor
    return Doctor.objects.create(
        full_name='Dr. Nguyen Van A',
        phone='0912345678',
        email='dr.nguyen@clinic.com',
        specialty=specialty,
        bio='Experienced cardiologist',
        is_active=True,
    )


@pytest.fixture
def doctor_2(specialty_2):
    from catalog.models import Doctor
    return Doctor.objects.create(
        full_name='Dr. Tran Thi B',
        phone='0923456789',
        email='dr.tran@clinic.com',
        specialty=specialty_2,
        bio='Experienced dermatologist',
        is_active=True,
    )


@pytest.fixture
def admin_user(db):
    from portal.models import User, UserRole
    from django.contrib.auth.hashers import make_password
    return User.objects.create(
        username='test_admin',
        password=make_password('admin123'),
        full_name='Test Admin',
        email='admin@test.com',
        role=UserRole.ADMIN,
        is_active=True,
    )


@pytest.fixture
def receptionist_user(db):
    from portal.models import User, UserRole
    from django.contrib.auth.hashers import make_password
    return User.objects.create(
        username='test_reception',
        password=make_password('reception123'),
        full_name='Test Reception',
        email='reception@test.com',
        role=UserRole.RECEPTIONIST,
        is_active=True,
    )


@pytest.fixture
def doctor_user(doctor, db):
    from portal.models import User, UserRole
    from django.contrib.auth.hashers import make_password
    return User.objects.create(
        username='dr.nguyen',
        password=make_password('doctor123'),
        full_name='Dr. Nguyen Van A',
        email='dr.nguyen@clinic.com',
        role=UserRole.DOCTOR,
        doctor=doctor,
        is_active=True,
    )


@pytest.fixture
def patient_profile(db):
    from portal.models import PatientProfile
    from django.contrib.auth.hashers import make_password
    return PatientProfile.objects.create(
        full_name='Nguyen Van Patient',
        phone='0909123456',
        dob=datetime(1990, 1, 1).date(),
        gender='male',
        allergies='None',
        account_username='patient1',
        account_email='patient@test.com',
        account_password=make_password('patient123'),
        is_current=False,
    )


@pytest.fixture
def patient_profile_2(db):
    from portal.models import PatientProfile
    from django.contrib.auth.hashers import make_password
    return PatientProfile.objects.create(
        full_name='Tran Thi Patient',
        phone='0909987654',
        dob=datetime(1995, 5, 15).date(),
        gender='female',
        account_username='patient2',
        account_password=make_password('patient456'),
        is_current=False,
    )


@pytest.fixture
def api_client():
    from rest_framework.test import APIClient
    return APIClient()


@pytest.fixture
def api_client_authenticated(api_client, admin_user, db):
    from common.auth import create_access_token
    user_data = {
        'id': admin_user.id,
        'username': admin_user.username,
        'full_name': admin_user.full_name,
        'role': admin_user.role,
        'doctor_id': None,
        'is_active': True,
    }
    token = create_access_token(user_data)
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
    return api_client


@pytest.fixture
def api_client_receptionist(api_client, receptionist_user, db):
    from common.auth import create_access_token
    user_data = {
        'id': receptionist_user.id,
        'username': receptionist_user.username,
        'full_name': receptionist_user.full_name,
        'role': receptionist_user.role,
        'doctor_id': None,
        'is_active': True,
    }
    token = create_access_token(user_data)
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
    return api_client


@pytest.fixture
def api_client_doctor(api_client, doctor_user, db):
    from common.auth import create_access_token
    user_data = {
        'id': doctor_user.id,
        'username': doctor_user.username,
        'full_name': doctor_user.full_name,
        'role': doctor_user.role,
        'doctor_id': doctor_user.doctor_id,
        'is_active': True,
    }
    token = create_access_token(user_data)
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
    return api_client


@pytest.fixture
def api_client_patient(api_client, patient_profile, db):
    from common.auth import create_access_token
    user_data = {
        'id': patient_profile.id,
        'username': patient_profile.account_username,
        'full_name': patient_profile.full_name,
        'role': 'patient',
        'patient_profile_id': patient_profile.id,
        'is_active': True,
    }
    token = create_access_token(user_data)
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
    return api_client


@pytest.fixture
def appointment_date():
    from django.utils import timezone
    return timezone.localdate() + timedelta(days=1)


@pytest.fixture
def slot_8am(appointment_date):
    from django.utils import timezone
    dt = datetime.combine(appointment_date, time(8, 0))
    return timezone.make_aware(dt)


@pytest.fixture
def slot_9am(appointment_date):
    from django.utils import timezone
    dt = datetime.combine(appointment_date, time(9, 0))
    return timezone.make_aware(dt)


@pytest.fixture
def slot_10am(appointment_date):
    from django.utils import timezone
    dt = datetime.combine(appointment_date, time(10, 0))
    return timezone.make_aware(dt)
