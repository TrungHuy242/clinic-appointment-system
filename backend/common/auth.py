from rest_framework.authentication import BaseAuthentication
from rest_framework.permissions import BasePermission


SESSION_USER_KEY = 'portal_user'


class SessionUserAuthentication(BaseAuthentication):
    def authenticate(self, request):
        session = getattr(request, 'session', None)
        if not session:
            return None

        user_data = session.get(SESSION_USER_KEY)
        if not user_data:
            return None

        return (_PortalUser(user_data), None)


class _PortalUser:
    __slots__ = (
        'id',
        'username',
        'email',
        'phone',
        'notes',
        'full_name',
        'role',
        'doctor_id',
        'is_active',
        'is_authenticated',
    )

    def __init__(self, data):
        self.id = data.get('id')
        self.username = data.get('username') or ''
        self.email = data.get('email') or ''
        self.phone = data.get('phone') or ''
        self.notes = data.get('notes') or ''
        self.full_name = data.get('full_name') or ''
        self.role = data.get('role') or ''
        self.doctor_id = data.get('doctor_id')
        self.is_active = data.get('is_active', True)
        self.is_authenticated = True

    def __str__(self):
        return self.full_name or self.username


class _RolePermission(BasePermission):
    allowed_roles = ()

    def has_permission(self, request, view):
        user = getattr(request, 'user', None)
        return bool(
            user
            and getattr(user, 'is_authenticated', False)
            and getattr(user, 'is_active', True)
            and getattr(user, 'role', None) in self.allowed_roles
        )


class IsAdmin(_RolePermission):
    allowed_roles = ('admin',)


class IsDoctor(_RolePermission):
    allowed_roles = ('doctor', 'admin')


class IsReceptionist(_RolePermission):
    allowed_roles = ('receptionist', 'admin')


class IsPatient(_RolePermission):
    allowed_roles = ('patient',)
