import { apiClient } from "./apiClient";
import { ENDPOINTS } from "./endpoints";

export const adminApi = {
  listSpecialties: () => apiClient.get(ENDPOINTS.catalog.specialties),
  createSpecialty: (payload) => apiClient.post(ENDPOINTS.catalog.specialties, payload),
  updateSpecialty: (id, payload) => apiClient.patch(ENDPOINTS.catalog.specialty(id), payload),
  listDoctors: () => apiClient.get(ENDPOINTS.catalog.doctors),
  createDoctor: (payload) => apiClient.post(ENDPOINTS.catalog.doctors, payload),
  updateDoctor: (id, payload) => apiClient.patch(ENDPOINTS.catalog.doctor(id), payload),
  getAuditLogs: () => apiClient.get(ENDPOINTS.portal.auditLogs),
  getReports: (period = "year") =>
    apiClient.get(ENDPOINTS.portal.reports, {
      params: { period },
    }),
};

export const listSpecialties = () => adminApi.listSpecialties();
export const createSpecialty = (payload) => adminApi.createSpecialty(payload);
export const updateSpecialty = (id, payload) => adminApi.updateSpecialty(id, payload);
export const listDoctors = () => adminApi.listDoctors();
export const createDoctor = (payload) => adminApi.createDoctor(payload);
export const updateDoctor = (id, payload) => adminApi.updateDoctor(id, payload);
export const getAuditLogs = () => adminApi.getAuditLogs();
export const getReports = (period = "year") => adminApi.getReports(period);
export default adminApi;
