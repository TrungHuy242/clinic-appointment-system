"""
Unit tests for portal models using pytest style.
"""
import pytest
from datetime import timedelta
from django.utils import timezone
from django.contrib.auth.hashers import check_password as django_check_password

from portal.models import (
    AdminAuditLog, AuditAction, MedicalRecord,
    PatientNotification, PatientProfile, User, UserRole,
)
from catalog.models import Doctor, Specialty


@pytest.mark.django_db
class TestUserModel:
    def test_create_user_with_role_admin(self):
        user = User.objects.create(
            username='admin1',
            password='hashed_password',
            full_name='Admin User',
            role=UserRole.ADMIN,
            is_active=True,
        )
        assert user.username == 'admin1'
        assert user.role == UserRole.ADMIN
        assert user.is_active is True
        assert user.doctor is None

    def test_create_user_with_role_receptionist(self):
        user = User.objects.create(
            username='reception1',
            password='hashed_password',
            full_name='Reception User',
            role=UserRole.RECEPTIONIST,
            is_active=True,
        )
        assert user.role == UserRole.RECEPTIONIST

    def test_create_user_with_role_doctor(self, specialty):
        doctor = Doctor.objects.create(
            full_name='Dr. Test',
            specialty=specialty,
            is_active=True,
        )
        user = User.objects.create(
            username='doctor1',
            password='hashed_password',
            full_name='Dr. Test',
            role=UserRole.DOCTOR,
            doctor=doctor,
            is_active=True,
        )
        assert user.role == UserRole.DOCTOR
        assert user.doctor == doctor

    def test_user_str_representation(self):
        user = User.objects.create(
            username='user1',
            password='hashed',
            full_name='John Doe',
            role=UserRole.RECEPTIONIST,
        )
        assert str(user) == 'John Doe (receptionist)'

    def test_user_ordering(self):
        User.objects.create(username='zuser', password='x', full_name='Zebra')
        User.objects.create(username='auser', password='x', full_name='Apple')
        usernames = list(User.objects.values_list('username', flat=True))
        assert usernames == ['auser', 'zuser']

    def test_user_is_active_default_true(self):
        user = User.objects.create(username='test', password='x', full_name='Test')
        assert user.is_active is True


@pytest.mark.django_db
class TestPatientProfileModel:
    def test_create_patient_profile(self):
        profile = PatientProfile.objects.create(
            full_name='Tran Van A',
            phone='0912345678',
            dob=timezone.now().date() - timedelta(days=3650),
            gender='male',
            account_username='trana',
            account_password='hashed',
        )
        assert profile.full_name == 'Tran Van A'
        assert profile.phone == '0912345678'
        assert profile.gender == 'male'
        assert profile.is_current is False

    def test_patient_profile_str(self):
        profile = PatientProfile.objects.create(
            full_name='Tran Van A',
            phone='0912345678',
            account_username='trana',
            account_password='x',
        )
        assert str(profile) == 'Tran Van A (0912345678)'

    def test_patient_profile_ordering(self):
        PatientProfile.objects.create(
            full_name='Zebra', phone='0999000001', account_username='z',
            account_password='x',
        )
        PatientProfile.objects.create(
            full_name='Apple', phone='0999000002', account_username='a',
            account_password='x',
        )
        names = list(PatientProfile.objects.values_list('full_name', flat=True))
        assert names == ['Apple', 'Zebra']

    def test_patient_profile_unique_phone(self):
        PatientProfile.objects.create(
            full_name='First', phone='0912345678', account_username='f1',
            account_password='x',
        )
        with pytest.raises(Exception):
            PatientProfile.objects.create(
                full_name='Second', phone='0912345678', account_username='f2',
                account_password='x',
            )


@pytest.mark.django_db
class TestPatientNotificationModel:
    def test_create_notification(self):
        profile = PatientProfile.objects.create(
            full_name='Test Patient',
            phone='0912345678',
            account_username='testp',
            account_password='x',
        )
        notification = PatientNotification.objects.create(
            profile=profile,
            message='Your appointment is confirmed.',
        )
        assert notification.profile == profile
        assert notification.message == 'Your appointment is confirmed.'
        assert notification.is_read is False
        assert notification.is_deleted is False

    def test_notification_str(self):
        profile = PatientProfile.objects.create(
            full_name='Test Patient',
            phone='0912345678',
            account_username='testp2',
            account_password='x',
        )
        notification = PatientNotification.objects.create(
            profile=profile,
            message='Appointment reminder for tomorrow.',
        )
        notification_str = str(notification)
        assert 'Test Patient' in notification_str
        assert 'Appointment reminder' in notification_str

    def test_notification_ordering(self):
        """PatientNotification model has Meta.ordering = ['-created_at']."""
        from portal.models import PatientNotification
        assert PatientNotification.objects.model._meta.ordering == ['-created_at']


@pytest.mark.django_db
class TestAdminAuditLogModel:
    def test_create_audit_log(self):
        log = AdminAuditLog.objects.create(
            action=AuditAction.CREATE,
            resource_type='Specialty',
            resource_id='1',
            resource_label='Cardiology',
            actor_name='Admin',
            actor_role='admin',
            detail='Created specialty',
        )
        assert log.action == AuditAction.CREATE
        assert log.resource_type == 'Specialty'
        assert log.actor_name == 'Admin'
        assert log.created_at is not None

    def test_audit_log_str(self):
        log = AdminAuditLog.objects.create(
            action=AuditAction.UPDATE,
            resource_type='Doctor',
            resource_id='5',
            resource_label='Dr. Smith',
            actor_name='Admin',
            actor_role='admin',
        )
        log_str = str(log)
        assert 'UPDATE' in log_str
        assert 'Doctor' in log_str
        assert 'Dr. Smith' in log_str

    def test_audit_log_ordering(self):
        """AdminAuditLog model has Meta.ordering = ['-created_at']."""
        from portal.models import AdminAuditLog
        assert AdminAuditLog.objects.model._meta.ordering == ['-created_at']

    def test_audit_log_all_actions(self):
        for action in AuditAction:
            log = AdminAuditLog.objects.create(
                action=action,
                resource_type='Test',
                resource_label='Test',
                actor_name='Admin',
                actor_role='admin',
            )
            assert log.action == action
