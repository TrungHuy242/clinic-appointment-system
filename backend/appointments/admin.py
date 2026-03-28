from django.contrib import admin

from .models import Appointment, AppointmentHistory


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


@admin.register(AppointmentHistory)
class AppointmentHistoryAdmin(admin.ModelAdmin):
    list_display = ('id', 'appointment', 'action', 'changed_by', 'changed_by_role', 'created_at')
    list_filter = ('action', 'changed_by_role')
    search_fields = ('appointment__code', 'changed_by', 'note')
    readonly_fields = ('appointment', 'action', 'changed_by', 'changed_by_role', 'note', 'created_at')
