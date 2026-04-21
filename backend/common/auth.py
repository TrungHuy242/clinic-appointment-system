"""
Django-rest-framework authentication & permission configuration.

Key design decisions:
- portal.User is a custom model (not django.contrib.auth.User), so we can't use
  django.contrib.auth.login() directly. Instead, we use session-based auth where
  the login handler stores user data in request.session and a custom
  SessionUserAuthentication class reconstructs a lightweight user object on each
  request.
- Public endpoints (booking, lookup, patient registration/claim) remain open.
- All staff/doctor/patient portal endpoints require IsAuthenticated.
- Role permission classes gate access to each portal group.
"""

from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.permissions import BasePermission, IsAuthenticated


# ── Session keys ────────────────────────────────────────────────────────────────

SESSION_USER_KEY = "portal_user"


# ── Custom DRF Authentication ─────────────────────────────────────────────────

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
