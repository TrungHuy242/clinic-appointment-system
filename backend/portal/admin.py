from django.contrib import admin
from .models import AdminAuditLog


@admin.register(AdminAuditLog)
class AdminAuditLogAdmin(admin.ModelAdmin):
    list_display = ['created_at', 'actor_name', 'actor_role', 'action', 'resource_type', 'resource_label']
    list_filter = ['action', 'resource_type', 'actor_role']
    search_fields = ['actor_name', 'resource_label', 'detail']
    ordering = ['-created_at']
    readonly_fields = ['created_at', 'action', 'resource_type', 'resource_id',
                       'resource_label', 'actor_name', 'actor_role', 'detail', 'ip_address']
