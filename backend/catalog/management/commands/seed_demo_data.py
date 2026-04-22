from datetime import datetime, time, timedelta

from django.contrib.auth.hashers import make_password
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.utils.dateparse import parse_date

from appointments.models import Appointment, AppointmentHistory, AppointmentStatus
from appointments.services import get_daily_block_frames, sync_appointment_blocks
from catalog.models import Doctor, DoctorSchedule, Specialty, VisitType
from portal.models import AdminAuditLog, AuditAction, MedicalRecord, PatientNotification, PatientProfile, User


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

SEED_VISIT_TYPES = [
    {'name': 'Khám thường', 'duration_minutes': 15, 'price': 150000, 'description': 'Khám tổng quát, không thủ thuật.'},
    {'name': 'Khám chuyên sâu', 'duration_minutes': 25, 'price': 250000, 'description': 'Khám chi tiết hơn, có tư vấn chuyên sâu.'},
    {'name': 'Tái khám', 'duration_minutes': 15, 'price': 100000, 'description': 'Tái khám theo yêu cầu bác sĩ.'},
    {'name': 'Khám + Xét nghiệm', 'duration_minutes': 40, 'price': 350000, 'description': 'Khám kèm xét nghiệm máu hoặc sinh hóa cơ bản.'},
]

SEED_DOCTORS = [
    {
        'full_name': 'BS. Nguyễn Thị Sarah',
        'phone': '0901234001',
        'specialty_name': 'Nhi khoa',
        'bio': 'Bác sĩ chuyên theo dõi và tư vấn nhi khoa tổng quát. Tốt nghiệp ĐH Y Hà Nội, 10 năm kinh nghiệm.',
    },
    {
        'full_name': 'BS. Trần Ngọc Emily',
        'phone': '0912345001',
        'specialty_name': 'Da liễu',
        'bio': 'Bác sĩ khám chuyên sâu da liễu, điều trị mề đay, chàm và các bệnh lý da trẻ em.',
    },
    {
        'full_name': 'BS. Phạm Quốc Hùng',
        'phone': '0923456001',
        'specialty_name': 'Tai Mũi Họng',
        'bio': 'Bác sĩ điều trị các bệnh lý tai mũi họng, phẫu thuật amidan và thanh quản.',
    },
    {
        'full_name': 'BS. Lê Minh Khoa',
        'phone': '0934567001',
        'specialty_name': 'Khám tổng quát',
        'bio': 'Bác sĩ khám tổng quát và quản lý bệnh mạn tính. Chuyên gia về đái tháo đường và tim mạch.',
    },
    {
        'full_name': 'BS. Hoàng Thu Hà',
        'phone': '0945678001',
        'specialty_name': 'Nhi khoa',
        'bio': 'Bác sĩ chuyên sâu về hô hấp nhi, hen phế quản và viêm phổi ở trẻ em.',
    },
    {
        'full_name': 'BS. Vũ Ngọc Mai',
        'phone': '0956789001',
        'specialty_name': 'Da liễu',
        'bio': 'Chuyên gia về laser da liễu, điều trị nám và các vấn đề thẩm mỹ da.',
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
        'notes': 'Khách mới, lần đầu đăng ký khám.',
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
        'notes': 'Theo dõi da dị ứng, tái khám định kỳ.',
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
        'notes': 'Bệnh nhân tái khám da liễu.',
        'emergency_name': 'Hoàng Minh Tâm',
        'emergency_phone': '0909000777',
        'account_email': 'em@example.com',
        'account_password': 'huy0610',
        'is_current': False,
    },
    {
        'full_name': 'Võ Thị Lan Chi',
        'phone': '0909000006',
        'dob': '2015-04-20',
        'gender': PatientProfile.Gender.FEMALE,
        'allergies': 'Dị ứng kháng sinh nhóm penicillin.',
        'notes': 'Bệnh nhi 10 tuổi, mẹ là Võ Thị Hương Giang - SĐT: 0909000066.',
        'emergency_name': 'Võ Thị Hương Giang',
        'emergency_phone': '0909000066',
        'account_email': 'lanchi@example.com',
        'account_password': 'huy0610',
        'is_current': False,
    },
    {
        'full_name': 'Đặng Minh Tuấn',
        'phone': '0909000007',
        'dob': '1978-12-05',
        'gender': PatientProfile.Gender.MALE,
        'allergies': 'Dị ứng bụi, phấn hoa.',
        'notes': 'Bệnh nhân hen phế quản, tái khám định kỳ tại BS. Hoàng Thu Hà.',
        'emergency_name': 'Đặng Thị Hạnh',
        'emergency_phone': '0909000077',
        'account_email': 'tuan@example.com',
        'account_password': 'huy0610',
        'is_current': False,
    },
    {
        'full_name': 'Trần Thị Mai Anh',
        'phone': '0909000008',
        'dob': '1988-07-30',
        'gender': PatientProfile.Gender.FEMALE,
        'allergies': 'Không ghi nhận.',
        'notes': 'Mang thai 12 tuần - cần ưu tiên lịch khám buổi sáng.',
        'emergency_name': 'Nguyễn Văn Hùng',
        'emergency_phone': '0909000088',
        'account_email': 'maianh@example.com',
        'account_password': 'huy0610',
        'is_current': False,
    },
    {
        'full_name': 'Lý Gia Bảo',
        'phone': '0909000009',
        'dob': '2010-09-14',
        'gender': PatientProfile.Gender.MALE,
        'allergies': '',
        'notes': 'Bệnh nhi 15 tuổi, đi cùng bố mẹ.',
        'emergency_name': 'Lý Văn Đức',
        'emergency_phone': '0909000099',
        'account_email': 'bao@example.com',
        'account_password': 'huy0610',
        'is_current': False,
    },
    {
        'full_name': 'Nguyễn Thị Hồng Nhung',
        'phone': '0909000010',
        'dob': '1993-02-28',
        'gender': PatientProfile.Gender.FEMALE,
        'allergies': 'Dị ứng nổi mề đay khi thay đổi thời tiết.',
        'notes': 'Đang theo dõi mề đay mạn tính tại BS. Trần Ngọc Emily.',
        'emergency_name': 'Nguyễn Văn Toàn',
        'emergency_phone': '0909000011',
        'account_email': 'hongnhung@example.com',
        'account_password': 'huy0610',
        'is_current': False,
    },
]

SEED_NOTIFICATIONS = [
    ('0912345678', 'Lịch hẹn APT-2026-1001 của bạn đã được xác nhận. Hẹn gặp BS. Trần Ngọc Emily lúc 8h30 ngày 18/3/2026.', False),
    ('0912345678', 'Kết quả khám APT-2026-0940 đã sẵn sàng trong hồ sơ điện tử. Chẩn đoán: Viêm da tiếp xúc dị ứng.', True),
    ('0901234567', 'Lịch hẹn APT-2026-1015 của bạn đã được xác nhận. Hẹn gặp BS. Phạm Quốc Hùng lúc 10h00 ngày 21/3/2026.', False),
    ('0901234567', 'Kết quả khám APT-2026-0981 đã có. Vui lòng xem chi tiết trong hồ sơ.', True),
    ('0909000003', 'Chào bạn Lê Thành Nam! Lịch hẹn APT-2026-1701 đã được xác nhận. Vui lòng đến trước giờ hẹn 15 phút để check-in.', False),
    ('0909000004', 'Lịch hẹn tái khám APT-2026-1703 đang trong quá trình khám. BS. sẽ thông báo khi hoàn tất.', False),
    ('0909000006', 'Nhắc nhở: Lịch hẹn khám nhi của bé Võ Thị Lan Chi vào ngày mai lúc 9h00. Vui lòng mang theo sổ tiêm chủng.', False),
    ('0909000007', 'Nhắc nhở tái khám: Đặng Minh Tuấn có lịch tái khám hen phế quản vào tuần sau. Hẹn gặp BS. Hoàng Thu Hà.', False),
    ('0909000008', 'Lịch khám thai định kỳ của Trần Thị Mai Anh đã được xác nhận vào ngày mai lúc 8h00.', False),
    ('0909000010', 'Kết quả xét nghiệm máu của bạn đã sẵn sàng. Vui lòng đến phòng khám để nhận kết quả.', False),
]


class Command(BaseCommand):
    help = 'Seed demo data for Sprint 1 and full frontend/backend integration.'

    def handle(self, *args, **options):
        specialty_map = self.seed_specialties()
        self.seed_visit_types()
        doctor_map = self.seed_doctors(specialty_map)
        self.seed_doctor_schedules(doctor_map)
        profile_map = self.seed_profiles()
        self.seed_appointments(doctor_map, specialty_map, profile_map)
        self.seed_appointment_history(doctor_map)
        self.seed_notifications(profile_map)
        self.seed_staff_users(doctor_map)
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

    def seed_visit_types(self):
        for item in SEED_VISIT_TYPES:
            VisitType.objects.update_or_create(
                name=item['name'],
                defaults={
                    'duration_minutes': item['duration_minutes'],
                    'price': item['price'],
                    'description': item['description'],
                    'is_active': True,
                },
            )

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

    def seed_doctor_schedules(self, doctor_map):
        """Seed default work schedules: Mon-Fri working, Sat-Sun off."""
        for doctor in doctor_map.values():
            for weekday in range(7):
                is_working = weekday < 5  # Mon-Fri = working, Sat-Sun = off
                DoctorSchedule.objects.update_or_create(
                    doctor=doctor,
                    weekday=weekday,
                    defaults={'is_working': is_working},
                )
        self.stdout.write(self.style.SUCCESS(f'Seeded work schedules for {len(doctor_map)} doctors.'))

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
        dynamic_base = self.next_slot_start(timezone.localtime(timezone.now()) + timedelta(minutes=5))
        queue_today = dynamic_base.date()

        schedules = [
            # --- STATUS: COMPLETED ---
            {
                'code': 'APT-2026-0940',
                'patient_name': 'Trần Thị Bình',
                'patient_phone': '0912345678',
                'specialty': 'Da liễu',
                'doctor': 'BS. Trần Ngọc Emily',
                'start': self.make_aware(datetime(2026, 3, 10, 9, 10)),
                'end': self.make_aware(datetime(2026, 3, 10, 9, 35)),
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
                'code': 'APT-2026-0981',
                'patient_name': 'Nguyễn Văn An',
                'patient_phone': '0901234567',
                'specialty': 'Tai Mũi Họng',
                'doctor': 'BS. Phạm Quốc Hùng',
                'start': self.make_aware(datetime(2026, 3, 5, 15, 20)),
                'end': self.make_aware(datetime(2026, 3, 5, 15, 45)),
                'status': AppointmentStatus.COMPLETED,
                'record': {
                    'chief_complaint': 'Đau họng, nuốt vướng và khàn tiếng nhẹ trong 2 ngày.',
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
                'code': 'APT-2026-0955',
                'patient_name': 'Đặng Minh Tuấn',
                'patient_phone': '0909000007',
                'specialty': 'Nhi khoa',
                'doctor': 'BS. Hoàng Thu Hà',
                'start': self.make_aware(datetime(2026, 3, 8, 9, 0)),
                'end': self.make_aware(datetime(2026, 3, 8, 9, 25)),
                'status': AppointmentStatus.COMPLETED,
                'record': {
                    'chief_complaint': 'Ho khan kéo dài, khó thở nhẹ khi gắng sức.',
                    'diagnosis_name': 'Hen phế quản ổn định',
                    'diagnosis_icd_code': 'J45.4',
                    'clinical_notes': 'Bệnh nhân có tiền sử hen. Khám tình trạng ổn định, phổi không ran. Tiếp tục điều trị theo phác đồ hiện tại.',
                    'location': 'Cơ sở Hải Châu - Phòng khám số 2',
                    'medicines': [
                        {'id': 1, 'name': 'Montelukast', 'dosage': '10mg', 'duration': '30 ngày', 'usage': 'Uống 1 viên vào buổi tối'},
                        {'id': 2, 'name': 'Salbutamol', 'dosage': '100mcg', 'duration': 'Theo nhu cầu', 'usage': 'Hít khi khó thở'},
                    ],
                },
            },
            {
                'code': 'APT-2026-0966',
                'patient_name': 'Nguyễn Thị Hồng Nhung',
                'patient_phone': '0909000010',
                'specialty': 'Da liễu',
                'doctor': 'BS. Trần Ngọc Emily',
                'start': self.make_aware(datetime(2026, 3, 12, 14, 0)),
                'end': self.make_aware(datetime(2026, 3, 12, 14, 25)),
                'status': AppointmentStatus.COMPLETED,
                'record': {
                    'chief_complaint': 'Nổi mề đay tái đi tái lại khi thay đổi thời tiết.',
                    'diagnosis_name': 'Mề đay mạn tính',
                    'diagnosis_icd_code': 'L50.9',
                    'clinical_notes': 'Tổn thương mề đay phân bố rải rác. Xét nghiệm máu cho thấy IgE tăng nhẹ. Hướng dẫn tránh dị nguyên và kê thuốc kháng histamine.',
                    'location': 'Cơ sở Hải Châu - Phòng khám số 4',
                    'medicines': [
                        {'id': 1, 'name': 'Levocetirizine', 'dosage': '5mg', 'duration': '14 ngày', 'usage': 'Uống 1 viên vào buổi tối'},
                    ],
                },
            },
            {
                'code': 'APT-2026-0970',
                'patient_name': 'Võ Thị Lan Chi',
                'patient_phone': '0909000006',
                'specialty': 'Nhi khoa',
                'doctor': 'BS. Nguyễn Thị Sarah',
                'start': self.make_aware(datetime(2026, 3, 14, 8, 30)),
                'end': self.make_aware(datetime(2026, 3, 14, 8, 55)),
                'status': AppointmentStatus.COMPLETED,
                'record': {
                    'chief_complaint': 'Sốt nhẹ, ho và chảy mũi 3 ngày.',
                    'diagnosis_name': 'Nhiễm trùng hô hấp trên cấp',
                    'diagnosis_icd_code': 'J06.9',
                    'clinical_notes': 'Trẻ 10 tuổi, sốt 37.8°C, họng đỏ nhẹ, không khó thở. Được kê thuốc hạ sốt và ho. Hướng dẫn theo dõi 3 ngày.',
                    'location': 'Cơ sở Hải Châu - Phòng khám số 1',
                    'medicines': [
                        {'id': 1, 'name': 'Paracetamol', 'dosage': '500mg', 'duration': 'Khi sốt', 'usage': 'Uống khi sốt trên 38°C, cách 6 giờ'},
                        {'id': 2, 'name': 'Siro Ho', 'dosage': '5ml', 'duration': '5 ngày', 'usage': 'Uống 3 lần/ngày sau ăn'},
                    ],
                },
            },
            {
                'code': 'APT-2026-1704',
                'patient_name': 'Hoàng Anh Em',
                'patient_phone': '0909000005',
                'specialty': 'Da liễu',
                'doctor': 'BS. Trần Ngọc Emily',
                'start': dynamic_base - timedelta(minutes=50),
                'end': dynamic_base - timedelta(minutes=25),
                'status': AppointmentStatus.COMPLETED,
                'record': {
                    'chief_complaint': 'Viêm da tái phát ở vùng cổ tay.',
                    'diagnosis_name': 'Viêm da cơ địa',
                    'diagnosis_icd_code': 'L20.9',
                    'clinical_notes': 'Tổn thương khu trú ở cổ tay, đáp ứng tốt với thuốc bôi. Hẹn tái khám sau 2 tuần.',
                    'location': 'Cơ sở Hải Châu - Phòng khám số 3',
                    'medicines': [
                        {'id': 1, 'name': 'Mometasone', 'dosage': '0.1%', 'duration': '7 ngày', 'usage': 'Bôi 1 lần vào buổi tối'},
                    ],
                },
            },
            # --- STATUS: IN_PROGRESS ---
            {
                'code': 'APT-2026-1703',
                'patient_name': 'Phạm Hồng Nhung',
                'patient_phone': '0909000004',
                'specialty': 'Da liễu',
                'doctor': 'BS. Trần Ngọc Emily',
                'start': dynamic_base - timedelta(minutes=25),
                'end': dynamic_base,
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
            # --- STATUS: CHECKED_IN ---
            {
                'code': 'APT-2026-1702',
                'patient_name': 'Trần Thị Bình',
                'patient_phone': '0912345678',
                'specialty': 'Da liễu',
                'doctor': 'BS. Trần Ngọc Emily',
                'start': dynamic_base,
                'end': dynamic_base + timedelta(minutes=25),
                'status': AppointmentStatus.CHECKED_IN,
            },
            {
                'code': 'APT-2026-1705',
                'patient_name': 'Nguyễn Văn An',
                'patient_phone': '0901234567',
                'specialty': 'Tai Mũi Họng',
                'doctor': 'BS. Phạm Quốc Hùng',
                'start': dynamic_base,
                'end': dynamic_base + timedelta(minutes=25),
                'status': AppointmentStatus.CHECKED_IN,
            },
            # --- STATUS: CONFIRMED (upcoming today) ---
            {
                'code': 'APT-2026-1706',
                'patient_name': 'Lê Thành Nam',
                'patient_phone': '0909000003',
                'specialty': 'Da liễu',
                'doctor': 'BS. Trần Ngọc Emily',
                'start': dynamic_base + timedelta(minutes=25),
                'end': dynamic_base + timedelta(minutes=50),
                'status': AppointmentStatus.CONFIRMED,
            },
            {
                'code': 'APT-2026-1707',
                'patient_name': 'Võ Thị Lan Chi',
                'patient_phone': '0909000006',
                'specialty': 'Nhi khoa',
                'doctor': 'BS. Nguyễn Thị Sarah',
                'start': dynamic_base + timedelta(minutes=50),
                'end': dynamic_base + timedelta(minutes=75),
                'status': AppointmentStatus.CONFIRMED,
            },
            {
                'code': 'APT-2026-1708',
                'patient_name': 'Đặng Minh Tuấn',
                'patient_phone': '0909000007',
                'specialty': 'Nhi khoa',
                'doctor': 'BS. Hoàng Thu Hà',
                'start': dynamic_base + timedelta(minutes=100),
                'end': dynamic_base + timedelta(minutes=125),
                'status': AppointmentStatus.CONFIRMED,
            },
            {
                'code': 'APT-2026-1709',
                'patient_name': 'Trần Thị Mai Anh',
                'patient_phone': '0909000008',
                'specialty': 'Khám tổng quát',
                'doctor': 'BS. Lê Minh Khoa',
                'start': dynamic_base + timedelta(minutes=125),
                'end': dynamic_base + timedelta(minutes=150),
                'status': AppointmentStatus.CONFIRMED,
            },
            # --- STATUS: CONFIRMED (future) ---
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
                'code': 'APT-2026-1020',
                'patient_name': 'Lê Thành Nam',
                'patient_phone': '0909000003',
                'specialty': 'Khám tổng quát',
                'doctor': 'BS. Lê Minh Khoa',
                'start': self.make_aware(datetime(2026, 3, 22, 9, 0)),
                'end': self.make_aware(datetime(2026, 3, 22, 9, 25)),
                'status': AppointmentStatus.CONFIRMED,
            },
            {
                'code': 'APT-2026-1021',
                'patient_name': 'Nguyễn Thị Hồng Nhung',
                'patient_phone': '0909000010',
                'specialty': 'Da liễu',
                'doctor': 'BS. Trần Ngọc Emily',
                'start': self.make_aware(datetime(2026, 3, 22, 14, 0)),
                'end': self.make_aware(datetime(2026, 3, 22, 14, 25)),
                'status': AppointmentStatus.CONFIRMED,
            },
            {
                'code': 'APT-2026-1022',
                'patient_name': 'Võ Thị Lan Chi',
                'patient_phone': '0909000006',
                'specialty': 'Nhi khoa',
                'doctor': 'BS. Hoàng Thu Hà',
                'start': self.make_aware(datetime(2026, 3, 25, 8, 30)),
                'end': self.make_aware(datetime(2026, 3, 25, 8, 55)),
                'status': AppointmentStatus.CONFIRMED,
            },
            # --- STATUS: CANCELLED ---
            {
                'code': 'APT-2026-0905',
                'patient_name': 'Trần Thị Bình',
                'patient_phone': '0912345678',
                'specialty': 'Da liễu',
                'doctor': 'BS. Trần Ngọc Emily',
                'start': self.make_aware(datetime(2026, 3, 3, 15, 0)),
                'end': self.make_aware(datetime(2026, 3, 3, 15, 25)),
                'status': AppointmentStatus.CANCELLED,
            },
            {
                'code': 'APT-2026-0922',
                'patient_name': 'Lý Gia Bảo',
                'patient_phone': '0909000009',
                'specialty': 'Nhi khoa',
                'doctor': 'BS. Nguyễn Thị Sarah',
                'start': self.make_aware(datetime(2026, 3, 7, 10, 0)),
                'end': self.make_aware(datetime(2026, 3, 7, 10, 25)),
                'status': AppointmentStatus.CANCELLED,
            },
            {
                'code': 'APT-2026-0999',
                'patient_name': 'Trần Thị Mai Anh',
                'patient_phone': '0909000008',
                'specialty': 'Khám tổng quát',
                'doctor': 'BS. Lê Minh Khoa',
                'start': self.make_aware(datetime(2026, 3, 15, 9, 0)),
                'end': self.make_aware(datetime(2026, 3, 15, 9, 25)),
                'status': AppointmentStatus.CANCELLED,
            },
            # --- STATUS: NO_SHOW ---
            {
                'code': 'APT-2026-0888',
                'patient_name': 'Hoàng Anh Em',
                'patient_phone': '0909000005',
                'specialty': 'Da liễu',
                'doctor': 'BS. Vũ Ngọc Mai',
                'start': self.make_aware(datetime(2026, 3, 1, 14, 0)),
                'end': self.make_aware(datetime(2026, 3, 1, 14, 25)),
                'status': AppointmentStatus.NO_SHOW,
            },
            # --- STATUS: PENDING ---
            {
                'code': 'APT-2026-1710',
                'patient_name': 'Lý Gia Bảo',
                'patient_phone': '0909000009',
                'specialty': 'Nhi khoa',
                'doctor': 'BS. Nguyễn Thị Sarah',
                'start': dynamic_base + timedelta(minutes=150),
                'end': dynamic_base + timedelta(minutes=175),
                'status': AppointmentStatus.PENDING,
            },
            {
                'code': 'APT-2026-1711',
                'patient_name': 'Nguyễn Thị Hồng Nhung',
                'patient_phone': '0909000010',
                'specialty': 'Da liễu',
                'doctor': 'BS. Vũ Ngọc Mai',
                'start': dynamic_base + timedelta(minutes=175),
                'end': dynamic_base + timedelta(minutes=200),
                'status': AppointmentStatus.PENDING,
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
            sync_appointment_blocks(appointment)

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

        self.stdout.write(self.style.SUCCESS(f'Seeded {len(schedules)} appointments ({queue_today.isoformat()}).'))

    def make_aware(self, value):
        return timezone.make_aware(value, timezone.get_current_timezone())

    def next_slot_start(self, value):
        local_value = timezone.localtime(value).replace(second=0, microsecond=0)
        search_date = local_value.date()

        while True:
            for frame in get_daily_block_frames(search_date):
                if frame['start'] >= local_value:
                    return frame['start']

            search_date = search_date + timedelta(days=1)
            local_value = self.make_aware(datetime.combine(search_date, time(hour=8, minute=0)))

    def seed_appointment_history(self, doctor_map):
        histories = [
            {'apt': 'APT-2026-0940', 'action': 'CREATE', 'changed_by': 'Nguyễn Thị Lễ Tân', 'changed_by_role': 'receptionist'},
            {'apt': 'APT-2026-0940', 'action': 'CONFIRM', 'changed_by': 'Nguyễn Thị Lễ Tân', 'changed_by_role': 'receptionist'},
            {'apt': 'APT-2026-0940', 'action': 'CHECKIN', 'changed_by': 'Nguyễn Thị Lễ Tân', 'changed_by_role': 'receptionist'},
            {'apt': 'APT-2026-0940', 'action': 'MOVE_TO_DOCTOR', 'changed_by': 'Nguyễn Thị Lễ Tân', 'changed_by_role': 'receptionist'},
            {'apt': 'APT-2026-0940', 'action': 'COMPLETE', 'changed_by': 'BS. Trần Ngọc Emily', 'changed_by_role': 'doctor'},
            {'apt': 'APT-2026-0981', 'action': 'CREATE', 'changed_by': 'Nguyễn Thị Lễ Tân', 'changed_by_role': 'receptionist'},
            {'apt': 'APT-2026-0981', 'action': 'CHECKIN', 'changed_by': 'Nguyễn Thị Lễ Tân', 'changed_by_role': 'receptionist'},
            {'apt': 'APT-2026-0981', 'action': 'COMPLETE', 'changed_by': 'BS. Phạm Quốc Hùng', 'changed_by_role': 'doctor'},
            {'apt': 'APT-2026-0955', 'action': 'CREATE', 'changed_by': 'Nguyễn Thị Lễ Tân', 'changed_by_role': 'receptionist'},
            {'apt': 'APT-2026-0955', 'action': 'COMPLETE', 'changed_by': 'BS. Hoàng Thu Hà', 'changed_by_role': 'doctor'},
            {'apt': 'APT-2026-0966', 'action': 'CREATE', 'changed_by': 'Nguyễn Thị Lễ Tân', 'changed_by_role': 'receptionist'},
            {'apt': 'APT-2026-0966', 'action': 'CONFIRM', 'changed_by': 'Nguyễn Thị Lễ Tân', 'changed_by_role': 'receptionist'},
            {'apt': 'APT-2026-0966', 'action': 'COMPLETE', 'changed_by': 'BS. Trần Ngọc Emily', 'changed_by_role': 'doctor'},
            {'apt': 'APT-2026-0970', 'action': 'CREATE', 'changed_by': 'Nguyễn Thị Lễ Tân', 'changed_by_role': 'receptionist'},
            {'apt': 'APT-2026-0970', 'action': 'COMPLETE', 'changed_by': 'BS. Nguyễn Thị Sarah', 'changed_by_role': 'doctor'},
            {'apt': 'APT-2026-1704', 'action': 'CREATE', 'changed_by': 'Nguyễn Thị Lễ Tân', 'changed_by_role': 'receptionist'},
            {'apt': 'APT-2026-1704', 'action': 'COMPLETE', 'changed_by': 'BS. Trần Ngọc Emily', 'changed_by_role': 'doctor'},
            {'apt': 'APT-2026-1703', 'action': 'CREATE', 'changed_by': 'Nguyễn Thị Lễ Tân', 'changed_by_role': 'receptionist'},
            {'apt': 'APT-2026-1703', 'action': 'CONFIRM', 'changed_by': 'Nguyễn Thị Lễ Tân', 'changed_by_role': 'receptionist'},
            {'apt': 'APT-2026-1703', 'action': 'CHECKIN', 'changed_by': 'Nguyễn Thị Lễ Tân', 'changed_by_role': 'receptionist'},
            {'apt': 'APT-2026-1703', 'action': 'MOVE_TO_DOCTOR', 'changed_by': 'Nguyễn Thị Lễ Tân', 'changed_by_role': 'receptionist'},
            {'apt': 'APT-2026-1702', 'action': 'CREATE', 'changed_by': 'Nguyễn Thị Lễ Tân', 'changed_by_role': 'receptionist'},
            {'apt': 'APT-2026-1702', 'action': 'CONFIRM', 'changed_by': 'Nguyễn Thị Lễ Tân', 'changed_by_role': 'receptionist'},
            {'apt': 'APT-2026-1702', 'action': 'CHECKIN', 'changed_by': 'Nguyễn Thị Lễ Tân', 'changed_by_role': 'receptionist'},
            {'apt': 'APT-2026-0905', 'action': 'CREATE', 'changed_by': 'Nguyễn Thị Lễ Tân', 'changed_by_role': 'receptionist'},
            {'apt': 'APT-2026-0905', 'action': 'CANCEL', 'changed_by': 'Nguyễn Thị Lễ Tân', 'changed_by_role': 'receptionist', 'note': 'Bệnh nhân xin hủy lịch đột xuất.'},
            {'apt': 'APT-2026-0888', 'action': 'CREATE', 'changed_by': 'Nguyễn Thị Lễ Tân', 'changed_by_role': 'receptionist'},
            {'apt': 'APT-2026-0888', 'action': 'NO_SHOW', 'changed_by': 'Hệ thống', 'changed_by_role': 'system'},
        ]
        for h in histories:
            apt = Appointment.all_objects.filter(code=h['apt']).first()
            if apt:
                AppointmentHistory.objects.get_or_create(
                    appointment=apt,
                    action=h['action'],
                    changed_by=h['changed_by'],
                    changed_by_role=h['changed_by_role'],
                    note=h.get('note', ''),
                )
        AdminAuditLog.objects.get_or_create(
            action=AuditAction.CREATE,
            resource_type='Appointment',
            resource_id='APT-2026-0940',
            resource_label='APT-2026-0940 - Trần Thị Bình',
            actor_name='Nguyễn Thị Lễ Tân',
            actor_role='receptionist',
            detail='Tạo lịch hẹn khám da liễu cho Trần Thị Bình.',
        )
        AdminAuditLog.objects.get_or_create(
            action=AuditAction.STATUS_CHANGE,
            resource_type='Appointment',
            resource_id='APT-2026-1703',
            resource_label='APT-2026-1703 - Phạm Hồng Nhung',
            actor_name='BS. Trần Ngọc Emily',
            actor_role='doctor',
            detail='Chuyển trạng thái CHECKED_IN → IN_PROGRESS.',
        )
        self.stdout.write(self.style.SUCCESS(f'Seeded {len(histories)} appointment history entries.'))

    def seed_staff_users(self, doctor_map):
        """Create staff users for demo — links doctors to User accounts."""
        staff_users = [
            {
                'username': 'admin',
                'password': 'admin123',
                'full_name': 'Admin User',
                'role': 'admin',
                'email': 'admin@medicare.com',
            },
            {
                'username': 'reception',
                'password': 'reception123',
                'full_name': 'Nguyễn Thị Lễ Tân',
                'role': 'receptionist',
                'email': 'reception@medicare.com',
            },
            {
                'username': 'doctor1',
                'password': 'doctor123',
                'full_name': 'BS. Nguyễn Thị Sarah',
                'role': 'doctor',
                'email': 'doctor1@medicare.com',
                'doctor_name': 'BS. Nguyễn Thị Sarah',
            },
            {
                'username': 'doctor2',
                'password': 'doctor123',
                'full_name': 'BS. Trần Ngọc Emily',
                'role': 'doctor',
                'email': 'doctor2@medicare.com',
                'doctor_name': 'BS. Trần Ngọc Emily',
            },
            {
                'username': 'doctor3',
                'password': 'doctor123',
                'full_name': 'BS. Phạm Quốc Hùng',
                'role': 'doctor',
                'email': 'doctor3@medicare.com',
                'doctor_name': 'BS. Phạm Quốc Hùng',
            },
            {
                'username': 'doctor4',
                'password': 'doctor123',
                'full_name': 'BS. Lê Minh Khoa',
                'role': 'doctor',
                'email': 'doctor4@medicare.com',
                'doctor_name': 'BS. Lê Minh Khoa',
            },
            {
                'username': 'doctor5',
                'password': 'doctor123',
                'full_name': 'BS. Hoàng Thu Hà',
                'role': 'doctor',
                'email': 'doctor5@medicare.com',
                'doctor_name': 'BS. Hoàng Thu Hà',
            },
            {
                'username': 'doctor6',
                'password': 'doctor123',
                'full_name': 'BS. Vũ Ngọc Mai',
                'role': 'doctor',
                'email': 'doctor6@medicare.com',
                'doctor_name': 'BS. Vũ Ngọc Mai',
            },
        ]

        created_count = 0
        for data in staff_users:
            doctor_name = data.pop('doctor_name', None)
            doctor_obj = doctor_map.get(doctor_name) if doctor_name else None
            existing = User.objects.filter(username=data['username']).first()
            if existing:
                continue
            if doctor_obj:
                existing_by_doctor = User.objects.filter(doctor=doctor_obj).first()
                if existing_by_doctor:
                    existing_by_doctor.username = data['username']
                    for field in ('password', 'full_name', 'role', 'email'):
                        setattr(existing_by_doctor, field, data[field])
                    existing_by_doctor.save(update_fields=['username', 'password', 'full_name', 'role', 'email', 'updated_at'])
                    created_count += 1
                    continue
            User.objects.create(
                password=make_password(data['password']),
                full_name=data['full_name'],
                role=data['role'],
                email=data['email'],
                doctor=doctor_obj,
                username=data['username'],
            )
            created_count += 1

        self.stdout.write(self.style.SUCCESS(f'Created {created_count} staff users.'))
        print('[Demo] Staff login credentials:')
        print('  admin / admin123  (Admin)')
        print('  reception / reception123  (Receptionist)')
        print('  doctor1 / doctor123  (BS. Nguyen Thi Sarah - Nhi khoa)')
        print('  doctor2 / doctor123  (BS. Tran Ngoc Emily - Da lieu)')
        print('  doctor3 / doctor123  (BS. Pham Quoc Hung - Tai Mui Hong)')
        print('  doctor4 / doctor123  (BS. Le Minh Khoa - Kham tong quat)')
        print('  doctor5 / doctor123  (BS. Hoang Thu Ha - Nhi khoa)')
        print('  doctor6 / doctor123  (BS. Vu Ngoc Mai - Da lieu)')

