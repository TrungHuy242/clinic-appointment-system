import { apiClient } from "../../../shared/services/apiClient";
import { ENDPOINTS } from "../../../shared/services/endpoints";

export function listSpecialties() {
  return apiClient.get(ENDPOINTS.catalog.specialties);
}

export function createSpecialty(payload) {
  return apiClient.post(ENDPOINTS.catalog.specialties, payload);
}

export function updateSpecialty(id, payload) {
  return apiClient.patch(ENDPOINTS.catalog.specialty(id), payload);
}

export function listDoctors() {
  return apiClient.get(ENDPOINTS.catalog.doctors);
}

export function createDoctor(payload) {
  return apiClient.post(ENDPOINTS.catalog.doctors, payload);
}

export function updateDoctor(id, payload) {
  return apiClient.patch(ENDPOINTS.catalog.doctor(id), payload);
}
