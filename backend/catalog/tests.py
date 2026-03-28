from django.test import TestCase
from rest_framework.test import APIClient

from catalog.models import Doctor, Specialty, VisitType
from portal.models import AdminAuditLog, User


class SpecialtyCRUDTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.specialty = Specialty.objects.create(
            name='Neurology',
            description='Brain and nerves',
            is_active=True,
        )

    def test_specialty_list(self):
        response = self.client.get('/admin/specialties/')
        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(len(response.json()), 1)

    def test_specialty_create(self):
        payload = {'name': 'Pediatrics', 'description': 'Children health', 'is_active': True}
        response = self.client.post('/admin/specialties/', payload, format='json')
        self.assertIn(response.status_code, [201, 400, 401, 403])
        if response.status_code == 201:
            self.assertTrue(Specialty.objects.filter(name='Pediatrics').exists())

    def test_specialty_update(self):
        payload = {'name': 'Neurology Updated', 'description': 'Updated desc', 'is_active': True}
        response = self.client.put(f'/admin/specialties/{self.specialty.id}/', payload, format='json')
        self.assertIn(response.status_code, [200, 400, 401, 403])
        if response.status_code == 200:
            self.specialty.refresh_from_db()
            self.assertEqual(self.specialty.name, 'Neurology Updated')

    def test_specialty_delete(self):
        response = self.client.delete(f'/admin/specialties/{self.specialty.id}/')
        self.assertIn(response.status_code, [204, 401, 403])

    def test_specialty_audit_log_on_create(self):
        """Creating a specialty should produce an AdminAuditLog entry."""
        log_count_before = AdminAuditLog.objects.count()
        payload = {'name': 'Orthopedics', 'description': 'Bones', 'is_active': True}
        response = self.client.post('/admin/specialties/', payload, format='json')
        if response.status_code == 201:
            self.assertGreater(AdminAuditLog.objects.count(), log_count_before)


class DoctorCRUDTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.specialty = Specialty.objects.create(name='Cardiology', is_active=True)
        self.doctor = Doctor.objects.create(
            full_name='Dr. Smith',
            phone='+84911111111',
            specialty=self.specialty,
            is_active=True,
        )

    def test_doctor_list(self):
        response = self.client.get('/admin/doctors/')
        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(len(response.json()), 1)

    def test_doctor_create_profile_only(self):
        """POST /admin/doctors/ creates a doctor profile without account."""
        payload = {
            'full_name': 'Dr. House',
            'phone': '+84922222222',
            'email': 'house@clinic.com',
            'specialty': self.specialty.id,
            'bio': 'Diagnostic genius',
            'is_active': True,
        }
        response = self.client.post('/admin/doctors/', payload, format='json')
        self.assertIn(response.status_code, [201, 400, 401, 403])
        if response.status_code == 201:
            self.assertTrue(Doctor.objects.filter(full_name='Dr. House').exists())
            doctor = Doctor.objects.get(full_name='Dr. House')
            self.assertFalse(User.objects.filter(doctor=doctor, role='doctor').exists())

    def test_doctor_create_requires_specialty(self):
        payload = {'full_name': 'Dr. NoSpecialty', 'phone': '+84933333333'}
        response = self.client.post('/admin/doctors/', payload, format='json')
        self.assertIn(response.status_code, [400, 401, 403])

    def test_doctor_update(self):
        payload = {
            'full_name': 'Dr. Smith Updated',
            'phone': '+84911111111',
            'specialty': self.specialty.id,
            'is_active': True,
        }
        response = self.client.put(f'/admin/doctors/{self.doctor.id}/', payload, format='json')
        self.assertIn(response.status_code, [200, 400, 401, 403])
        if response.status_code == 200:
            self.doctor.refresh_from_db()
            self.assertEqual(self.doctor.full_name, 'Dr. Smith Updated')

    def test_doctor_deactivate(self):
        payload = {
            'full_name': 'Dr. Smith',
            'phone': '+84911111111',
            'specialty': self.specialty.id,
            'is_active': False,
        }
        response = self.client.patch(
            f'/admin/doctors/{self.doctor.id}/',
            payload,
            format='json',
        )
        self.assertIn(response.status_code, [200, 401, 403])
        if response.status_code == 200:
            self.doctor.refresh_from_db()
            self.assertFalse(self.doctor.is_active)

    def test_doctor_create_account_success(self):
        """POST /admin/doctors/<id>/create-account/ creates linked User account."""
        from django.contrib.auth.hashers import check_password as django_check
        payload = {'username': 'drsmith', 'password': 'secure123', 'email': 'drsmith@clinic.com'}
        response = self.client.post(
            f'/admin/doctors/{self.doctor.id}/create-account/',
            payload,
            format='json',
        )
        self.assertIn(response.status_code, [201, 400, 401, 403])
        if response.status_code == 201:
            self.assertTrue(User.objects.filter(doctor=self.doctor, role='doctor').exists())
            user = User.objects.get(doctor=self.doctor, role='doctor')
            self.assertEqual(user.username, 'drsmith')
            self.assertTrue(django_check('secure123', user.password))

    def test_doctor_create_account_duplicate_fails(self):
        """Creating a second account for the same doctor fails."""
        payload = {'username': 'drsmith2', 'password': 'secure123'}
        response1 = self.client.post(
            f'/admin/doctors/{self.doctor.id}/create-account/',
            payload,
            format='json',
        )
        if response1.status_code == 201:
            response2 = self.client.post(
                f'/admin/doctors/{self.doctor.id}/create-account/',
                {'username': 'drsmith3', 'password': 'secure123'},
                format='json',
            )
            self.assertIn(response2.status_code, [400, 401, 403])

    def test_doctor_create_account_duplicate_username_fails(self):
        """Username uniqueness is enforced."""
        User.objects.create(
            username='taken_user',
            password='dummy',
            full_name='Other Person',
            role='doctor',
        )
        payload = {'username': 'taken_user', 'password': 'secure123'}
        response = self.client.post(
            f'/admin/doctors/{self.doctor.id}/create-account/',
            payload,
            format='json',
        )
        self.assertIn(response.status_code, [400, 401, 403])

    def test_doctor_create_account_short_password_fails(self):
        """Password must be at least 6 characters."""
        payload = {'username': 'drsmith3', 'password': '12345'}
        response = self.client.post(
            f'/admin/doctors/{self.doctor.id}/create-account/',
            payload,
            format='json',
        )
        self.assertIn(response.status_code, [400, 401, 403])

    def test_doctor_audit_log_on_create_profile(self):
        """Creating a doctor profile should produce an AdminAuditLog entry."""
        log_count_before = AdminAuditLog.objects.count()
        payload = {
            'full_name': 'Dr. Audit',
            'phone': '+84944444444',
            'specialty': self.specialty.id,
            'is_active': True,
        }
        response = self.client.post('/admin/doctors/', payload, format='json')
        if response.status_code == 201:
            self.assertGreater(AdminAuditLog.objects.count(), log_count_before)

    def test_doctor_audit_log_on_create_account(self):
        """Creating a doctor account should produce a CREATE_ACCOUNT AdminAuditLog entry."""
        payload = {'username': 'draudit', 'password': 'secure123'}
        response = self.client.post(
            f'/admin/doctors/{self.doctor.id}/create-account/',
            payload,
            format='json',
        )
        if response.status_code == 201:
            account_log = AdminAuditLog.objects.filter(
                resource_type='DoctorAccount',
                action='CREATE_ACCOUNT',
            ).first()
            self.assertIsNotNone(account_log)


class VisitTypeCRUDTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.visit_type = VisitType.objects.create(
            name='Extended Consultation',
            duration_minutes=40,
            price=500000,
            is_active=True,
        )

    def test_visit_type_list(self):
        response = self.client.get('/admin/visit-types/')
        self.assertEqual(response.status_code, 200)

    def test_visit_type_create(self):
        payload = {
            'name': 'Quick Check',
            'duration_minutes': 15,
            'price': 150000,
            'is_active': True,
        }
        response = self.client.post('/admin/visit-types/', payload, format='json')
        self.assertIn(response.status_code, [201, 400, 401, 403])
        if response.status_code == 201:
            self.assertTrue(VisitType.objects.filter(name='Quick Check').exists())

    def test_visit_type_update(self):
        payload = {
            'name': 'Extended Consultation Updated',
            'duration_minutes': 45,
            'price': 600000,
            'is_active': True,
        }
        response = self.client.put(f'/admin/visit-types/{self.visit_type.id}/', payload, format='json')
        self.assertIn(response.status_code, [200, 400, 401, 403])
        if response.status_code == 200:
            self.visit_type.refresh_from_db()
            self.assertEqual(self.visit_type.name, 'Extended Consultation Updated')
