from django.core.management.base import BaseCommand

from catalog.models import Doctor, Specialty


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
]

SEED_DOCTORS = [
    {
        'full_name': 'BS. Nguyễn Thị Sarah',
        'phone': '0901234567',
        'specialty_name': 'Nhi khoa',
        'bio': 'Bác sĩ theo dõi và tư vấn nhi khoa.',
    },
    {
        'full_name': 'BS. Trần Ngọc Emily',
        'phone': '0912345678',
        'specialty_name': 'Da liễu',
        'bio': 'Bác sĩ khám chuyên sâu da liễu.',
    },
    {
        'full_name': 'BS. Phạm Quốc Hùng',
        'phone': '0923456789',
        'specialty_name': 'Tai Mũi Họng',
        'bio': 'Bác sĩ điều trị các bệnh lý tai mũi họng.',
    },
]


class Command(BaseCommand):
    help = 'Seed demo data for Sprint 1.'

    def handle(self, *args, **options):
        created_specialties = 0
        created_doctors = 0

        specialty_map = {}
        for item in SEED_SPECIALTIES:
            specialty, created = Specialty.objects.get_or_create(
                name=item['name'],
                defaults={
                    'description': item['description'],
                    'is_active': True,
                },
            )
            if not created and specialty.description != item['description']:
                specialty.description = item['description']
                specialty.save(update_fields=['description'])
            specialty_map[item['name']] = specialty
            created_specialties += int(created)

        for item in SEED_DOCTORS:
            specialty = specialty_map[item['specialty_name']]
            doctor, created = Doctor.objects.get_or_create(
                full_name=item['full_name'],
                specialty=specialty,
                defaults={
                    'phone': item['phone'],
                    'bio': item['bio'],
                    'is_active': True,
                },
            )
            if not created:
                updates = []
                if doctor.phone != item['phone']:
                    doctor.phone = item['phone']
                    updates.append('phone')
                if doctor.bio != item['bio']:
                    doctor.bio = item['bio']
                    updates.append('bio')
                if updates:
                    doctor.save(update_fields=updates)
            created_doctors += int(created)

        self.stdout.write(
            self.style.SUCCESS(
                f'Seed completed. specialties_created={created_specialties}, doctors_created={created_doctors}'
            )
        )
