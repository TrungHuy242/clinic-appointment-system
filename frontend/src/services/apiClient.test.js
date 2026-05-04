/**
 * Unit tests for apiClient.js
 *
 * Since apiClient.js captures localStorage at module-load time (not function-call time),
 * we test it by spying on the real fetch and localStorage provided by JSDOM.
 */

import {
  apiClient,
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
} from "./apiClient";

let localStorageSpy;
let fetchSpy;

beforeEach(() => {
  localStorage.clear();
  fetchSpy = jest.spyOn(global, "fetch");
});

afterEach(() => {
  fetchSpy.mockRestore();
  jest.restoreAllMocks();
});

describe("getAccessToken", () => {
  test("returns token from localStorage", () => {
    localStorage.setItem("access_token", "my-token");
    expect(getAccessToken()).toBe("my-token");
  });

  test("returns null when not set", () => {
    localStorage.removeItem("access_token");
    expect(getAccessToken()).toBeNull();
  });
});

describe("getRefreshToken", () => {
  test("returns token from localStorage", () => {
    localStorage.setItem("refresh_token", "my-refresh");
    expect(getRefreshToken()).toBe("my-refresh");
  });
});

describe("setTokens", () => {
  test("stores tokens in localStorage", () => {
    localStorageSpy = jest.spyOn(Storage.prototype, "setItem");
    setTokens("access-abc", "refresh-xyz");
    expect(localStorageSpy).toHaveBeenCalledWith("access_token", "access-abc");
    expect(localStorageSpy).toHaveBeenCalledWith("refresh_token", "refresh-xyz");
  });

  test("ignores falsy values", () => {
    localStorageSpy = jest.spyOn(Storage.prototype, "setItem");
    setTokens(null, null);
    expect(localStorageSpy).not.toHaveBeenCalled();
  });

  test("ignores empty string values", () => {
    localStorageSpy = jest.spyOn(Storage.prototype, "setItem");
    setTokens("", "");
    expect(localStorageSpy).not.toHaveBeenCalled();
  });
});

describe("clearTokens", () => {
  test("removes both tokens from localStorage", () => {
    localStorage.setItem("access_token", "tok");
    localStorage.setItem("refresh_token", "ref");
    localStorageSpy = jest.spyOn(Storage.prototype, "removeItem");
    clearTokens();
    expect(localStorageSpy).toHaveBeenCalledWith("access_token");
    expect(localStorageSpy).toHaveBeenCalledWith("refresh_token");
  });
});

describe("apiClient.get", () => {
  test("calls fetch with GET method", async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: { get: () => "application/json" },
      json: () => Promise.resolve({ data: "ok" }),
    });

    await apiClient.get("/test/");

    const [, options] = fetchSpy.mock.calls[0];
    expect(options.method).toBe("GET");
  });

  test("adds Authorization header when token exists", async () => {
    localStorage.setItem("access_token", "jwt-token");
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: { get: () => "application/json" },
      json: () => Promise.resolve({ success: true }),
    });

    await apiClient.get("/test/");

    const [, options] = fetchSpy.mock.calls[0];
    expect(options.headers.Authorization).toBe("Bearer jwt-token");
    expect(options.credentials).toBe("include");
  });

  test("omits Authorization header when no token", async () => {
    localStorage.removeItem("access_token");
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: { get: () => "application/json" },
      json: () => Promise.resolve({ data: "ok" }),
    });

    await apiClient.get("/public/");

    const [, options] = fetchSpy.mock.calls[0];
    expect(options.headers.Authorization).toBeUndefined();
  });

  test("appends params as query string to URL", async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: { get: () => "application/json" },
      json: () => Promise.resolve([]),
    });

    await apiClient.get("/search/", { params: { q: "test", page: 1 } });

    const [url] = fetchSpy.mock.calls[0];
    expect(url).toContain("q=test");
    expect(url).toContain("page=1");
  });

  test("skips null/undefined/empty params", async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: { get: () => "application/json" },
      json: () => Promise.resolve([]),
    });

    await apiClient.get("/filter/", { params: { a: "x", b: null, c: undefined, d: "" } });

    const [url] = fetchSpy.mock.calls[0];
    expect(url).toContain("a=x");
    expect(url).not.toContain("b=");
    expect(url).not.toContain("c=");
    expect(url).not.toContain("d=");
  });
});

describe("apiClient.post", () => {
  test("sends JSON body with Content-Type header", async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      status: 201,
      headers: { get: () => "application/json" },
      json: () => Promise.resolve({ id: 42 }),
    });

    await apiClient.post("/create/", { name: "Alice" });

    const [, options] = fetchSpy.mock.calls[0];
    expect(options.method).toBe("POST");
    expect(options.headers["Content-Type"]).toBe("application/json");
    expect(JSON.parse(options.body)).toEqual({ name: "Alice" });
  });
});

describe("apiClient.patch", () => {
  test("sends PATCH method with JSON body", async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: { get: () => "application/json" },
      json: () => Promise.resolve({ updated: true }),
    });

    await apiClient.patch("/update/1/", { status: "CONFIRMED" });

    const [, options] = fetchSpy.mock.calls[0];
    expect(options.method).toBe("PATCH");
    expect(JSON.parse(options.body)).toEqual({ status: "CONFIRMED" });
  });
});

describe("apiClient.delete", () => {
  test("sends DELETE and returns null for 204", async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      status: 204,
      headers: { get: () => "text/plain" },
    });

    const result = await apiClient.delete("/items/5/");

    const [, options] = fetchSpy.mock.calls[0];
    expect(options.method).toBe("DELETE");
    expect(result).toBeNull();
  });
});

describe("Error handling", () => {
  test("non-ok response throws error with extracted message", async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: false,
      status: 400,
      headers: { get: () => "application/json" },
      json: () => Promise.resolve({ name: ["Tên không hợp lệ."] }),
    });

    await expect(apiClient.post("/test/", {})).rejects.toMatchObject({
      status: 400,
      message: "Tên không hợp lệ.",
    });
  });

  test("error object carries status and data", async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: false,
      status: 401,
      headers: { get: () => "application/json" },
      json: () => Promise.resolve({ detail: "Unauthorized." }),
    });

    try {
      await apiClient.get("/protected/");
      throw new Error("Should have thrown");
    } catch (e) {
      expect(e.status).toBe(401);
      expect(e.data).toEqual({ detail: "Unauthorized." });
    }
  });
});

describe("Token refresh on 401", () => {
  test("401 with valid refresh token retries with new token", async () => {
    localStorage.setItem("access_token", "expired");
    localStorage.setItem("refresh_token", "valid-refresh");
    fetchSpy
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        headers: { get: () => "application/json" },
        json: () => Promise.resolve({}),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: { get: () => "application/json" },
        json: () => Promise.resolve({ success: true, access_token: "new-token" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: { get: () => "application/json" },
        json: () => Promise.resolve({ data: "result" }),
      });

    const result = await apiClient.get("/protected/");

    expect(fetchSpy).toHaveBeenCalledTimes(3);
    // First call used expired token
    expect(fetchSpy.mock.calls[0][1].headers.Authorization).toBe("Bearer expired");
    // Second call was token refresh
    expect(fetchSpy.mock.calls[1][0]).toContain("/auth/refresh/");
    // Third call used new token
    expect(fetchSpy.mock.calls[2][1].headers.Authorization).toBe("Bearer new-token");
    expect(result).toEqual({ data: "result" });
  });

  test("401 without refresh token throws 401 error", async () => {
    localStorage.setItem("access_token", "expired");
    localStorage.removeItem("refresh_token");
    fetchSpy.mockResolvedValueOnce({
      ok: false,
      status: 401,
      headers: { get: () => "application/json" },
      json: () => Promise.resolve({}),
    });

    await expect(apiClient.get("/protected/")).rejects.toMatchObject({ status: 401 });
  });
});
