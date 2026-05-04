from rest_framework.routers import DefaultRouter
from django.urls import path

from .views import DoctorViewSet, SpecialtyViewSet, VisitTypeViewSet, health_check

router = DefaultRouter()
router.register(r'admin/specialties', SpecialtyViewSet, basename='admin-specialty')
router.register(r'admin/doctors', DoctorViewSet, basename='admin-doctor')
router.register(r'admin/visit-types', VisitTypeViewSet, basename='admin-visit-type')

urlpatterns = router.urls + [
    path('api/health/', health_check, name='health-check'),
]
