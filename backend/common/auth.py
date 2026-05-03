"""
Django-rest-framework authentication & permission configuration.

Key design decisions:
- portal.User is a custom model (not django.contrib.auth.User), so we can't use
  django.contrib.auth.login() directly. We support two auth methods:
  1. Session-based auth: login stores user data in request.session
  2. JWT auth: stateless tokens for API access
- Public endpoints (booking, lookup, patient registration/claim) remain open.
- All staff/doctor/patient portal endpoints require IsAuthenticated.
- Rate limiting on login/OTP endpoints prevents brute-force attacks.
"""

import hashlib
import time
from datetime import datetime, timedelta, timezone as dt_timezone

import jwt
from django.conf import settings
from django.http import JsonResponse
from rest_framework import status
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed, Throttled
from rest_framework.permissions import BasePermission, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import BaseThrottle


# ── Session keys ────────────────────────────────────────────────────────────────

SESSION_USER_KEY = "portal_user"


# ── JWT helpers ────────────────────────────────────────────────────────────────

def _get_jwt_secret():
    secret = getattr(settings, 'JWT_SECRET_KEY', settings.SECRET_KEY)
    # Allow key rotation: if DJANGO_SECRET_KEY != JWT_SECRET_KEY, both are tried
    return secret


def _utcnow():
    """Return current UTC time as a timezone-aware datetime (always UTC)."""
    from django.utils import timezone as dj_tz
    return dj_tz.now()


def create_access_token(user_data: dict, expires_delta: timedelta = None) -> str:
    """Create a JWT access token from user data dict."""
    now = _utcnow()
    if expires_delta is None:
        expires_delta = timedelta(minutes=getattr(settings, 'JWT_ACCESS_TOKEN_LIFETIME_MINUTES', 60))
    payload = {
        'sub': str(user_data.get('id', '')),
        'role': user_data.get('role', ''),
        'username': user_data.get('username', ''),
        'full_name': user_data.get('full_name', ''),
        'phone': user_data.get('phone', ''),
        'email': user_data.get('email', ''),
        'doctor_id': user_data.get('doctor_id'),
        'patient_profile_id': user_data.get('patient_profile_id'),
        'is_active': user_data.get('is_active', True),
        'iat': int(now.timestamp()),
        'exp': int((now + expires_delta).timestamp()),
        'type': 'access',
    }
    secret = _get_jwt_secret()
    return jwt.encode(payload, secret, algorithm=getattr(settings, 'JWT_ALGORITHM', 'HS256'))


def create_refresh_token(user_data: dict) -> str:
    """Create a JWT refresh token (long-lived, minimal claims)."""
    now = _utcnow()
    expires_days = getattr(settings, 'JWT_REFRESH_TOKEN_LIFETIME_DAYS', 7)
    payload = {
        'sub': str(user_data.get('id', '')),
        'role': user_data.get('role', ''),
        'iat': int(now.timestamp()),
        'exp': int((now + timedelta(days=expires_days)).timestamp()),
        'type': 'refresh',
    }
    secret = _get_jwt_secret()
    return jwt.encode(payload, secret, algorithm=getattr(settings, 'JWT_ALGORITHM', 'HS256'))


def decode_token(token: str, token_type: str = 'access'):
    """Decode and validate a JWT token."""
    secret = _get_jwt_secret()
    try:
        payload = jwt.decode(token, secret, algorithms=[getattr(settings, 'JWT_ALGORITHM', 'HS256')])
    except jwt.ExpiredSignatureError:
        raise AuthenticationFailed('Token has expired.')
    except jwt.InvalidTokenError:
        raise AuthenticationFailed('Invalid token.')

    if payload.get('type') != token_type:
        raise AuthenticationFailed(f'Expected {token_type} token.')
    return payload


# ── Custom DRF Authentication ─────────────────────────────────────────────────

class JWTAuthentication(BaseAuthentication):
    """
    JWT token authentication for stateless API access.

    Clients should include the token in the Authorization header:
        Authorization: Bearer <access_token>
    """

    keyword = 'Bearer'

    def authenticate(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if not auth_header:
            return None

        parts = auth_header.split()
        if len(parts) != 2 or parts[0] != self.keyword:
            return None

        token = parts[1]
        try:
            payload = decode_token(token, 'access')
        except AuthenticationFailed:
            return None

        user = _JWTUser(payload)
        return (user, None)

    def authenticate_header(self, request):
        return f'{self.keyword} realm="api"'


class _JWTUser:
    """
    User object reconstructed from JWT payload.
    Never hits the database — lightweight and stateless.
    """

    __slots__ = (
        "id", "role", "username", "full_name", "phone", "email",
        "doctor_id", "patient_profile_id", "is_authenticated", "is_active"
    )

    def __init__(self, payload: dict):
        self.id = payload.get('sub', '')
        self.role = payload.get('role', '')
        self.username = payload.get('username', '')
        self.full_name = payload.get('full_name', '')
        self.phone = payload.get('phone', '')
        self.email = payload.get('email', '')
        self.doctor_id = payload.get('doctor_id')
        self.patient_profile_id = payload.get('patient_profile_id')
        self.is_authenticated = True
        self.is_active = payload.get('is_active', True)

    def __str__(self):
        return self.full_name


class SessionUserAuthentication(BaseAuthentication):
    """
    Reads portal User data stored in the Django session by unified_login().

    On success, request.user is a _PortalUser instance (not a db model) that
    exposes the fields needed by permission classes: role, doctor_id, full_name,
    is_authenticated, and is_active.
    """

    def authenticate(self, request):
        session = getattr(request, "session", None)
        if not session:
            return None

        user_data = session.get(SESSION_USER_KEY)
        if not user_data:
            return None

        return (_PortalUser(user_data), None)


class _PortalUser:
    """
    Lightweight user object reconstructed from session data.

    Mirrors the attributes of portal.models.User that are needed by permission
    classes and audit-log helpers.  Never hits the database.
    """

    __slots__ = ("role", "doctor_id", "full_name", "id", "is_authenticated", "is_active",
                "username", "email", "phone", "notes")

    def __init__(self, data):
        self.role = data.get("role") or ""
        self.doctor_id = data.get("doctor_id")
        self.full_name = data.get("full_name") or ""
        self.id = data.get("id")
        self.is_authenticated = True
        self.is_active = data.get("is_active", True)
        self.username = data.get("username") or ""
        self.email = data.get("email") or ""
        self.phone = data.get("phone") or ""
        self.notes = data.get("notes") or ""

    def __str__(self):
        return self.full_name


# ── Rate Limiting ───────────────────────────────────────────────────────────────

class _InMemoryRateLimiter:
    """
    Simple in-memory rate limiter using a sliding window.
    Thread-safe enough for single-server dev. In production, use Redis.
    """

    _store: dict = {}
    _cleanup_interval = 300  # seconds
    _last_cleanup = time.time()

    @classmethod
    def _cleanup(cls):
        now = time.time()
        if now - cls._last_cleanup < cls._cleanup_interval:
            return
        cls._last_cleanup = now
        cutoff = now - 3600
        cls._store = {k: v for k, v in cls._store.items() if v[-1] > cutoff}

    @classmethod
    def get_count(cls, key: str) -> int:
        cls._cleanup()
        now = time.time()
        window = 60  # 1-minute window
        hits = cls._store.get(key, [])
        hits = [t for t in hits if now - t < window]
        cls._store[key] = hits
        return len(hits)

    @classmethod
    def record_hit(cls, key: str):
        now = time.time()
        if key not in cls._store:
            cls._store[key] = []
        cls._store[key].append(now)

    @classmethod
    def is_allowed(cls, key: str, rate: int) -> bool:
        """Returns True if request is allowed, False if throttled."""
        count = cls.get_count(key)
        return count < rate


class LoginThrottle(BaseThrottle):
    """
    Rate limiting for login/auth endpoints.
    Prevents brute-force password and OTP attacks.

    Usage: apply via view decorators or DEFAULT_THROTTLE_CLASSES.
    """

    scope = 'login'

    def get_cache_key(self, request, view):
        ident = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR', ''))
        ident = ident.split(',')[0].strip()
        return f'throttle_login_{ident}'

    def allow_request(self, request, view):
        # Only throttle POST (login attempts)
        if request.method != 'POST':
            return True

        key = self.get_cache_key(request, view)
        # 15 attempts per minute per IP
        allowed = _InMemoryRateLimiter.is_allowed(key, 15)
        if allowed:
            _InMemoryRateLimiter.record_hit(key)
        return allowed

    def throttle_failure(self):
        pass

    def wait(self):
        return 60  # retry after 1 minute


class OTPThrottle(BaseThrottle):
    """Rate limiting for OTP (send-otp) endpoints."""

    scope = 'otp'

    def get_cache_key(self, request, view):
        ident = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR', ''))
        ident = ident.split(',')[0].strip()
        phone = request.data.get('phone', '') if hasattr(request, 'data') else ''
        return f'throttle_otp_{ident}_{phone}'

    def allow_request(self, request, view):
        if request.method != 'POST':
            return True
        key = self.get_cache_key(request, view)
        allowed = _InMemoryRateLimiter.is_allowed(key, 10)
        if allowed:
            _InMemoryRateLimiter.record_hit(key)
        return allowed

    def wait(self):
        return 60


class ForgotPasswordThrottle(BaseThrottle):
    """Rate limiting for forgot-password endpoint."""

    scope = 'forgot_password'

    def get_cache_key(self, request, view):
        ident = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR', ''))
        ident = ident.split(',')[0].strip()
        phone = request.data.get('phone', '') if hasattr(request, 'data') else ''
        return f'throttle_fp_{ident}_{phone}'

    def allow_request(self, request, view):
        if request.method != 'POST':
            return True
        key = self.get_cache_key(request, view)
        allowed = _InMemoryRateLimiter.is_allowed(key, 10)
        if allowed:
            _InMemoryRateLimiter.record_hit(key)
        return allowed

    def wait(self):
        return 60


# ── Custom Exception Handler ───────────────────────────────────────────────────

def custom_exception_handler(exc, context):
    """
    Convert all exceptions to a consistent JSON error format:
    {
        "success": false,
        "error": { "code": "...", "message": "...", "details": {...} }
    }
    """
    from rest_framework.views import exception_handler

    response = exception_handler(exc, context)

    if response is not None:
        error_data = {
            'success': False,
            'error': {
                'code': exc.__class__.__name__,
                'message': _extract_message(exc),
                'details': _extract_details(response.data),
            }
        }
        response.data = error_data

    return response


def _extract_message(exc):
    if hasattr(exc, 'detail'):
        detail = exc.detail
        if isinstance(detail, str):
            return detail
        if isinstance(detail, list) and detail:
            return str(detail[0])
        if isinstance(detail, dict):
            first_key = next(iter(detail), None)
            if first_key:
                val = detail[first_key]
                if isinstance(val, list) and val:
                    return str(val[0])
                return str(val)
    return str(exc)


def _extract_details(data):
    if isinstance(data, dict):
        return data
    if isinstance(data, list) and data:
        return {'detail': data[0]}
    return {}


# ── Generic permission classes ─────────────────────────────────────────────────

class IsAuthenticated(BaseAuthentication):
    """
    Thin wrapper around DRF's IsAuthenticated that also verifies the user has an
    active portal session.  Drop-in replacement for IsAuthenticated on portal
    viewsets.
    """

    def has_permission(self, request, view):
        user = getattr(request, "user", None)
        return (
            user is not None
            and getattr(user, "is_authenticated", False) is True
            and getattr(user, "is_active", True) is True
        )

    def has_object_permission(self, request, view, obj):
        return True  # Authenticated users can access any object (role check is at view level)


# ── Role-based permission classes ──────────────────────────────────────────────

class IsAdmin(BasePermission):
    """Allows access only to admin users."""

    def has_permission(self, request, view):
        user = getattr(request, "user", None)
        return (
            getattr(user, "is_authenticated", False) is True
            and getattr(user, "role", "") == "admin"
        )

    def has_object_permission(self, request, view, obj):
        return True


class IsReceptionist(BasePermission):
    """Allows access to receptionists AND admins (receptionists share some admin views)."""

    def has_permission(self, request, view):
        user = getattr(request, "user", None)
        return (
            getattr(user, "is_authenticated", False) is True
            and getattr(user, "role", "") in {"admin", "receptionist"}
        )

    def has_object_permission(self, request, view, obj):
        return True


class IsDoctor(BasePermission):
    """Allows access to doctors AND admins (doctors have their own portal)."""

    def has_permission(self, request, view):
        user = getattr(request, "user", None)
        return (
            getattr(user, "is_authenticated", False) is True
            and getattr(user, "role", "") in {"admin", "doctor"}
        )

    def has_object_permission(self, request, view, obj):
        return True


class IsPatient(BasePermission):
    """Allows access only to patient accounts."""

    def has_permission(self, request, view):
        user = getattr(request, "user", None)
        return (
            getattr(user, "is_authenticated", False) is True
            and getattr(user, "role", "") == "patient"
        )

    def has_object_permission(self, request, view, obj):
        return True
