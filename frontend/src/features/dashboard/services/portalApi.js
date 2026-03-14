import { apiClient } from "../../../shared/services/apiClient";
import { ENDPOINTS } from "../../../shared/services/endpoints";

export function getReceptionPatients() {
  return apiClient.get(ENDPOINTS.portal.receptionPatients);
}

export function getAuditLogs() {
  return apiClient.get(ENDPOINTS.portal.auditLogs);
}

export function getReports(period = "year") {
  return apiClient.get(ENDPOINTS.portal.reports, {
    params: { period },
  });
}
