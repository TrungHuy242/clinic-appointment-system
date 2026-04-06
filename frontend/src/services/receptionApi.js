import { apiClient } from "./apiClient";
import { ENDPOINTS } from "./endpoints";

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

export const receptionApi = {
  listAppointments: (date) =>
    apiClient
      .get(ENDPOINTS.appointments.reception, {
        params: { date },
      })
      .then((data) => data.map(mapAppointment)),
  checkinLookup: (query, date) =>
    apiClient.post(ENDPOINTS.appointments.checkinLookup, {
      query,
      date,
    }).then((data) => ({
      state: data.state,
      message: data.message,
      appointment: data.appointment ? mapAppointment(data.appointment) : null,
    })),
  getPatients: () => apiClient.get(ENDPOINTS.portal.receptionPatients),
  moveToWaiting: (id) =>
    apiClient.patch(`/api/v1/reception/move-to-waiting/${id}/`),
};

export const listTodayAppointments = (date) => receptionApi.listAppointments(date);
export const checkinLookup = (query, date) => receptionApi.checkinLookup(query, date);
export const getReceptionPatients = () => receptionApi.getPatients();
export default receptionApi;
