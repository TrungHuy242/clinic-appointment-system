"""
Unit tests for catalog models using pytest style.
"""
import pytest
from datetime import date

from catalog.models import (
    Doctor, DoctorSchedule, DoctorTimeOff, Specialty, VisitType,
)


@pytest.mark.django_db
class TestSpecialtyModel:
    def test_create_specialty(self):
        specialty = Specialty.objects.create(
            name='Neurology',
            description='Brain and nervous system',
            is_active=True,
        )
        assert specialty.name == 'Neurology'
        assert specialty.is_active is True
        assert specialty.created_at is not None

    def test_specialty_str(self):
        specialty = Specialty.objects.create(name='Cardiology')
        assert str(specialty) == 'Cardiology'

    def test_specialty_unique_name(self):
        Specialty.objects.create(name='Pediatrics')
        with pytest.raises(Exception):
            Specialty.objects.create(name='Pediatrics')

    def test_specialty_ordering(self):
        Specialty.objects.create(name='Zebras')
        Specialty.objects.create(name='Apes')
        names = list(Specialty.objects.values_list('name', flat=True))
        assert names == ['Apes', 'Zebras']


@pytest.mark.django_db
class TestDoctorModel:
    def test_create_doctor(self, specialty):
        doctor = Doctor.objects.create(
            full_name='Dr. House',
            phone='0912345678',
            email='house@clinic.com',
            specialty=specialty,
            bio='Diagnostic genius',
            is_active=True,
        )
        assert doctor.full_name == 'Dr. House'
        assert doctor.specialty == specialty
        assert doctor.is_active is True

    def test_doctor_str(self, specialty):
        doctor = Doctor.objects.create(full_name='Dr. House', specialty=specialty)
        assert str(doctor) == 'Dr. House (Cardiology)'

    def test_doctor_inactive_default(self):
        specialty = Specialty.objects.create(name='X')
        doctor = Doctor.objects.create(full_name='Dr. X', specialty=specialty)
        assert doctor.is_active is True

    def test_doctor_ordering(self, specialty):
        Doctor.objects.create(full_name='Zebra Doc', specialty=specialty)
        Doctor.objects.create(full_name='Apple Doc', specialty=specialty)
        names = list(Doctor.objects.values_list('full_name', flat=True))
        assert names == ['Apple Doc', 'Zebra Doc']


@pytest.mark.django_db
class TestDoctorScheduleModel:
    def test_create_schedule(self, doctor):
        schedule = DoctorSchedule.objects.create(
            doctor=doctor, weekday=0, is_working=True,
        )
        assert schedule.weekday == 0
        assert schedule.is_working is True
        assert schedule.doctor == doctor

    def test_schedule_unique_constraint(self, doctor):
        DoctorSchedule.objects.create(doctor=doctor, weekday=0, is_working=True)
        with pytest.raises(Exception):
            DoctorSchedule.objects.create(doctor=doctor, weekday=0, is_working=False)

    def test_schedule_str(self, doctor):
        schedule = DoctorSchedule.objects.create(
            doctor=doctor, weekday=0, is_working=True,
        )
        schedule_str = str(schedule)
        assert doctor.full_name in schedule_str
        assert 'Thứ Hai' in schedule_str
        assert 'Làm việc' in schedule_str

    def test_schedule_weekday_range(self, doctor):
        for weekday in range(7):
            s = DoctorSchedule.objects.create(
                doctor=doctor, weekday=weekday, is_working=True,
            )
            assert s.weekday == weekday


@pytest.mark.django_db
class TestDoctorTimeOffModel:
    def test_create_time_off(self, doctor):
        time_off = DoctorTimeOff.objects.create(
            doctor=doctor, off_date=date(2026, 5, 1), reason='Annual leave',
        )
        assert time_off.doctor == doctor
        assert time_off.off_date.year == 2026
        assert time_off.reason == 'Annual leave'

    def test_time_off_unique_constraint(self, doctor):
        DoctorTimeOff.objects.create(
            doctor=doctor, off_date=date(2026, 6, 1), reason='Vacation',
        )
        with pytest.raises(Exception):
            DoctorTimeOff.objects.create(
                doctor=doctor, off_date=date(2026, 6, 1), reason='Other',
            )

    def test_time_off_str(self, doctor):
        time_off = DoctorTimeOff.objects.create(
            doctor=doctor, off_date=date(2026, 7, 15), reason='Conference',
        )
        time_off_str = str(time_off)
        assert doctor.full_name in time_off_str
        assert 'Conference' in time_off_str


@pytest.mark.django_db
class TestVisitTypeModel:
    def test_create_visit_type(self):
        visit_type = VisitType.objects.create(
            name='Extended Consultation',
            duration_minutes=40,
            price=500000,
            description='Longer consultation',
            is_active=True,
        )
        assert visit_type.name == 'Extended Consultation'
        assert visit_type.duration_minutes == 40
        assert int(visit_type.price) == 500000

    def test_visit_type_str(self):
        visit_type = VisitType.objects.create(name='Quick Check')
        assert str(visit_type) == 'Quick Check'

    def test_visit_type_default_duration(self):
        visit_type = VisitType.objects.create(name='Standard')
        assert visit_type.duration_minutes == 25

    def test_visit_type_default_price(self):
        visit_type = VisitType.objects.create(name='Free Check')
        assert int(visit_type.price) == 0

    def test_visit_type_ordering(self):
        VisitType.objects.create(name='Zulu')
        VisitType.objects.create(name='Alpha')
        names = list(VisitType.objects.values_list('name', flat=True))
        assert names == ['Alpha', 'Zulu']
