/**
 * Shared formatting utilities for the MediCare Clinic frontend.
 * Centralizes all date/time/phone/status/role formatting
 * to avoid repeated inline transformations across pages.
 */

// ─── Date & Time ─────────────────────────────────────────────────────────────

/** Get today's date formatted as Vietnamese string. */
export function getToday() {
  return new Date().toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/** Format a date value (string, Date, or ISO string) to Vietnamese date string.
 *  Input: "2026-04-20" → Output: "20/04/2026" */
export function formatDate(value, options = {}) {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    ...options,
  });
}

/** Format a date value to Vietnamese datetime string.
 *  Input: "2026-04-20T08:30:00Z" → Output: "20/04/2026 08:30" */
export function formatDateTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Format a datetime value to just the time portion (HH:MM). */
export function formatTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Format a slot range "HH:MM - HH:MM". Accepts two separate values or
 *  a combined ISO string. */
export function formatSlot(start, end) {
  return `${formatTime(start)} – ${formatTime(end)}`;
}

/** Relative date label: "Hôm nay", "Hôm qua", or date string. */
export function formatRelativeDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "—";
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "Hôm nay";
  if (d.toDateString() === yesterday.toDateString()) return "Hôm qua";
  return formatDate(value);
}

// ─── Phone ──────────────────────────────────────────────────────────────────

/** Format phone number for display: "0901 234 567". */
export function formatPhone(value) {
  if (!value) return "—";
  const digits = String(value).replace(/\D/g, "");
  if (digits.length === 10) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }
  return String(value);
}

// ─── Status Labels ───────────────────────────────────────────────────────────

/** Complete appointment status → display label map (kebab-case keys).
 *  Use this for UI labels and badge text. */
export const STATUS_LABELS = {
  "pending":          "Chờ xác nhận",
  "confirmed":        "Đã xác nhận",
  "checked-in":       "Đã check-in",
  "in-progress":      "Đang khám",
  "completed":        "Hoàn thành",
  "cancelled":        "Đã hủy",
  "no-show":          "No-show",
  // Raw backend snake_case keys (fallback)
  "PENDING":          "Chờ xác nhận",
  "CONFIRMED":        "Đã xác nhận",
  "CHECKED_IN":       "Đã check-in",
  "IN_PROGRESS":      "Đang khám",
  "COMPLETED":        "Hoàn thành",
  "CANCELLED":        "Đã hủy",
  "NO_SHOW":          "No-show",
};

/** Convert raw backend status (e.g. "CHECKED_IN") to kebab-case (e.g. "checked-in").
 *  Use for CSS class names and for indexing STATUS_LABELS. */
export function statusToClass(status) {
  return (status || "").toLowerCase().replace(/_/g, "-");
}

/** Get the display label for a raw backend status value. */
export function getStatusLabel(status) {
  if (!status) return "—";
  return STATUS_LABELS[statusToClass(status)] || STATUS_LABELS[status] || status;
}

/** Get display label AND badge variant for a status.
 *  Returns { label, variant } or null if not found. */
export const STATUS_INFO = {
  // Admin / reception appointment statuses (uppercase raw from backend)
  PENDING:        { label: "Chờ xác nhận",   variant: "warning" },
  CONFIRMED:      { label: "Đã xác nhận",    variant: "success" },
  CHECKED_IN:     { label: "Đã check-in",     variant: "info"    },
  IN_PROGRESS:    { label: "Đang khám",       variant: "info"    },
  COMPLETED:      { label: "Hoàn thành",      variant: "neutral" },
  CANCELLED:      { label: "Đã hủy",          variant: "danger"  },
  NO_SHOW:        { label: "Không đến",        variant: "danger"  },
  WAITING:        { label: "Đang chờ bác sĩ", variant: "warning" },
  // Patient appointment statuses (lowercase remapped from backend)
  pending:        { label: "Chờ xác nhận", variant: "warning" },
  confirmed:      { label: "Đã xác nhận",  variant: "success" },
  completed:      { label: "Hoàn thành",  variant: "neutral" },
  cancelled:      { label: "Đã hủy",       variant: "danger"  },
  "no-show":      { label: "No-show",       variant: "danger"  },
};

/** Get the { label, variant } for a status. */
export function getStatusInfo(status) {
  if (!status) return null;
  return STATUS_INFO[status] || null;
}

/** Patient-level status mapping (returned by patientApi.getAppointments).
 *  These are the remapped lowercase values from PATIENT_STATUS_MAP on backend. */
export const PATIENT_STATUS_LABELS = {
  "pending":    { label: "Chờ xác nhận",  className: "status-pending"   },
  "confirmed":  { label: "Đã xác nhận",   className: "status-confirmed" },
  "completed":  { label: "Hoàn thành",    className: "status-completed" },
  "cancelled":  { label: "Đã hủy",        className: "status-cancelled" },
  "no-show":    { label: "No-show",        className: "status-no-show"   },
};

/** Doctor visit queue status → display label. */
export const VISIT_STATUS_LABELS = {
  waiting:      { label: "Chờ khám",   variant: "neutral" },
  checked_in:   { label: "Đã check-in", variant: "info"    },
  in_progress:  { label: "Đang khám",  variant: "warning" },
  done:         { label: "Hoàn tất",   variant: "success" },
};

/** Receptionist check-in state → display label. */
export const CHECKIN_STATE_LABELS = {
  early:     { label: "Đến sớm",       variant: "info"    },
  valid:     { label: "Check-in OK",   variant: "success" },
  late:      { label: "Đến muộn",      variant: "danger"  },
  not_found: { label: "Không tìm thấy", variant: "danger"  },
};

// ─── Role Labels ────────────────────────────────────────────────────────────
// Re-export from authService to avoid duplication
export { ROLE_LABELS } from "./authService";
