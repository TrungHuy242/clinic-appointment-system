import { apiClient } from "../../../shared/services/apiClient";
import { ENDPOINTS } from "../../../shared/services/endpoints";

export function getDoctorSchedule(date) {
  return apiClient.get(ENDPOINTS.portal.doctorSchedule, {
    params: date ? { date } : undefined,
  });
}

export function getVisitQueue(date) {
  return apiClient.get(ENDPOINTS.portal.doctorQueue, {
    params: date ? { date } : undefined,
  });
}

export function getVisitDetail(code) {
  return apiClient.get(ENDPOINTS.portal.doctorVisit(code));
}

export function saveDraft(code, data) {
  return apiClient.patch(ENDPOINTS.portal.doctorVisitDraft(code), data);
}

export function completeVisit(code, data) {
  return apiClient.post(ENDPOINTS.portal.doctorVisitComplete(code), data);
}
