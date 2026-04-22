from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path('django-admin/', admin.site.urls),  # Đổi admin path tránh conflict
    path('', include('catalog.urls')),
    path('', include('appointments.urls')),
    path('', include('portal.urls')),
]