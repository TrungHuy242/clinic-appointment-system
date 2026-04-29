from django.contrib.auth.hashers import make_password
from django.db import connection
from django.http import JsonResponse
from rest_framework import filters, serializers, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from common.auth import IsAdmin
from portal.models import User
from portal.services import log_admin_action
from .models import Doctor, Specialty, VisitType
from .serializers import DoctorSerializer, SpecialtySerializer, VisitTypeSerializer


# ── Health Check ────────────────────────────────────────────────────────────────

def health_check(request):
    """Lightweight endpoint for Docker healthchecks and load balancers."""
    try:
        with connection.cursor() as cursor:
            cursor.execute('SELECT 1')
        return JsonResponse({'status': 'ok', 'database': 'connected'}, status=200)
    except Exception as e:
        return JsonResponse({'status': 'error', 'database': str(e)}, status=503)


def _admin_actor(request):
    user = getattr(request, 'user', None)
    if user and hasattr(user, 'full_name'):
        return user.full_name, getattr(user, 'role', 'admin'), request.META.get('REMOTE_ADDR')
    return 'System', 'system', request.META.get('REMOTE_ADDR')


# ── Specialty ───────────────────────────────────────────────────────────────────

class SpecialtyViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    serializer_class = SpecialtySerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['name']
    http_method_names = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options']
    lookup_field = 'id'

    def get_queryset(self):
        queryset = Specialty.objects.all().order_by('name')
        is_active = self.request.query_params.get('is_active')
        if is_active in {'true', 'false'}:
            queryset = queryset.filter(is_active=is_active == 'true')
        return queryset

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAdmin()]

    def perform_create(self, serializer):
        instance = serializer.save()
        actor_name, actor_role, ip = _admin_actor(self.request)
        log_admin_action(
            'CREATE', 'Specialty', instance.id, instance.name,
            actor_name=actor_name, actor_role=actor_role,
            detail=f'Tạo chuyên khoa "{instance.name}"', ip_address=ip,
        )

    def perform_update(self, serializer):
        instance = serializer.save()
        actor_name, actor_role, ip = _admin_actor(self.request)
        log_admin_action(
            'UPDATE', 'Specialty', instance.id, instance.name,
            actor_name=actor_name, actor_role=actor_role,
            detail=f'Cập nhật chuyên khoa "{instance.name}"', ip_address=ip,
        )

    def destroy(self, request, *args, **kwargs):
        """
        Soft-delete: set is_active=False (vô hiệu hóa).
        Bản ghi vẫn tồn tại trong DB, không còn xuất hiện trong booking.
        """
        instance = self.get_object()
        instance.is_active = False
        instance.save(update_fields=['is_active'])
        actor_name, actor_role, ip = _admin_actor(request)
        log_admin_action(
            'DEACTIVATE', 'Specialty', instance.id, instance.name,
            actor_name=actor_name, actor_role=actor_role,
            detail=f'Vô hiệu hóa chuyên khoa "{instance.name}"', ip_address=ip,
        )
        return Response(status=204)

    @action(detail=True, methods=['delete'], url_path='hard-delete')
    def hard_delete(self, request, pk=None):
        """
        Hard-delete vĩnh viễn: chỉ cho phép khi không còn doctor nào thuộc khoa này.
        """
        instance = self.get_object()
        doctor_count = Doctor.objects.filter(specialty=instance).count()
        if doctor_count > 0:
            return Response(
                {'detail': f'Không thể xóa vĩnh viễn chuyên khoa này vì vẫn còn {doctor_count} bác sĩ thuộc khoa. Hãy chuyển bác sĩ sang khoa khác hoặc vô hiệu hóa chuyên khoa.'},
                status=400,
            )
        actor_name, actor_role, ip = _admin_actor(request)
        log_admin_action(
            'DELETE', 'Specialty', instance.id, instance.name,
            actor_name=actor_name, actor_role=actor_role,
            detail=f'Xóa vĩnh viễn chuyên khoa "{instance.name}"', ip_address=ip,
        )
        instance.delete()
        return Response(status=204)


# ── Doctor ─────────────────────────────────────────────────────────────────────

class DoctorViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    serializer_class = DoctorSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['full_name']
    http_method_names = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options']
    lookup_field = 'id'

    def get_queryset(self):
        queryset = Doctor.objects.select_related('specialty').all().order_by('full_name')
        specialty_id = self.request.query_params.get('specialty_id')
        if specialty_id:
            queryset = queryset.filter(specialty_id=specialty_id)
        is_active = self.request.query_params.get('is_active')
        if is_active in {'true', 'false'}:
            queryset = queryset.filter(is_active=is_active == 'true')
        return queryset

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAdmin()]

    def create(self, request, *args, **kwargs):
        data = request.data
        specialty = Specialty.objects.filter(pk=data.get('specialty')).first()
        if not specialty:
            return Response({'detail': 'specialty là bắt buộc.'}, status=400)

        doctor = Doctor.objects.create(
            full_name=data.get('full_name', '').strip(),
            phone=data.get('phone', '').strip(),
            email=data.get('email', '').strip(),
            specialty=specialty,
            bio=data.get('bio', '').strip(),
            is_active=bool(data.get('is_active', True)),
        )
        actor_name, actor_role, ip = _admin_actor(request)
        log_admin_action(
            'CREATE', 'Doctor', doctor.id, doctor.full_name,
            actor_name=actor_name, actor_role=actor_role,
            detail=f'Tạo bác sĩ "{doctor.full_name}" — {specialty.name}', ip_address=ip,
        )
        serializer = self.get_serializer(doctor)
        return Response(serializer.data, status=201)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        data = request.data

        update_fields = []
        if 'full_name' in data:
            instance.full_name = data['full_name'].strip()
            update_fields.append('full_name')
        if 'phone' in data:
            instance.phone = data['phone'].strip()
            update_fields.append('phone')
        if 'email' in data:
            instance.email = data['email'].strip()
            update_fields.append('email')
        if 'specialty' in data:
            specialty = Specialty.objects.filter(pk=data['specialty']).first()
            if specialty:
                instance.specialty = specialty
                update_fields.append('specialty')
        if 'bio' in data:
            instance.bio = data['bio'].strip()
            update_fields.append('bio')
        if 'is_active' in data:
            instance.is_active = bool(data['is_active'])
            update_fields.append('is_active')

        if update_fields:
            instance.save(update_fields=update_fields)
            actor_name, actor_role, ip = _admin_actor(request)
            log_admin_action(
                'UPDATE', 'Doctor', instance.id, instance.full_name,
                actor_name=actor_name, actor_role=actor_role,
                detail=f'Cập nhật bác sĩ "{instance.full_name}"', ip_address=ip,
            )

        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def perform_destroy(self, instance):
        """
        Soft-delete: set is_active=False (vô hiệu hóa).
        Bác sĩ vẫn tồn tại trong DB, dữ liệu lịch sử khám/lịch hẹn được giữ nguyên.
        """
        actor_name, actor_role, ip = _admin_actor(self.request)
        log_admin_action(
            'DEACTIVATE', 'Doctor', instance.id, instance.full_name,
            actor_name=actor_name, actor_role=actor_role,
            detail=f'Vô hiệu hóa bác sĩ "{instance.full_name}"', ip_address=ip,
        )
        instance.is_active = False
        instance.save(update_fields=['is_active'])

    @action(detail=True, methods=['delete'], url_path='hard-delete')
    def hard_delete(self, request, pk=None):
        """
        Hard-delete vĩnh viễn: chỉ cho phép khi không còn lịch hẹn hay tài khoản nào.
        """
        instance = self.get_object()
        from appointments.models import Appointment
        from portal.models import User

        appointment_count = Appointment.objects.filter(doctor=instance).count()
        user_account = User.objects.filter(doctor=instance, role='doctor').first()

        deps = []
        if appointment_count > 0:
            deps.append(f'{appointment_count} lịch hẹn')
        if user_account:
            deps.append(f'tài khoản đăng nhập @{user_account.username}')

        if deps:
            return Response(
                {'detail': f'Không thể xóa vĩnh viễn bác sĩ này vì đã phát sinh {" và ".join(deps)}. Hãy dùng chức năng vô hiệu hóa.'},
                status=400,
            )

        actor_name, actor_role, ip = _admin_actor(request)
        log_admin_action(
            'DELETE', 'Doctor', instance.id, instance.full_name,
            actor_name=actor_name, actor_role=actor_role,
            detail=f'Xóa vĩnh viễn bác sĩ "{instance.full_name}"', ip_address=ip,
        )
        instance.delete()
        return Response(status=204)

    @action(detail=True, methods=['post'], url_path='create-account')
    def create_account(self, request, pk=None):
        doctor = self.get_object()

        existing = User.objects.filter(doctor=doctor, role='doctor').first()
        if existing:
            return Response({'detail': 'Bác sĩ này đã có tài khoản.'}, status=400)

        username = request.data.get('username', '').strip()
        password = request.data.get('password', '').strip()

        if not username:
            return Response({'detail': 'username là bắt buộc.'}, status=400)
        if len(password) < 6:
            return Response({'detail': 'Mật khẩu phải ít nhất 6 ký tự.'}, status=400)
        if User.objects.filter(username__iexact=username).exists():
            return Response({'detail': 'Tên đăng nhập đã tồn tại.'}, status=400)

        user = User.objects.create(
            username=username,
            password=make_password(password),
            full_name=doctor.full_name,
            email=request.data.get('email', '').strip(),
            role='doctor',
            doctor=doctor,
            is_active=True,
        )
        actor_name, actor_role, ip = _admin_actor(request)
        log_admin_action(
            'CREATE_ACCOUNT', 'DoctorAccount', user.id, f'@{user.username}',
            actor_name=actor_name, actor_role=actor_role,
            detail=f'Tạo tài khoản doctor "@{user.username}" cho BS. {doctor.full_name}', ip_address=ip,
        )
        return Response({
            'id': user.id,
            'username': user.username,
            'full_name': user.full_name,
        }, status=201)

    @action(detail=True, methods=['post'], url_path='reset-password')
    def reset_password(self, request, pk=None):
        """Reset password for the User account linked to this Doctor."""
        doctor = self.get_object()

        user = User.objects.filter(doctor=doctor, role='doctor').first()
        if not user:
            return Response({'detail': 'Bác sĩ này chưa có tài khoản.'}, status=400)

        new_password = request.data.get('new_password') or request.data.get('password') or ''
        if len(new_password) < 6:
            return Response({'detail': 'Mật khẩu phải ít nhất 6 ký tự.'}, status=400)

        user.password = make_password(new_password)
        user.save(update_fields=['password', 'updated_at'])

        actor_name, actor_role, ip = _admin_actor(request)
        log_admin_action(
            'RESET_PASSWORD', 'DoctorAccount', user.id, f'@{user.username}',
            actor_name=actor_name, actor_role=actor_role,
            detail=f'Đặt lại mật khẩu doctor "@{user.username}" cho BS. {doctor.full_name}', ip_address=ip,
        )
        return Response({'success': True})


# ── VisitType ───────────────────────────────────────────────────────────────────

class VisitTypeViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdmin]
    serializer_class = VisitTypeSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['name']
    lookup_field = 'id'

    def get_queryset(self):
        queryset = VisitType.objects.all().order_by('name')
        is_active = self.request.query_params.get('is_active')
        if is_active in {'true', 'false'}:
            queryset = queryset.filter(is_active=is_active == 'true')
        return queryset

    def perform_create(self, serializer):
        instance = serializer.save()
        actor_name, actor_role, ip = _admin_actor(self.request)
        log_admin_action(
            'CREATE', 'VisitType', instance.id, instance.name,
            actor_name=actor_name, actor_role=actor_role,
            detail=f'Tạo loại khám "{instance.name}"', ip_address=ip,
        )

    def perform_update(self, serializer):
        instance = serializer.save()
        actor_name, actor_role, ip = _admin_actor(self.request)
        log_admin_action(
            'UPDATE', 'VisitType', instance.id, instance.name,
            actor_name=actor_name, actor_role=actor_role,
            detail=f'Cập nhật loại khám "{instance.name}"', ip_address=ip,
        )

    def perform_destroy(self, instance):
        """
        Soft-delete: set is_active=False (vô hiệu hóa).
        """
        actor_name, actor_role, ip = _admin_actor(self.request)
        log_admin_action(
            'DEACTIVATE', 'VisitType', instance.id, instance.name,
            actor_name=actor_name, actor_role=actor_role,
            detail=f'Vô hiệu hóa loại khám "{instance.name}"', ip_address=ip,
        )
        instance.is_active = False
        instance.save(update_fields=['is_active'])

    @action(detail=True, methods=['delete'], url_path='hard-delete')
    def hard_delete(self, request, pk=None):
        """
        Hard-delete vĩnh viễn: chỉ cho phép khi không có appointment nào dùng loại khám này.
        """
        instance = self.get_object()
        from appointments.models import Appointment
        appt_count = Appointment.objects.filter(visit_type=instance).count()
        if appt_count > 0:
            return Response(
                {'detail': f'Không thể xóa vĩnh viễn vì đã có {appt_count} lịch hẹn sử dụng loại khám này. Hãy dùng chức năng vô hiệu hóa.'},
                status=400,
            )
        actor_name, actor_role, ip = _admin_actor(request)
        log_admin_action(
            'DELETE', 'VisitType', instance.id, instance.name,
            actor_name=actor_name, actor_role=actor_role,
            detail=f'Xóa vĩnh viễn loại khám "{instance.name}"', ip_address=ip,
        )
        instance.delete()
        return Response(status=204)
