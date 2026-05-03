"""
Unit tests for portal serializers using pytest style.
"""
import pytest
from django.contrib.auth.hashers import make_password

from portal.models import PatientProfile, User, UserRole
from portal.serializers import (
    PatientProfileSerializer,
    PatientProfileUpdateSerializer,
    ReceptionistProfileSerializer,
    ReceptionistProfileCreateSerializer,
    PatientPasswordResetSerializer,
)


@pytest.mark.django_db
class TestPatientProfileSerializer:
    def test_serialize_patient_profile(self, patient_profile):
        serializer = PatientProfileSerializer(patient_profile)
        data = serializer.data
        assert data['full_name'] == 'Nguyen Van Patient'
        assert data['phone'] == '0909123456'
        assert data['account_username'] == 'patient1'
        assert 'id' in data
        assert 'created_at' in data

    def test_deserialize_update_valid_data(self, patient_profile):
        data = {
            'full_name': 'Updated Name',
            'phone': '0909123456',
            'dob': '1990-01-01',
            'gender': 'female',
            'allergies': 'Penicillin',
        }
        serializer = PatientProfileUpdateSerializer(patient_profile, data=data, partial=True)
        assert serializer.is_valid(), serializer.errors
        updated = serializer.save()
        assert updated.full_name == 'Updated Name'
        assert updated.gender == 'female'
        assert updated.allergies == 'Penicillin'


@pytest.mark.django_db
class TestReceptionistProfileSerializer:
    def test_serialize_receptionist(self):
        user = User.objects.create(
            username='reception1',
            password='hashed',
            full_name='Le Thi C',
            email='le@clinic.com',
            phone='0909111222',
            role=UserRole.RECEPTIONIST,
        )
        serializer = ReceptionistProfileSerializer(user)
        data = serializer.data
        assert data['username'] == 'reception1'
        assert data['full_name'] == 'Le Thi C'
        assert data['email'] == 'le@clinic.com'
        assert 'password' not in data

    def test_create_receptionist_profile(self):
        data = {
            'username': 'new_reception',
            'password': 'securepass',
            'full_name': 'New Reception',
            'email': 'new@clinic.com',
            'phone': '0909111333',
            'is_active': True,
        }
        serializer = ReceptionistProfileCreateSerializer(data=data)
        assert serializer.is_valid(), serializer.errors
        user = serializer.save()
        assert user.username == 'new_reception'
        assert user.role == UserRole.RECEPTIONIST

    def test_create_receptionist_short_password_fails(self):
        data = {
            'username': 'short_pass',
            'password': '12345',
            'full_name': 'Test',
        }
        serializer = ReceptionistProfileCreateSerializer(data=data)
        assert serializer.is_valid() is False
        assert 'password' in serializer.errors


@pytest.mark.django_db
class TestPatientPasswordResetSerializer:
    def test_reset_password_success(self, patient_profile):
        original_hash = patient_profile.account_password
        data = {'new_password': 'newsecure123'}
        serializer = PatientPasswordResetSerializer(
            patient_profile, data=data,
        )
        assert serializer.is_valid()
        updated = serializer.save()
        # New hash must be different from original (MD5 is used in tests)
        assert updated.account_password != original_hash

    def test_reset_password_short_fails(self, patient_profile):
        data = {'new_password': '12345'}
        serializer = PatientPasswordResetSerializer(
            patient_profile, data=data,
        )
        assert serializer.is_valid() is False
        assert 'new_password' in serializer.errors
