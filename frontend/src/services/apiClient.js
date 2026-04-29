import { ENDPOINTS } from "./endpoints";

const _envBase = process.env.REACT_APP_API_BASE_URL || "";
export const API_BASE_URL = _envBase;

const _ACCESS_TOKEN_KEY = "access_token";
const _REFRESH_TOKEN_KEY = "refresh_token";

export function getAccessToken() {
  return localStorage.getItem(_ACCESS_TOKEN_KEY);
}

export function getRefreshToken() {
  return localStorage.getItem(_REFRESH_TOKEN_KEY);
}

export function setTokens(accessToken, refreshToken) {
  if (accessToken) localStorage.setItem(_ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) localStorage.setItem(_REFRESH_TOKEN_KEY, refreshToken);
}

export function clearTokens() {
  localStorage.removeItem(_ACCESS_TOKEN_KEY);
  localStorage.removeItem(_REFRESH_TOKEN_KEY);
}

function buildUrl(path, params) {
  let base;
  if (API_BASE_URL) {
    base = new URL(path, API_BASE_URL);
  } else {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    base = new URL(cleanPath, window.location.origin);
  }

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        base.searchParams.set(key, value);
      }
    });
  }

  return base.toString();
}

function extractErrorMessage(payload) {
  if (typeof payload === "string" && payload.trim()) {
    return payload;
  }

  if (!payload || typeof payload !== "object") {
    return "Yêu cầu thất bại.";
  }

  const [firstValue] = Object.values(payload);

  if (Array.isArray(firstValue) && firstValue[0]) {
    return firstValue[0];
  }

  if (typeof firstValue === "string") {
    return firstValue;
  }

  return "Yêu cầu thất bại.";
}

async function parseResponse(response) {
  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response.text();
}

async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    const resp = await fetch(buildUrl("/auth/refresh/", null), {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    const data = await parseResponse(resp);
    if (data.success && data.access_token) {
      setTokens(data.access_token, null);
      return data.access_token;
    }
  } catch (_) {
    // Refresh failed — clear tokens
  }
  clearTokens();
  return null;
}

async function request(path, { method = "GET", params, body, headers, _noAuth } = {}) {
  // Auto-attach JWT Bearer token (unless _noAuth is set)
  const accessToken = _noAuth ? null : getAccessToken();

  const makeRequest = (token) => {
    const reqHeaders = {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...headers,
    };
    if (token) {
      reqHeaders["Authorization"] = `Bearer ${token}`;
    }
    return fetch(buildUrl(path, params), {
      method,
      credentials: "include",
      headers: reqHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  };

  let response = await makeRequest(accessToken);

  // 401: token expired — try refresh
  if (response.status === 401 && accessToken && !_noAuth) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      response = await makeRequest(newToken);
    }
  }

  const payload = await parseResponse(response);

  if (!response.ok) {
    const error = new Error(extractErrorMessage(payload));
    error.status = response.status;
    error.data = payload;
    throw error;
  }

  // If response contains new tokens (login/register), store them
  if (payload && payload.access_token) {
    setTokens(payload.access_token, payload.refresh_token || null);
  }

  return payload;
}

export const apiClient = {
  baseUrl: API_BASE_URL,
  request,
  get: (path, options) => request(path, { method: "GET", ...options }),
  post: (path, body, options) => request(path, { method: "POST", body, ...options }),
  patch: (path, body, options) => request(path, { method: "PATCH", body, ...options }),
  delete: (path, options) => request(path, { method: "DELETE", ...options }),
};

export default apiClient;
