export const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";
export const API_PREFIX = "/api/v1";

export const ENDPOINTS = {
  catalog: {
    specialties: `${API_PREFIX}/admin/specialties/`,
    specialty: (id) => `${API_PREFIX}/admin/specialties/${id}/`,
    doctors: `${API_PREFIX}/admin/doctors/`,
    doctor: (id) => `${API_PREFIX}/admin/doctors/${id}/`,
  },
  appointments: {
    guest: `${API_PREFIX}/public/appointments/guest/`,
    lookup: `${API_PREFIX}/public/appointments/lookup/`,
    detail: (value) => `${API_PREFIX}/public/appointments/${value}/`,
    status: (value) => `${API_PREFIX}/public/appointments/${value}/status/`,
    slots: (doctorId) => `${API_PREFIX}/public/doctors/${doctorId}/slots/`,
    reception: `${API_PREFIX}/reception/appointments/`,
    checkinLookup: `${API_PREFIX}/reception/checkin/lookup/`,
  },
};
