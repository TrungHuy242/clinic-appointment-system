import { apiClient } from "../../../shared/services/apiClient";
import { ENDPOINTS } from "../../../shared/services/endpoints";

function formatTime(value) {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function buildSlotLabel(startValue, endValue) {
  return `${formatTime(startValue)} - ${formatTime(endValue)}`;
}

function mapAppointment(row) {
  return {
    id: row.id,
    code: row.code,
    patientName: row.patient_full_name,
    phone: row.patient_phone,
    specialty: row.specialty_name,
    doctor: row.doctor_name,
    slot: buildSlotLabel(row.scheduled_start, row.scheduled_end),
    status: row.status,
    checkinAt: row.status === "CHECKED_IN" ? formatTime(row.updated_at) : null,
    scheduledStart: row.scheduled_start,
    scheduledEnd: row.scheduled_end,
  };
}

export function listTodayAppointments(date) {
  return apiClient
    .get(ENDPOINTS.appointments.reception, {
      params: { date },
    })
    .then((data) => data.map(mapAppointment));
}

export function checkinLookup(query, date) {
  return apiClient
    .post(ENDPOINTS.appointments.checkinLookup, {
      query,
      date,
    })
    .then((data) => ({
      state: data.state,
      appointment: data.appointment ? mapAppointment(data.appointment) : null,
    }));
}
