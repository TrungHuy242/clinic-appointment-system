from django.contrib import admin

from .models import Appointment


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'code',
        'patient_full_name',
        'doctor',
        'scheduled_start',
        'status',
        'is_deleted',
    )
    search_fields = ('code', 'patient_full_name', 'patient_phone', 'doctor__full_name')
    list_filter = ('status', 'is_deleted', 'specialty', 'doctor')
