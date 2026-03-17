import { apiClient } from "../../../shared/services/apiClient";
import { ENDPOINTS } from "../../../shared/services/endpoints";

export const doctorApi = {
  getSchedule: async (date) => {
    const params = date ? { date } : {};
    return apiClient.get(ENDPOINTS.portal.doctorSchedule, { params });
  },
  
  getQueue: async () => {
    return apiClient.get(ENDPOINTS.portal.doctorQueue);
  },
  
  getVisits: async (filter = "all") => {
    return apiClient.get(ENDPOINTS.portal.doctorVisit, { 
      params: { status: filter } 
    });
  },
  
  getVisitDetail: async (code) => {
    return apiClient.get(ENDPOINTS.portal.doctorVisit(code));
  },
  
  saveDraft: async (code, data) => {
    return apiClient.patch(ENDPOINTS.portal.doctorVisitDraft(code), data);
  },
  
  completeVisit: async (code, data) => {
    return apiClient.post(ENDPOINTS.portal.doctorVisitComplete(code), data);
  },
};
