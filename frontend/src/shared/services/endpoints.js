export const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

export const ENDPOINTS = {
  auth: {
    login: "/auth/login",
    register: "/auth/register",
  },
  appointments: {
    booking: "/appointments",
    lookup: "/appointments/lookup",
  },
};
