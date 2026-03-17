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
    lookupByPhone: `${API_PREFIX}/public/appointments/search-by-phone/`,
    detail: (value) => `${API_PREFIX}/public/appointments/${value}/`,
    status: (value) => `${API_PREFIX}/public/appointments/${value}/status/`,
    slots: (doctorId) => `${API_PREFIX}/public/doctors/${doctorId}/slots/`,
    reception: `${API_PREFIX}/reception/appointments/`,
    checkinLookup: `${API_PREFIX}/reception/checkin/lookup/`,
  },
  portal: {
    staffLogin: `${API_PREFIX}/staff/auth/login/`,
    login: `${API_PREFIX}/patient/auth/login/`,
    register: `${API_PREFIX}/patient/auth/register/`,
    profile: `${API_PREFIX}/patient/profile/`,
    account: `${API_PREFIX}/patient/account/`,
    changePassword: `${API_PREFIX}/patient/change-password/`,
    appointments: `${API_PREFIX}/patient/appointments/`,
    record: (code) => `${API_PREFIX}/patient/records/${code}/`,
    claimProfile: `${API_PREFIX}/patient/claim-profile/`,
    notifications: `${API_PREFIX}/patient/notifications/`,
    notification: (id) => `${API_PREFIX}/patient/notifications/${id}/`,
    notificationsMarkAllRead: `${API_PREFIX}/patient/notifications/mark-all-read/`,
    doctorSchedule: `${API_PREFIX}/doctor/schedule/`,
    doctorQueue: `${API_PREFIX}/doctor/queue/`,
    doctorVisits: `${API_PREFIX}/doctor/visits/`,
    doctorVisit: (code) => `${API_PREFIX}/doctor/visits/${code}/`,
    doctorVisitDraft: (code) => `${API_PREFIX}/doctor/visits/${code}/draft/`,
    doctorVisitComplete: (code) => `${API_PREFIX}/doctor/visits/${code}/complete/`,
    receptionPatients: `${API_PREFIX}/reception/patients/`,
    auditLogs: `${API_PREFIX}/admin/audit-logs/`,
    reports: `${API_PREFIX}/admin/reports/`,
  },
};
