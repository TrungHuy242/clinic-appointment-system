import { apiClient } from "./apiClient";
import { ENDPOINTS } from "./endpoints";

export const doctorApi = {
  getSchedule: (date) =>
    apiClient.get(ENDPOINTS.portal.doctorSchedule, {
      params: date ? { date } : undefined,
    }),
  getQueue: (date) =>
    apiClient.get(ENDPOINTS.portal.doctorQueue, {
      params: date ? { date } : undefined,
    }),
  getVisits: (status = "all") =>
    apiClient.get(ENDPOINTS.portal.doctorVisits, {
      params: status ? { status } : undefined,
    }),
  getVisitDetail: (code) => apiClient.get(ENDPOINTS.portal.doctorVisit(code)),
  startVisit: (code) => apiClient.post(ENDPOINTS.portal.doctorVisitStart(code)),
  saveDraft: (code, data) => apiClient.patch(ENDPOINTS.portal.doctorVisitDraft(code), data),
  completeVisit: (code, data) => apiClient.post(ENDPOINTS.portal.doctorVisitComplete(code), data),
};

export const getDoctorSchedule = (date) => doctorApi.getSchedule(date);
export const getVisitQueue = (date) => doctorApi.getQueue(date);
export const getVisitDetail = (code) => doctorApi.getVisitDetail(code);
export const startVisit = (code) => doctorApi.startVisit(code);
export const saveDraft = (code, data) => doctorApi.saveDraft(code, data);
export const completeVisit = (code, data) => doctorApi.completeVisit(code, data);
export default doctorApi;
