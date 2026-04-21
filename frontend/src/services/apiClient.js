import { API_BASE_URL } from "./endpoints";

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

async function request(path, { method = "GET", params, body, headers } = {}) {
  const response = await fetch(buildUrl(path, params), {
    method,
    credentials: "include",
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const payload = await parseResponse(response);

  if (!response.ok) {
    const error = new Error(extractErrorMessage(payload));
    error.status = response.status;
    error.data = payload;
    throw error;
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
