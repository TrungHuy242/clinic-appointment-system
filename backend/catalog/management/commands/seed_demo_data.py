from datetime import datetime, timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone
from django.utils.dateparse import parse_date

from appointments.models import Appointment, AppointmentStatus
from catalog.models import Doctor, Specialty
from portal.models import MedicalRecord, PatientNotification, PatientProfile


SEED_SPECIALTIES = [
    {
        'name': 'Nhi khoa',
        'description': 'Khám và theo dõi sức khỏe trẻ em.',
    },
    {
        'name': 'Da liễu',
        'description': 'Khám các vấn đề về da, tóc và móng.',
    },
    {
        'name': 'Tai Mũi Họng',
        'description': 'Khám và điều trị bệnh lý tai mũi họng.',
    },
    {
        'name': 'Khám tổng quát',
        'description': 'Khám sàng lọc và theo dõi sức khỏe định kỳ.',
    },
]

SEED_DOCTORS = [
    {
        'full_name': 'BS. Nguyễn Thị Sarah',
        'phone': '0901234001',
        'specialty_name': 'Nhi khoa',
        'bio': 'Bác sĩ theo dõi và tư vấn nhi khoa.',
    },
    {
        'full_name': 'BS. Trần Ngọc Emily',
        'phone': '0912345001',
        'specialty_name': 'Da liễu',
        'bio': 'Bác sĩ khám chuyên sâu da liễu.',
    },
    {
        'full_name': 'BS. Phạm Quốc Hùng',
        'phone': '0923456001',
        'specialty_name': 'Tai Mũi Họng',
        'bio': 'Bác sĩ điều trị các bệnh lý tai mũi họng.',
    },
    {
        'full_name': 'BS. Lê Minh Khoa',
        'phone': '0934567001',
        'specialty_name': 'Khám tổng quát',
        'bio': 'Bác sĩ khám tổng quát và quản lý bệnh mạn tính.',
    },
]

SEED_PROFILES = [
    {
        'full_name': 'Trần Thị Bình',
        'phone': '0912345678',
        'dob': '1985-06-15',
        'gender': PatientProfile.Gender.FEMALE,
        'allergies': 'Dị ứng nhẹ với hải sản.',
        'notes': 'Đã khám da liễu định kỳ tại cơ sở Hải Châu.',
        'emergency_name': 'Trần Văn Minh',
        'emergency_phone': '0912000111',
        'account_email': 'binh@example.com',
        'account_password': 'huy0610',
        'is_current': True,
    },
    {
        'full_name': 'Nguyễn Văn An',
        'phone': '0901234567',
        'dob': '1990-01-01',
        'gender': PatientProfile.Gender.MALE,
        'allergies': 'Không ghi nhận.',
        'notes': 'Đã từng khám tổng quát và tai mũi họng.',
        'emergency_name': 'Nguyễn Thị Hồng',
        'emergency_phone': '0901000222',
        'account_email': 'an@example.com',
        'account_password': 'huy0610',
        'is_current': False,
    },
    {
        'full_name': 'Lê Thành Nam',
        'phone': '0909000003',
        'dob': '1992-08-18',
        'gender': PatientProfile.Gender.MALE,
        'allergies': '',
        'notes': 'Khách mới.',
        'emergency_name': 'Lê Kim Oanh',
        'emergency_phone': '0909000999',
        'account_email': 'nam@example.com',
        'account_password': 'huy0610',
        'is_current': False,
    },
    {
        'full_name': 'Phạm Hồng Nhung',
        'phone': '0909000004',
        'dob': '1995-11-02',
        'gender': PatientProfile.Gender.FEMALE,
        'allergies': '',
        'notes': 'Theo dõi da dị ứng.',
        'emergency_name': 'Phạm Văn Phúc',
        'emergency_phone': '0909000888',
        'account_email': 'nhung@example.com',
        'account_password': 'huy0610',
        'is_current': False,
    },
    {
        'full_name': 'Hoàng Anh Em',
        'phone': '0909000005',
        'dob': '1989-03-12',
        'gender': PatientProfile.Gender.OTHER,
        'allergies': '',
        'notes': 'Bệnh nhân tái khám.',
        'emergency_name': 'Hoàng Minh Tâm',
        'emergency_phone': '0909000777',
        'account_email': 'em@example.com',
        'account_password': 'huy0610',
        'is_current': False,
    },
]

SEED_NOTIFICATIONS = [
    ('0912345678', 'Lịch hẹn APT-2026-1001 của bạn đã được xác nhận.', False),
    ('0912345678', 'Kết quả khám APT-2026-0940 đã sẵn sàng trong hồ sơ điện tử.', True),
]


class Command(BaseCommand):
    help = 'Seed demo data for Sprint 1 and full frontend/backend integration.'

    def handle(self, *args, **options):
        specialty_map = self.seed_specialties()
        doctor_map = self.seed_doctors(specialty_map)
        profile_map = self.seed_profiles()
        self.seed_appointments(doctor_map, specialty_map, profile_map)
        self.seed_notifications(profile_map)
        self.stdout.write(self.style.SUCCESS('Seed completed successfully.'))

    def seed_specialties(self):
        specialty_map = {}
        for item in SEED_SPECIALTIES:
            specialty, _created = Specialty.objects.update_or_create(
                name=item['name'],
                defaults={
                    'description': item['description'],
                    'is_active': True,
                },
            )
            specialty_map[item['name']] = specialty
        return specialty_map

    def seed_doctors(self, specialty_map):
        doctor_map = {}
        for item in SEED_DOCTORS:
            doctor, _created = Doctor.objects.update_or_create(
                full_name=item['full_name'],
                defaults={
                    'phone': item['phone'],
                    'specialty': specialty_map[item['specialty_name']],
                    'bio': item['bio'],
                    'is_active': True,
                },
            )
            doctor_map[item['full_name']] = doctor
        return doctor_map

    def seed_profiles(self):
        PatientProfile.objects.update(is_current=False)
        profile_map = {}
        for item in SEED_PROFILES:
            profile, _created = PatientProfile.objects.update_or_create(
                phone=item['phone'],
                defaults={
                    'full_name': item['full_name'],
                    'dob': parse_date(item['dob']),
                    'gender': item['gender'],
                    'allergies': item['allergies'],
                    'notes': item['notes'],
                    'emergency_name': item['emergency_name'],
                    'emergency_phone': item['emergency_phone'],
                    'account_username': item['phone'],
                    'account_email': item['account_email'],
                    'account_password': item['account_password'],
                    'is_current': item['is_current'],
                },
            )
            profile_map[item['phone']] = profile
        return profile_map

    def seed_notifications(self, profile_map):
        for phone, message, is_read in SEED_NOTIFICATIONS:
            PatientNotification.objects.update_or_create(
                profile=profile_map[phone],
                message=message,
                defaults={
                    'is_read': is_read,
                    'is_deleted': False,
                },
            )

    def seed_appointments(self, doctor_map, specialty_map, profile_map):
        dynamic_base = timezone.localtime(timezone.now()).replace(second=0, microsecond=0)
        dynamic_base = dynamic_base + timedelta(minutes=5)
        queue_today = dynamic_base.date()

        schedules = [
            {
                'code': 'APT-2026-0940',
                'patient_name': 'Trần Thị Bình',
                'patient_phone': '0912345678',
                'specialty': 'Da liễu',
                'doctor': 'BS. Trần Ngọc Emily',
                'start': self.make_aware(datetime(2026, 2, 26, 9, 10)),
                'end': self.make_aware(datetime(2026, 2, 26, 9, 35)),
                'status': AppointmentStatus.COMPLETED,
                'record': {
                    'chief_complaint': 'Ngứa da, nổi mẩn đỏ ở cánh tay khoảng 3 ngày.',
                    'diagnosis_name': 'Viêm da tiếp xúc dị ứng',
                    'diagnosis_icd_code': 'L23.9',
                    'clinical_notes': 'Vùng da cẳng tay đỏ và ngứa kéo dài 4 ngày. Bệnh nhân được hướng dẫn tránh tác nhân kích ứng và tái khám sau 3 tuần.',
                    'location': 'Cơ sở Hải Châu - Phòng khám số 4',
                    'medicines': [
                        {'id': 1, 'name': 'Cetirizine', 'dosage': '10mg', 'duration': '7 ngày', 'usage': 'Uống 1 viên vào buổi tối'},
                        {'id': 2, 'name': 'Kem Hydrocortisone', 'dosage': '1%', 'duration': '5 ngày', 'usage': 'Bôi lớp mỏng 2 lần/ngày'},
                    ],
                },
            },
            {
                'code': 'APT-2026-1001',
                'patient_name': 'Trần Thị Bình',
                'patient_phone': '0912345678',
                'specialty': 'Da liễu',
                'doctor': 'BS. Trần Ngọc Emily',
                'start': self.make_aware(datetime(2026, 3, 18, 8, 30)),
                'end': self.make_aware(datetime(2026, 3, 18, 8, 55)),
                'status': AppointmentStatus.CONFIRMED,
            },
            {
                'code': 'APT-2026-0905',
                'patient_name': 'Trần Thị Bình',
                'patient_phone': '0912345678',
                'specialty': 'Da liễu',
                'doctor': 'BS. Trần Ngọc Emily',
                'start': self.make_aware(datetime(2026, 3, 10, 15, 0)),
                'end': self.make_aware(datetime(2026, 3, 10, 15, 25)),
                'status': AppointmentStatus.CANCELLED,
            },
            {
                'code': 'APT-2026-0981',
                'patient_name': 'Nguyễn Văn An',
                'patient_phone': '0901234567',
                'specialty': 'Tai Mũi Họng',
                'doctor': 'BS. Phạm Quốc Hùng',
                'start': self.make_aware(datetime(2026, 2, 11, 15, 20)),
                'end': self.make_aware(datetime(2026, 2, 11, 15, 45)),
                'status': AppointmentStatus.COMPLETED,
                'record': {
                    'chief_complaint': 'Đau họng, nuốt vướng và khàn tiếng nhẹ.',
                    'diagnosis_name': 'Viêm họng cấp',
                    'diagnosis_icd_code': 'J02.9',
                    'clinical_notes': 'Niêm mạc họng đỏ, đau tăng khi nuốt. Đã kê thuốc giảm viêm và hướng dẫn tái khám nếu sốt kéo dài.',
                    'location': 'Cơ sở Hải Châu - Phòng khám số 5',
                    'medicines': [
                        {'id': 1, 'name': 'Alpha Choay', 'dosage': '4200 IU', 'duration': '5 ngày', 'usage': 'Uống 2 viên/lần, ngày 3 lần'},
                        {'id': 2, 'name': 'Paracetamol', 'dosage': '500mg', 'duration': '3 ngày', 'usage': 'Uống khi sốt trên 38.5°C'},
                    ],
                },
            },
            {
                'code': 'APT-2026-1015',
                'patient_name': 'Nguyễn Văn An',
                'patient_phone': '0901234567',
                'specialty': 'Tai Mũi Họng',
                'doctor': 'BS. Phạm Quốc Hùng',
                'start': self.make_aware(datetime(2026, 3, 21, 10, 0)),
                'end': self.make_aware(datetime(2026, 3, 21, 10, 25)),
                'status': AppointmentStatus.CONFIRMED,
            },
            {
                'code': 'APT-2026-1704',
                'patient_name': 'Hoàng Anh Em',
                'patient_phone': '0909000005',
                'specialty': 'Da liễu',
                'doctor': 'BS. Trần Ngọc Emily',
                'start': dynamic_base - timedelta(minutes=90),
                'end': dynamic_base - timedelta(minutes=65),
                'status': AppointmentStatus.COMPLETED,
                'record': {
                    'chief_complaint': 'Viêm da tái phát ở vùng cổ tay.',
                    'diagnosis_name': 'Viêm da cơ địa',
                    'diagnosis_icd_code': 'L20.9',
                    'clinical_notes': 'Tổn thương khu trú, đáp ứng tốt với thuốc bôi. Hẹn tái khám sau 2 tuần.',
                    'location': 'Cơ sở Hải Châu - Phòng khám số 3',
                    'medicines': [
                        {'id': 1, 'name': 'Mometasone', 'dosage': '0.1%', 'duration': '7 ngày', 'usage': 'Bôi 1 lần vào buổi tối'},
                    ],
                },
            },
            {
                'code': 'APT-2026-1703',
                'patient_name': 'Phạm Hồng Nhung',
                'patient_phone': '0909000004',
                'specialty': 'Da liễu',
                'doctor': 'BS. Trần Ngọc Emily',
                'start': dynamic_base - timedelta(minutes=30),
                'end': dynamic_base - timedelta(minutes=5),
                'status': AppointmentStatus.IN_PROGRESS,
                'record': {
                    'chief_complaint': 'Nổi mề đay tái đi tái lại trong 1 tuần.',
                    'diagnosis_name': '',
                    'diagnosis_icd_code': '',
                    'clinical_notes': '',
                    'location': 'Cơ sở Hải Châu - P.204',
                    'medicines': [],
                    'draft': {
                        'diagnosis': 'Mề đay cấp',
                        'notes': 'Theo dõi thêm phản ứng sau dùng thuốc.',
                        'prescription': [
                            {'drug': 'Loratadine', 'dose': '1', 'unit': 'viên', 'freq': '1 lần/ngày', 'days': '5', 'note': 'Uống sau ăn tối'},
                        ],
                    },
                },
            },
            {
                'code': 'APT-2026-1701',
                'patient_name': 'Lê Thành Nam',
                'patient_phone': '0909000003',
                'specialty': 'Da liễu',
                'doctor': 'BS. Trần Ngọc Emily',
                'start': dynamic_base,
                'end': dynamic_base + timedelta(minutes=25),
                'status': AppointmentStatus.CONFIRMED,
            },
            {
                'code': 'APT-2026-1702',
                'patient_name': 'Trần Thị Bình',
                'patient_phone': '0912345678',
                'specialty': 'Da liễu',
                'doctor': 'BS. Trần Ngọc Emily',
                'start': dynamic_base + timedelta(minutes=35),
                'end': dynamic_base + timedelta(minutes=60),
                'status': AppointmentStatus.CHECKED_IN,
            },
        ]

        for item in schedules:
            appointment, _created = Appointment.all_objects.update_or_create(
                code=item['code'],
                defaults={
                    'patient_full_name': item['patient_name'],
                    'patient_phone': item['patient_phone'],
                    'specialty': specialty_map[item['specialty']],
                    'doctor': doctor_map[item['doctor']],
                    'scheduled_start': item['start'],
                    'scheduled_end': item['end'],
                    'status': item['status'],
                    'is_deleted': False,
                },
            )

            record_data = item.get('record')
            if not record_data:
                continue

            profile = profile_map[item['patient_phone']]
            record, _record_created = MedicalRecord.objects.update_or_create(
                code=f"REC-{item['code']}",
                defaults={
                    'appointment': appointment,
                    'patient_profile': profile,
                    'doctor': doctor_map[item['doctor']],
                    'location': record_data['location'],
                    'chief_complaint': record_data.get('chief_complaint', ''),
                    'diagnosis_name': record_data.get('diagnosis_name', ''),
                    'diagnosis_icd_code': record_data.get('diagnosis_icd_code', ''),
                    'clinical_notes': record_data.get('clinical_notes', ''),
                    'medicines': record_data.get('medicines', []),
                    'timeline': [],
                    'draft': record_data.get('draft', {}),
                },
            )
            if appointment.status == AppointmentStatus.COMPLETED and not record.timeline:
                record.timeline = []
                record.save(update_fields=['timeline', 'updated_at'])

        self.stdout.write(self.style.SUCCESS(f'Seeded appointments for {queue_today.isoformat()} and demo claim codes.'))

    def make_aware(self, value):
        return timezone.make_aware(value, timezone.get_current_timezone())

