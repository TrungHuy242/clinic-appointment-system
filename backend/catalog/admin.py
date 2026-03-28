from django.contrib import admin

from .models import Doctor, Specialty, VisitType


@admin.register(Specialty)
class SpecialtyAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'is_active', 'created_at')
    search_fields = ('name',)
    list_filter = ('is_active',)


@admin.register(Doctor)
class DoctorAdmin(admin.ModelAdmin):
    list_display = ('id', 'full_name', 'specialty', 'phone', 'is_active', 'created_at')
    search_fields = ('full_name', 'phone', 'specialty__name')
    list_filter = ('is_active', 'specialty')


@admin.register(VisitType)
class VisitTypeAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'duration_minutes', 'price', 'is_active', 'created_at')
    search_fields = ('name',)
    list_filter = ('is_active',)
