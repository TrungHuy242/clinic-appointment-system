from rest_framework.routers import DefaultRouter

from .views import DoctorViewSet, SpecialtyViewSet, VisitTypeViewSet

router = DefaultRouter()
router.register(r'admin/specialties', SpecialtyViewSet, basename='admin-specialty')
router.register(r'admin/doctors', DoctorViewSet, basename='admin-doctor')
router.register(r'admin/visit-types', VisitTypeViewSet, basename='admin-visit-type')

urlpatterns = router.urls
