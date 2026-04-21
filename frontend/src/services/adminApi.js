import { apiClient } from "./apiClient";
import { ENDPOINTS } from "./endpoints";

export const adminApi = {
  // Catalog
  listSpecialties: () => apiClient.get(ENDPOINTS.catalog.specialties),
  createSpecialty: (payload) => apiClient.post(ENDPOINTS.catalog.specialties, payload),
  updateSpecialty: (id, payload) => apiClient.patch(ENDPOINTS.catalog.specialty(id), payload),
  deleteSpecialty: (id) => apiClient.delete(ENDPOINTS.catalog.specialty(id)),
  hardDeleteSpecialty: (id) => apiClient.delete(`${ENDPOINTS.catalog.specialty(id)}hard-delete/`),
  listDoctors: () => apiClient.get(ENDPOINTS.catalog.doctors),
  createDoctor: (payload) => apiClient.post(ENDPOINTS.catalog.doctors, payload),
  updateDoctor: (id, payload) => apiClient.patch(ENDPOINTS.catalog.doctor(id), payload),
  deleteDoctor: (id) => apiClient.delete(ENDPOINTS.catalog.doctor(id)),
  hardDeleteDoctor: (id) => apiClient.delete(`${ENDPOINTS.catalog.doctor(id)}hard-delete/`),
  createDoctorAccount: (doctorId, payload) =>
    apiClient.post(ENDPOINTS.catalog.doctorCreateAccount(doctorId), payload),
  listVisitTypes: () => apiClient.get(ENDPOINTS.catalog.visitTypes),
  createVisitType: (payload) => apiClient.post(ENDPOINTS.catalog.visitTypes, payload),
  updateVisitType: (id, payload) => apiClient.patch(ENDPOINTS.catalog.visitType(id), payload),
  deleteVisitType: (id) => apiClient.delete(ENDPOINTS.catalog.visitType(id)),

  // Receptionist profiles
  listReceptionistProfiles: () => apiClient.get(ENDPOINTS.portal.adminReceptionistProfiles),
  getReceptionistProfile: (id) => apiClient.get(ENDPOINTS.portal.adminReceptionistProfile(id)),
  createReceptionistProfile: (payload) =>
    apiClient.post(ENDPOINTS.portal.adminReceptionistProfiles, payload),
  updateReceptionistProfile: (id, payload) =>
    apiClient.patch(ENDPOINTS.portal.adminReceptionistProfile(id), payload),
  deleteReceptionistProfile: (id) =>
    apiClient.delete(ENDPOINTS.portal.adminReceptionistProfile(id)),

  // Receptionist account password
  resetReceptionistPassword: (id, payload) =>
    apiClient.post(ENDPOINTS.portal.adminReceptionistProfileResetPassword(id), payload),

  // Patient accounts — list, delete, reset-password (không có edit theo spec)
  listPatientProfiles: (params = {}) =>
    apiClient.get(ENDPOINTS.portal.adminPatientProfiles, { params }),
  deletePatientProfile: (id) =>
    apiClient.delete(ENDPOINTS.portal.adminPatientProfile(id)),
  resetPatientPassword: (id, payload) =>
    apiClient.post(ENDPOINTS.portal.adminPatientProfileResetPassword(id), payload),

  // Reports & audit
  getAuditLogs: () => apiClient.get(ENDPOINTS.portal.auditLogs),
  getReports: (period = "year") =>
    apiClient.get(ENDPOINTS.portal.reports, { params: { period } }),

  // Doctor detail
  getDoctorDetail: (doctorId) => apiClient.get(ENDPOINTS.portal.adminDoctorDetail(doctorId)),

  // Doctor account management — reset password via generic user endpoint (CatalogPage)
  // NOTE: POST create/update/delete user đã bị disable ở backend
  resetUserPassword: (id, payload) =>
    apiClient.post(ENDPOINTS.portal.adminUserResetPassword(id), payload),

  // Dashboard
  getDashboard: () => apiClient.get(ENDPOINTS.appointments.dashboard),

  // Admin Appointments
  listAppointments: (params = {}) =>
    apiClient.get(ENDPOINTS.appointments.adminList, { params }),
  updateAppointmentStatus: (id, status, extra = {}) =>
    apiClient.patch(ENDPOINTS.appointments.adminStatus(id), { status, ...extra }),
  rescheduleAppointment: (id, payload) =>
    apiClient.post(ENDPOINTS.appointments.adminReschedule(id), payload),
  getAppointmentHistory: (id) =>
    apiClient.get(ENDPOINTS.appointments.adminHistory(id)),
};

// Named exports for convenience
export const listSpecialties = () => adminApi.listSpecialties();
export const createSpecialty = (payload) => adminApi.createSpecialty(payload);
export const updateSpecialty = (id, payload) => adminApi.updateSpecialty(id, payload);
export const deleteSpecialty = (id) => adminApi.deleteSpecialty(id);
export const hardDeleteSpecialty = (id) => adminApi.hardDeleteSpecialty(id);
export const listDoctors = () => adminApi.listDoctors();
export const createDoctor = (payload) => adminApi.createDoctor(payload);
export const updateDoctor = (id, payload) => adminApi.updateDoctor(id, payload);
export const deleteDoctor = (id) => adminApi.deleteDoctor(id);
export const hardDeleteDoctor = (id) => adminApi.hardDeleteDoctor(id);
export const createDoctorAccount = (doctorId, payload) => adminApi.createDoctorAccount(doctorId, payload);
export const listVisitTypes = () => adminApi.listVisitTypes();
export const createVisitType = (payload) => adminApi.createVisitType(payload);
export const updateVisitType = (id, payload) => adminApi.updateVisitType(id, payload);
export const deleteVisitType = (id) => adminApi.deleteVisitType(id);
export const listReceptionistProfiles = () => adminApi.listReceptionistProfiles();
export const getReceptionistProfile = (id) => adminApi.getReceptionistProfile(id);
export const createReceptionistProfile = (payload) => adminApi.createReceptionistProfile(payload);
export const updateReceptionistProfile = (id, payload) => adminApi.updateReceptionistProfile(id, payload);
export const deleteReceptionistProfile = (id) => adminApi.deleteReceptionistProfile(id);
export const resetReceptionistPassword = (id, payload) => adminApi.resetReceptionistPassword(id, payload);
export const listPatientProfiles = (params) => adminApi.listPatientProfiles(params);
export const deletePatientProfile = (id) => adminApi.deletePatientProfile(id);
export const resetPatientPassword = (id, payload) => adminApi.resetPatientPassword(id, payload);
export const getAuditLogs = () => adminApi.getAuditLogs();
export const getReports = (period) => adminApi.getReports(period);
export const getDoctorDetail = (doctorId) => adminApi.getDoctorDetail(doctorId);
export const resetUserPassword = (id, payload) => adminApi.resetUserPassword(id, payload);
export const getDashboard = () => adminApi.getDashboard();
export const listAppointments = (params) => adminApi.listAppointments(params);
export const updateAppointmentStatus = (id, status, extra) => adminApi.updateAppointmentStatus(id, status, extra);
export const rescheduleAppointment = (id, payload) => adminApi.rescheduleAppointment(id, payload);
export const getAppointmentHistory = (id) => adminApi.getAppointmentHistory(id);
export default adminApi;
