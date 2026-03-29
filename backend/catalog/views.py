from django.contrib.auth.hashers import make_password
from rest_framework import filters, serializers, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from portal.models import User
from portal.services import log_admin_action
from .models import Doctor, Specialty, VisitType
from .serializers import DoctorSerializer, SpecialtySerializer, VisitTypeSerializer


def _admin_actor(request):
    user = getattr(request, 'user', None)
    if user and hasattr(user, 'full_name'):
        return user.full_name, getattr(user, 'role', 'admin'), request.META.get('REMOTE_ADDR')
    return 'Admin', 'admin', request.META.get('REMOTE_ADDR')


# ── Specialty ───────────────────────────────────────────────────────────────────

class SpecialtyViewSet(viewsets.ModelViewSet):
    serializer_class = SpecialtySerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['name']

    def get_queryset(self):
        queryset = Specialty.objects.all().order_by('name')
        is_active = self.request.query_params.get('is_active')
        if is_active in {'true', 'false'}:
            queryset = queryset.filter(is_active=is_active == 'true')
        return queryset

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

    # Soft-delete: set is_active=False
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.is_active = False
        instance.save(update_fields=['is_active'])
        actor_name, actor_role, ip = _admin_actor(request)
        log_admin_action(
            'DELETE', 'Specialty', instance.id, instance.name,
            actor_name=actor_name, actor_role=actor_role,
            detail=f'Xóa chuyên khoa "{instance.name}"', ip_address=ip,
        )
        return Response(status=204)


# ── Doctor ─────────────────────────────────────────────────────────────────────

class DoctorViewSet(viewsets.ModelViewSet):
    serializer_class = DoctorSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['full_name']

    def get_queryset(self):
        queryset = Doctor.objects.select_related('specialty').all().order_by('full_name')
        specialty_id = self.request.query_params.get('specialty_id')
        if specialty_id:
            queryset = queryset.filter(specialty_id=specialty_id)
        is_active = self.request.query_params.get('is_active')
        if is_active in {'true', 'false'}:
            queryset = queryset.filter(is_active=is_active == 'true')
        return queryset

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
        actor_name, actor_role, ip = _admin_actor(self.request)
        log_admin_action(
            'DELETE', 'Doctor', instance.id, instance.full_name,
            actor_name=actor_name, actor_role=actor_role,
            detail=f'Xóa bác sĩ "{instance.full_name}"', ip_address=ip,
        )
        instance.delete()

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


# ── VisitType ───────────────────────────────────────────────────────────────────

class VisitTypeViewSet(viewsets.ModelViewSet):
    serializer_class = VisitTypeSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['name']

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
        actor_name, actor_role, ip = _admin_actor(self.request)
        log_admin_action(
            'DELETE', 'VisitType', instance.id, instance.name,
            actor_name=actor_name, actor_role=actor_role,
            detail=f'Xóa loại khám "{instance.name}"', ip_address=ip,
        )
        instance.delete()
