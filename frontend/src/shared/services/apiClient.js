import { repairMojibakeDeep, repairMojibakeText } from "../utils/text";
import { API_BASE_URL } from "./endpoints";

function buildUrl(path, params) {
  const url = new URL(path, API_BASE_URL);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, value);
      }
    });
  }

  return url.toString();
}

function extractErrorMessage(payload) {
  if (typeof payload === "string" && payload.trim()) {
    return repairMojibakeText(payload);
  }

  if (!payload || typeof payload !== "object") {
    return "Yêu cầu thất bại.";
  }

  const [firstValue] = Object.values(payload);
  if (Array.isArray(firstValue) && firstValue[0]) {
    return repairMojibakeText(firstValue[0]);
  }

  if (typeof firstValue === "string") {
    return repairMojibakeText(firstValue);
  }

  return "Yêu cầu thất bại.";
}

async function parseResponse(response) {
  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return repairMojibakeDeep(await response.json());
  }

  return repairMojibakeText(await response.text());
}

async function request(path, { method = "GET", params, body, headers } = {}) {
  const response = await fetch(buildUrl(path, params), {
    method,
    credentials: 'include', // Send cookies with requests
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

export function mockRequest({
  data,
  delayMs = 400,
  shouldFail = false,
  errorMsg = "Lỗi máy chủ (mock)",
}) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (shouldFail) {
        reject(new Error(repairMojibakeText(errorMsg)));
      } else {
        resolve(repairMojibakeDeep(data));
      }
    }, delayMs);
  });
}
