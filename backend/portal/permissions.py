from functools import wraps

from rest_framework.response import Response


ROLE_PERMISSIONS = {
    'guest': [
        'GET /api/catalog/admin/specialties/',
        'GET /api/catalog/admin/doctors/',
        'POST /api/appointments/public/',
        'GET /api/appointments/public/',
        'GET /api/appointments/public/lookup/',
        'GET /api/appointments/public/*/status/',
        'GET /api/appointments/public/*/',
        'GET /api/appointments/public/doctors/*/slots/',
        'POST /api/portal/patient/auth/login/',
        'POST /api/portal/patient/auth/register/',
    ],
    'patient': [
        'GET /api/portal/patient/',
        'PATCH /api/portal/patient/',
        'GET /api/portal/patient/account/',
        'PATCH /api/portal/patient/account/',
        'POST /api/portal/patient/change-password/',
        'GET /api/portal/patient/appointments/',
        'GET /api/portal/patient/records/*/',
        'POST /api/portal/patient/claim-profile/',
        'GET /api/portal/patient/notifications/',
        'POST /api/portal/patient/notifications/mark-all-read/',
        'GET /api/portal/patient/notifications/*/',
        # Guest
        'GET /api/catalog/admin/specialties/',
        'GET /api/catalog/admin/doctors/',
    ],
    'receptionist': [
        'GET /api/portal/reception/patients/',
        'GET /api/portal/reception/checkin/lookup/',
        'GET /api/portal/reception/appointments/',
        'GET /api/portal/reception/appointments/*/',
        'PATCH /api/portal/reception/appointments/*/',
        'POST /api/portal/reception/appointments/',
        'DELETE /api/portal/reception/appointments/*/',
        'GET /api/portal/patient/',
        'PATCH /api/portal/patient/',
        'GET /api/portal/patient/appointments/',
        'GET /api/portal/patient/notifications/',
        'GET /api/catalog/admin/specialties/',
        'GET /api/catalog/admin/doctors/',
        'POST /api/catalog/admin/specialties/',
        'PATCH /api/catalog/admin/specialties/*/',
        'DELETE /api/catalog/admin/specialties/*/',
        'POST /api/catalog/admin/doctors/',
        'PATCH /api/catalog/admin/doctors/*/',
        'DELETE /api/catalog/admin/doctors/*/',
    ],
    'doctor': [
        'GET /api/portal/doctor/schedule/',
        'GET /api/portal/doctor/queue/',
        'GET /api/portal/doctor/visits/*/',
        'PATCH /api/portal/doctor/visits/*/draft/',
        'POST /api/portal/doctor/visits/*/complete/',
        'GET /api/catalog/admin/specialties/',
        'GET /api/catalog/admin/doctors/',
    ],
    'admin': [
        'GET /api/portal/admin/audit-logs/',
        'GET /api/portal/admin/reports/',
        'GET /api/portal/reception/patients/',
        'GET /api/portal/reception/checkin/lookup/',
        'GET /api/portal/reception/appointments/',
        'GET /api/portal/reception/appointments/*/',
        'PATCH /api/portal/reception/appointments/*/',
        'POST /api/portal/reception/appointments/',
        'DELETE /api/portal/reception/appointments/*/',
        'GET /api/portal/doctor/schedule/',
        'GET /api/portal/doctor/queue/',
        'GET /api/portal/doctor/visits/*/',
        'GET /api/portal/patient/',
        'PATCH /api/portal/patient/',
        'GET /api/portal/patient/appointments/',
        'GET /api/portal/patient/notifications/',
        'GET /api/catalog/admin/specialties/',
        'GET /api/catalog/admin/doctors/',
        'POST /api/catalog/admin/specialties/',
        'PATCH /api/catalog/admin/specialties/*/',
        'DELETE /api/catalog/admin/specialties/*/',
        'POST /api/catalog/admin/doctors/',
        'PATCH /api/catalog/admin/doctors/*/',
        'DELETE /api/catalog/admin/doctors/*/',
    ],
}


def check_role_permission(role, method, path):
    """Check if role has permission to access the path."""
    permissions = ROLE_PERMISSIONS.get(role, [])
    
    # Check exact match
    if f'{method} {path}' in permissions:
        return True
    
    # Check wildcard patterns
    for perm in permissions:
        if '*' in perm:
            perm_method, perm_path = perm.split(' ', 1)
            if method == perm_method:
                perm_pattern = perm_path.replace('*', '[^/]+')
                import re
                if re.match(f'^{perm_pattern}$', path):
                    return True
    
    return False


def role_required(allowed_roles):
    """Decorator to check role permissions."""
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            # Get role from request
            role = getattr(request, 'user_role', 'guest')
            
            if role not in allowed_roles:
                return Response(
                    {'error': f'Không có quyền truy cập. Yêu cầu vai trò: {allowed_roles}'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            return view_func(request, *args, **kwargs)
        return wrapper
    return decorator
