from rest_framework.permissions import BasePermission


class HasRole(BasePermission):
    """Simple role gate for future DRF views.

    TODO: adopt gradually where API permissions move out of ad-hoc service logic.
    """

    allowed_roles = ()

    def has_permission(self, request, view):
        user = getattr(request, "user", None)
        role = getattr(user, "role", None)
        return bool(user and getattr(user, "is_authenticated", False) and role in self.allowed_roles)


class IsAdmin(HasRole):
    allowed_roles = ("admin",)


class IsDoctor(HasRole):
    allowed_roles = ("doctor",)


class IsReceptionist(HasRole):
    allowed_roles = ("receptionist",)


class IsPatient(HasRole):
    allowed_roles = ("patient",)
