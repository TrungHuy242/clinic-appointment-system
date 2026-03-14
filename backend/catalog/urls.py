from rest_framework.routers import DefaultRouter

from .views import DoctorViewSet, SpecialtyViewSet

router = DefaultRouter()
router.register(r'admin/specialties', SpecialtyViewSet, basename='admin-specialty')
router.register(r'admin/doctors', DoctorViewSet, basename='admin-doctor')

urlpatterns = router.urls
