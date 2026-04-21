// Default fallback luôn có giá trị hợp lệ cho new URL(base, path)
// Khi Vite/build env có VITE_API_BASE_URL thì dùng env
// Khi dev qua react-scripts proxy thì dùng "" (relative path)
const _envBase = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) || "";
export const API_BASE_URL = _envBase;
export const API_PREFIX = "";

export const ENDPOINTS = {
  catalog: {
    specialties: `${API_PREFIX}/admin/specialties/`,
    specialty: (id) => `${API_PREFIX}/admin/specialties/${id}/`,
    doctors: `${API_PREFIX}/admin/doctors/`,
    doctor: (id) => `${API_PREFIX}/admin/doctors/${id}/`,
    doctorCreateAccount: (id) => `${API_PREFIX}/admin/doctors/${id}/create-account/`,
    visitTypes: `${API_PREFIX}/admin/visit-types/`,
    visitType: (id) => `${API_PREFIX}/admin/visit-types/${id}/`,
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
    adminList: `${API_PREFIX}/admin/appointments/`,
    adminDetail: (id) => `${API_PREFIX}/admin/appointments/${id}/`,
    adminStatus: (id) => `${API_PREFIX}/admin/appointments/${id}/status/`,
    adminReschedule: (id) => `${API_PREFIX}/admin/appointments/${id}/reschedule/`,
    adminHistory: (id) => `${API_PREFIX}/admin/appointments/${id}/history/`,
    dashboard: `${API_PREFIX}/admin/dashboard/`,
  },
  portal: {
    login:      `${API_PREFIX}/auth/login/`,
    register: `${API_PREFIX}/patient/auth/register/`,
    claimProfile: `${API_PREFIX}/patient/claim-profile/`,
    profile: `${API_PREFIX}/patient/profile/`,
    account: `${API_PREFIX}/patient/account/`,
    changePassword: `${API_PREFIX}/patient/change-password/`,
    appointments: `${API_PREFIX}/patient/appointments/`,
    record: (code) => `${API_PREFIX}/patient/records/${code}/`,
    notifications: `${API_PREFIX}/patient/notifications/`,
    notification: (id) => `${API_PREFIX}/patient/notifications/${id}/`,
    notificationsMarkAllRead: `${API_PREFIX}/patient/notifications/mark-all-read/`,
    doctorSchedule: `${API_PREFIX}/doctor/schedule/`,
    doctorQueue: `${API_PREFIX}/doctor/queue/`,
    doctorVisits: `${API_PREFIX}/doctor/visits/`,
    doctorVisit: (code) => `${API_PREFIX}/doctor/visits/${code}/`,
    doctorVisitStart: (code) => `${API_PREFIX}/doctor/visits/${code}/start/`,
    doctorVisitDraft: (code) => `${API_PREFIX}/doctor/visits/${code}/draft/`,
    doctorVisitComplete: (code) => `${API_PREFIX}/doctor/visits/${code}/complete/`,
    doctorProfile: `${API_PREFIX}/doctor/profile/`,
    doctorChangePassword: `${API_PREFIX}/doctor/change-password/`,
    receptionDashboard: `${API_PREFIX}/reception/dashboard/`,
    receptionProfile: `${API_PREFIX}/reception/profile/`,
    receptionChangePassword: `${API_PREFIX}/reception/change-password/`,
    receptionCreateAppointment: `${API_PREFIX}/reception/appointments/create/`,
    receptionPatients: `${API_PREFIX}/reception/patients/`,
    auditLogs: `${API_PREFIX}/admin/audit-logs/`,
    reports: `${API_PREFIX}/admin/reports/`,
    adminDoctorDetail: (id) => `${API_PREFIX}/admin/doctor-detail/${id}/`,
    // AdminUser reset-password: dùng cho doctor accounts (CatalogPage resetUserPassword)
    // NOTE: POST /admin/users/ (create) đã bị disable — chỉ còn reset-password
    adminUserResetPassword: (id) => `${API_PREFIX}/admin/users/${id}/reset-password/`,
    adminReceptionistProfiles: `${API_PREFIX}/admin/receptionist-profiles/`,
    adminReceptionistProfile: (id) => `${API_PREFIX}/admin/receptionist-profiles/${id}/`,
    adminReceptionistProfileResetPassword: (id) => `${API_PREFIX}/admin/receptionist-profiles/${id}/reset-password/`,
    adminPatientProfiles: `${API_PREFIX}/admin/patient-profiles/`,
    adminPatientProfile: (id) => `${API_PREFIX}/admin/patient-profiles/${id}/`,
    adminPatientProfileResetPassword: (id) => `${API_PREFIX}/admin/patient-profiles/${id}/reset-password/`,
  },
};

export default ENDPOINTS;
