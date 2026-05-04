"""
Unit tests for catalog serializers using pytest style.
"""
import pytest

from catalog.models import Doctor, DoctorSchedule, DoctorTimeOff, Specialty, VisitType
from catalog.serializers import SpecialtySerializer, DoctorSerializer, VisitTypeSerializer


@pytest.mark.django_db
class TestSpecialtySerializer:
    def test_serialize_specialty(self):
        specialty = Specialty.objects.create(
            name='Pediatrics',
            description='Child health',
            is_active=True,
        )
        serializer = SpecialtySerializer(specialty)
        data = serializer.data
        assert data['name'] == 'Pediatrics'
        assert data['description'] == 'Child health'
        assert data['is_active'] is True
        assert 'id' in data

    def test_create_specialty(self):
        data = {'name': 'Oncology', 'description': 'Cancer treatment', 'is_active': True}
        serializer = SpecialtySerializer(data=data)
        assert serializer.is_valid(), serializer.errors
        specialty = serializer.save()
        assert specialty.name == 'Oncology'

    def test_create_specialty_duplicate_name_fails(self):
        Specialty.objects.create(name='Surgery')
        data = {'name': 'Surgery'}
        serializer = SpecialtySerializer(data=data)
        assert serializer.is_valid() is False

    def test_create_specialty_short_name_fails(self):
        data = {'name': 'A'}
        serializer = SpecialtySerializer(data=data)
        assert serializer.is_valid() is False


@pytest.mark.django_db
class TestDoctorSerializer:
    def test_serialize_doctor(self, doctor):
        serializer = DoctorSerializer(doctor)
        data = serializer.data
        assert data['full_name'] == 'Dr. Nguyen Van A'
        assert data['phone'] == '0912345678'
        assert data['specialty_name'] == 'Cardiology'
        assert data['is_active'] is True

    def test_create_doctor(self, specialty):
        data = {
            'full_name': 'Dr. New',
            'phone': '0909123456',
            'email': 'dr.new@clinic.com',
            'specialty': specialty.id,
            'bio': 'New doctor',
            'is_active': True,
        }
        serializer = DoctorSerializer(data=data)
        assert serializer.is_valid(), serializer.errors
        doctor = serializer.save()
        assert doctor.full_name == 'Dr. New'
        assert doctor.specialty == specialty

    def test_create_doctor_missing_specialty_fails(self):
        data = {'full_name': 'Dr. Orphan', 'phone': '0909123456'}
        serializer = DoctorSerializer(data=data)
        assert serializer.is_valid() is False
        assert 'specialty' in serializer.errors

    def test_create_doctor_short_name_fails(self):
        data = {'full_name': 'X', 'specialty': 1}
        serializer = DoctorSerializer(data=data)
        assert serializer.is_valid() is False


@pytest.mark.django_db
class TestVisitTypeSerializer:
    def test_serialize_visit_type(self):
        vt = VisitType.objects.create(
            name='Extended Check',
            duration_minutes=40,
            price=500000,
            is_active=True,
        )
        serializer = VisitTypeSerializer(vt)
        data = serializer.data
        assert data['name'] == 'Extended Check'
        assert data['duration_minutes'] == 40
        assert data['price'] == '500000'

    def test_create_visit_type(self):
        data = {
            'name': 'Quick Consult',
            'duration_minutes': 15,
            'price': 150000,
            'is_active': True,
        }
        serializer = VisitTypeSerializer(data=data)
        assert serializer.is_valid(), serializer.errors
        vt = serializer.save()
        assert vt.name == 'Quick Consult'
        assert vt.duration_minutes == 15

    def test_update_visit_type(self):
        vt = VisitType.objects.create(name='Standard', duration_minutes=25, price=200000)
        data = {'name': 'Standard Updated', 'duration_minutes': 30, 'price': 250000}
        serializer = VisitTypeSerializer(vt, data=data)
        assert serializer.is_valid()
        updated = serializer.save()
        assert updated.name == 'Standard Updated'
        assert updated.duration_minutes == 30

    def test_visit_type_short_name_fails(self):
        data = {'name': 'A'}
        serializer = VisitTypeSerializer(data=data)
        assert serializer.is_valid() is False

    def test_visit_type_duration_too_short_fails(self):
        data = {'name': 'Too Short', 'duration_minutes': 3}
        serializer = VisitTypeSerializer(data=data)
        assert serializer.is_valid() is False

    def test_visit_type_negative_price_fails(self):
        data = {'name': 'Bad Price', 'price': -100}
        serializer = VisitTypeSerializer(data=data)
        assert serializer.is_valid() is False
