from rest_framework import filters, viewsets

from .models import Doctor, Specialty
from .serializers import DoctorSerializer, SpecialtySerializer


class SpecialtyViewSet(viewsets.ModelViewSet):
    serializer_class = SpecialtySerializer
    queryset = Specialty.objects.all().order_by('name')
    filter_backends = [filters.SearchFilter]
    search_fields = ['name']


class DoctorViewSet(viewsets.ModelViewSet):
    serializer_class = DoctorSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['full_name']

    def get_queryset(self):
        queryset = Doctor.objects.select_related('specialty').all().order_by('full_name')

        specialty_id = self.request.query_params.get('specialty_id')
        if specialty_id:
            queryset = queryset.filter(specialty_id=specialty_id)

        is_active = self.request.query_params.get('is_active')
        if is_active in {'true', 'false'}:
            queryset = queryset.filter(is_active=is_active == 'true')

        return queryset
