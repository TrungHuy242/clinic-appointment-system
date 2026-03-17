import { apiClient } from "./apiClient";
import { ENDPOINTS } from "./endpoints";

export const patientApi = {
  getAppointments: (tab = "upcoming") =>
    apiClient.get(ENDPOINTS.portal.appointments, {
      params: { tab },
    }),
  getRecordDetail: (id) => apiClient.get(ENDPOINTS.portal.record(id)),
  getHealthProfile: () => apiClient.get(ENDPOINTS.portal.profile),
  updateHealthProfile: (payload) => apiClient.patch(ENDPOINTS.portal.profile, payload),
  getAccountInfo: () => apiClient.get(ENDPOINTS.portal.account),
  updateAccountInfo: (payload) => apiClient.patch(ENDPOINTS.portal.account, payload),
  changePassword: (payload) => apiClient.post(ENDPOINTS.portal.changePassword, payload),
  getNotifications: () => apiClient.get(ENDPOINTS.portal.notifications),
  markNotificationRead: (id) => apiClient.patch(ENDPOINTS.portal.notification(id), {}),
  markAllNotificationsRead: () => apiClient.post(ENDPOINTS.portal.notificationsMarkAllRead, {}),
  deleteNotification: (id) => apiClient.delete(ENDPOINTS.portal.notification(id)),
};

export const appointmentApi = patientApi;
export default patientApi;
