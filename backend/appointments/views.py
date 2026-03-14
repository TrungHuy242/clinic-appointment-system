from django.shortcuts import get_object_or_404
from rest_framework import status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import AppointmentGuestSerializer, AppointmentSerializer
from .services import get_active_appointments_queryset, soft_delete_appointment


class AppointmentViewSet(viewsets.ModelViewSet):
    serializer_class = AppointmentSerializer

    def get_queryset(self):
        queryset = get_active_appointments_queryset()

        date_value = self.request.query_params.get('date')
        if date_value:
            queryset = queryset.filter(scheduled_start__date=date_value)

        status_value = self.request.query_params.get('status')
        if status_value:
            queryset = queryset.filter(status=status_value)

        doctor_id = self.request.query_params.get('doctor_id')
        if doctor_id:
            queryset = queryset.filter(doctor_id=doctor_id)

        return queryset

    def get_object(self):
        queryset = self.filter_queryset(self.get_queryset())
        lookup_value = self.kwargs.get(self.lookup_field)

        if lookup_value and str(lookup_value).isdigit():
            instance = get_object_or_404(queryset, pk=lookup_value)
        else:
            instance = get_object_or_404(queryset, code=lookup_value)

        self.check_object_permissions(self.request, instance)
        return instance

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        soft_delete_appointment(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)


class GuestAppointmentCreateAPIView(APIView):
    def post(self, request, *args, **kwargs):
        serializer = AppointmentGuestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        appointment = serializer.save()
        response_serializer = AppointmentSerializer(appointment)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)
