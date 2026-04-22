from django.contrib.auth.hashers import make_password
from rest_framework import serializers

from .models import PatientProfile, User


class UserSerializer(serializers.ModelSerializer):
    role_label = serializers.CharField(source="get_role_display", read_only=True)
    doctor_name = serializers.CharField(source="doctor.__str__", read_only=True, allow_null=True)

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "full_name",
            "email",
            "phone",
            "notes",
            "role",
            "role_label",
            "doctor",
            "doctor_name",
            "is_active",
            "created_at",
        ]
        read_only_fields = ["id", "created_at", "role_label", "doctor_name"]


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    # NOTE: doctor/admin role creation is intentionally NOT supported here.
    # Doctor accounts must be created from DoctorDetailPage (profile-first).
    # Admin/receptionist accounts are managed via dedicated flows.
    # This endpoint only supports generic user management.

    class Meta:
        model = User
        fields = ["id", "username", "password", "full_name", "email", "phone", "notes", "is_active"]
        read_only_fields = ["id"]

    def create(self, validated_data):
        validated_data["password"] = make_password(validated_data["password"])
        validated_data["role"] = "patient"
        return super().create(validated_data)


class UserUpdateSerializer(serializers.ModelSerializer):
    # NOTE: role and doctor FK are read-only after creation.

    class Meta:
        model = User
        fields = ["full_name", "email", "phone", "notes", "is_active"]


class ReceptionistProfileSerializer(serializers.ModelSerializer):
    """Serializer for receptionist profile — no doctor FK, no password exposed."""

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "full_name",
            "email",
            "phone",
            "notes",
            "is_active",
            "created_at",
        ]
        read_only_fields = ["id", "created_at", "username"]


class ReceptionistProfileCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ["id", "username", "password", "full_name", "email", "phone", "notes", "is_active"]
        read_only_fields = ["id"]

    def create(self, validated_data):
        validated_data["password"] = make_password(validated_data["password"])
        validated_data["role"] = "receptionist"
        return super().create(validated_data)


class ReceptionistProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["full_name", "email", "phone", "notes", "is_active"]


class UserPasswordResetSerializer(serializers.Serializer):
    new_password = serializers.CharField(write_only=True, min_length=6)

    def validate_new_password(self, value):
        if len(value) < 6:
            raise serializers.ValidationError("Mật khẩu phải có ít nhất 6 ký tự.")
        return value

    def update(self, instance, validated_data):
        instance.password = make_password(validated_data["new_password"])
        instance.save(update_fields=["password", "updated_at"])
        return instance


# ── Patient Account Management ───────────────────────────────────────────────

class PatientProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = PatientProfile
        fields = [
            "id",
            "full_name",
            "phone",
            "account_email",
            "dob",
            "gender",
            "allergies",
            "notes",
            "account_username",
            "is_current",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "account_username", "is_current", "created_at", "updated_at"]


class PatientProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = PatientProfile
        fields = ["full_name", "phone", "account_email", "dob", "gender", "allergies", "notes"]


class PatientPasswordResetSerializer(serializers.Serializer):
    new_password = serializers.CharField(write_only=True, min_length=6)

    def validate_new_password(self, value):
        if len(value) < 6:
            raise serializers.ValidationError("Mật khẩu phải có ít nhất 6 ký tự.")
        return value

    def update(self, instance, validated_data):
        instance.account_password = make_password(validated_data["new_password"])
        instance.save(update_fields=["account_password", "updated_at"])
        return instance
