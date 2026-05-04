/**
 * Unit tests for formatters.js — pure formatting utilities.
 * No network or DOM dependencies required.
 */
import {
  formatDate,
  formatDateTime,
  formatTime,
  formatSlot,
  formatRelativeDate,
  formatPhone,
  getStatusLabel,
  statusToClass,
  getStatusInfo,
} from "./formatters";

describe("formatDate", () => {
  test("returns em dash for null/undefined", () => {
    expect(formatDate(null)).toBe("—");
    expect(formatDate(undefined)).toBe("—");
  });

  test("returns em dash for invalid date string", () => {
    expect(formatDate("not-a-date")).toBe("—");
  });

  test("formats ISO date string to Vietnamese date", () => {
    const result = formatDate("2026-04-20");
    expect(result).toMatch(/20/);
    expect(result).toMatch(/04/);
    expect(result).toMatch(/2026/);
  });

  test("formats Date object", () => {
    const result = formatDate(new Date("2026-04-20"));
    expect(result).toMatch(/20/);
    expect(result).toMatch(/04/);
  });

  test("accepts custom options", () => {
    const result = formatDate("2026-04-20", { year: "2-digit" });
    expect(result).toMatch(/26/);
  });
});

describe("formatDateTime", () => {
  test("returns em dash for null", () => {
    expect(formatDateTime(null)).toBe("—");
  });

  test("formats Date object to datetime string", () => {
    const d = new Date(2026, 3, 20, 8, 30, 0);
    const result = formatDateTime(d);
    expect(result).toMatch(/20/);
    expect(result).toMatch(/08/);
    expect(result).toMatch(/30/);
  });
});

describe("formatTime", () => {
  test("returns em dash for null", () => {
    expect(formatTime(null)).toBe("—");
  });

  test("formats Date object to HH:MM", () => {
    const d = new Date(2026, 3, 20, 14, 5, 0);
    const result = formatTime(d);
    expect(result).toMatch(/\d{2}:\d{2}/);
  });
});

describe("formatSlot", () => {
  test("formats two Date objects into slot range", () => {
    const start = new Date(2026, 3, 20, 8, 0, 0);
    const end = new Date(2026, 3, 20, 8, 25, 0);
    const result = formatSlot(start, end);
    expect(result).toMatch(/\d{2}:\d{2}/);
  });
});

describe("formatRelativeDate", () => {
  test("returns em dash for null", () => {
    expect(formatRelativeDate(null)).toBe("—");
  });

  test("returns 'Hôm nay' for today", () => {
    const today = new Date();
    expect(formatRelativeDate(today)).toBe("Hôm nay");
  });

  test("returns 'Hôm qua' for yesterday", () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(formatRelativeDate(yesterday)).toBe("Hôm qua");
  });

  test("returns formatted date for older dates", () => {
    const oldDate = new Date(2020, 0, 1);
    const result = formatRelativeDate(oldDate);
    expect(result).not.toBe("Hôm nay");
    expect(result).not.toBe("Hôm qua");
  });
});

describe("formatPhone", () => {
  test("returns em dash for null", () => {
    expect(formatPhone(null)).toBe("—");
  });

  test("formats 10-digit Vietnamese number", () => {
    expect(formatPhone("0909123456")).toBe("0909 123 456");
  });

  test("returns original for non-10-digit numbers", () => {
    expect(formatPhone("12345")).toBe("12345");
    expect(formatPhone("12345678901")).toBe("12345678901");
  });
});

describe("statusToClass", () => {
  test("converts snake_case to kebab-case", () => {
    expect(statusToClass("CHECKED_IN")).toBe("checked-in");
    expect(statusToClass("NO_SHOW")).toBe("no-show");
    expect(statusToClass("IN_PROGRESS")).toBe("in-progress");
  });

  test("lowercases already lowercase values", () => {
    expect(statusToClass("pending")).toBe("pending");
  });

  test("handles null/undefined", () => {
    expect(statusToClass(null)).toBe("");
    expect(statusToClass(undefined)).toBe("");
  });
});

describe("getStatusLabel", () => {
  test("returns em dash for null", () => {
    expect(getStatusLabel(null)).toBe("—");
  });

  test("returns label for uppercase backend status", () => {
    expect(getStatusLabel("PENDING")).toBe("Chờ xác nhận");
    expect(getStatusLabel("CONFIRMED")).toBe("Đã xác nhận");
    expect(getStatusLabel("COMPLETED")).toBe("Hoàn thành");
    expect(getStatusLabel("CANCELLED")).toBe("Đã hủy");
  });

  test("returns label for kebab-case status", () => {
    expect(getStatusLabel("checked-in")).toBe("Đã check-in");
    expect(getStatusLabel("in-progress")).toBe("Đang khám");
  });

  test("returns original value for unknown status", () => {
    expect(getStatusLabel("UNKNOWN_STATUS")).toBe("UNKNOWN_STATUS");
  });
});

describe("getStatusInfo", () => {
  test("returns null for null/undefined", () => {
    expect(getStatusInfo(null)).toBeNull();
    expect(getStatusInfo(undefined)).toBeNull();
  });

  test("returns { label, variant } for known uppercase status", () => {
    const info = getStatusInfo("PENDING");
    expect(info).toHaveProperty("label", "Chờ xác nhận");
    expect(info).toHaveProperty("variant", "warning");
  });

  test("returns null for unknown status", () => {
    expect(getStatusInfo("UNKNOWN")).toBeNull();
  });

  test("returns info for lowercase patient status", () => {
    const info = getStatusInfo("pending");
    expect(info).toHaveProperty("label");
    expect(info).toHaveProperty("variant");
  });
});
