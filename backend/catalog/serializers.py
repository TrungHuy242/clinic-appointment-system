import re

from rest_framework import serializers

from .models import Doctor, Specialty


PHONE_PATTERN = re.compile(r'^\+?[0-9][0-9\s\-()]{7,18}$')


def validate_phone_number(value, field_name, required):
    if value is None:
        if required:
            raise serializers.ValidationError(f'{field_name} is required.')
        return value

    value = value.strip()
    if not value:
        if required:
            raise serializers.ValidationError(f'{field_name} is required.')
        return ''

    if not PHONE_PATTERN.match(value):
        raise serializers.ValidationError(
            f'{field_name} must contain 8-15 digits and may include +, spaces, parentheses, or hyphens.'
        )

    digits = ''.join(char for char in value if char.isdigit())
    if not 8 <= len(digits) <= 15:
        raise serializers.ValidationError(
            f'{field_name} must contain 8-15 digits and may include +, spaces, parentheses, or hyphens.'
        )

    return value


class SpecialtySerializer(serializers.ModelSerializer):
    name = serializers.CharField(
        required=True,
        allow_blank=False,
        trim_whitespace=True,
        max_length=100,
        error_messages={
            'required': 'name is required.',
            'blank': 'name is required.',
            'max_length': 'name must be at most 100 characters.',
        },
    )

    class Meta:
        model = Specialty
        fields = ['id', 'name', 'description', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']

    def validate_name(self, value):
        value = value.strip()
        if len(value) < 2:
            raise serializers.ValidationError('name must be at least 2 characters long.')

        queryset = Specialty.objects.filter(name__iexact=value)
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)

        if queryset.exists():
            raise serializers.ValidationError('name must be unique.')

        return value


class DoctorSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(
        required=True,
        allow_blank=False,
        trim_whitespace=True,
        max_length=150,
        error_messages={
            'required': 'full_name is required.',
            'blank': 'full_name is required.',
            'max_length': 'full_name must be at most 150 characters.',
        },
    )
    specialty = serializers.PrimaryKeyRelatedField(
        queryset=Specialty.objects.all(),
        error_messages={
            'required': 'specialty is required.',
            'null': 'specialty is required.',
            'does_not_exist': 'specialty does not exist.',
            'incorrect_type': 'specialty must be an integer id.',
        },
    )
    specialty_name = serializers.CharField(source='specialty.name', read_only=True)

    class Meta:
        model = Doctor
        fields = [
            'id',
            'full_name',
            'phone',
            'specialty',
            'specialty_name',
            'bio',
            'is_active',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at', 'specialty_name']

    def validate_full_name(self, value):
        value = value.strip()
        if len(value) < 2:
            raise serializers.ValidationError('full_name must be at least 2 characters long.')
        return value

    def validate_phone(self, value):
        return validate_phone_number(value, 'phone', required=False)
