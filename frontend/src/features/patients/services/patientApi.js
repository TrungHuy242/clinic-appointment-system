import { apiClient } from "../../../shared/services/apiClient";
import { ENDPOINTS } from "../../../shared/services/endpoints";

export const appointmentApi = {
  login: (payload) => apiClient.post(ENDPOINTS.portal.login, payload),

  register: (payload) => apiClient.post(ENDPOINTS.portal.register, payload),

  staffLogin: (payload) => apiClient.post(ENDPOINTS.portal.staffLogin, payload),

  getAppointments: (tab = "upcoming") =>
    apiClient.get(ENDPOINTS.portal.appointments, {
      params: { tab },
    }),

  getRecordDetail: (id) => apiClient.get(ENDPOINTS.portal.record(id)),

  claimProfile: (appointmentCode, fullName) =>
    apiClient.post(ENDPOINTS.portal.claimProfile, {
      appointmentCode: appointmentCode.trim().toUpperCase(),
      fullName,
    }),

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
