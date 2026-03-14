from rest_framework import serializers

from .models import Doctor, Specialty


class SpecialtySerializer(serializers.ModelSerializer):
    class Meta:
        model = Specialty
        fields = ['id', 'name', 'description', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']


class DoctorSerializer(serializers.ModelSerializer):
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
