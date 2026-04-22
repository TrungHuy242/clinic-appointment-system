import React, { useEffect, useMemo, useState } from "react";
import { Calendar, ChevronDown, Download, FileText, Settings2, ShieldCheck, Trash2, X } from "lucide-react";
import Badge from "../../../components/Badge/Badge";
import LoadingSpinner from "../../../components/LoadingSpinner/LoadingSpinner";
import Table from "../../../components/Table/Table";
import { getAuditLogs } from "../../../services/adminApi";
import { ROLE_LABELS } from "../../../services/authService";
import "./AuditPage.css";

function stripHtml(raw) {
  if (typeof raw !== "string") return "";
  return raw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() || "Đã xảy ra lỗi.";
}

const ACTION_LABELS = {
  CREATE: "Tạo mới",
  UPDATE: "Cập nhật",
  DELETE: "Xóa",
  LOGIN: "Đăng nhập",
  CHECKIN: "Check-in",
  COMPLETE: "Hoàn tất khám",
};

function exportCSV(items) {
  const headers = ["Thời gian", "Người thực hiện", "Vai trò", "Hành động", "Đối tượng", "Chi tiết", "IP"];
  const rows = items.map((item) => [
    item.time || "",
    item.actor || "",
    ROLE_LABELS[item.role] || item.role || "",
    ACTION_LABELS[item.action] || item.action || "",
    item.resource || "",
    item.detail || "",
    item.ip || "",
  ]);
  const csvContent = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `audit-logs-${new Date().toISOString().split("T")[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

const ACTION_CONFIG = {
  CREATE: { label: "Tạo mới", variant: "success" },
  UPDATE: { label: "Cập nhật", variant: "info" },
  DELETE: { label: "Xóa", variant: "danger" },
  LOGIN: { label: "Đăng nhập", variant: "neutral" },
  CHECKIN: { label: "Check-in", variant: "warning" },
  COMPLETE: { label: "Hoàn tất khám", variant: "success" },
};

const STAT_CARDS = [
  { key: "total", label: "Tổng thao tác", icon: FileText, tone: "sky" },
  { key: "create", label: "Tạo mới", icon: ShieldCheck, tone: "green" },
  { key: "update", label: "Cập nhật", icon: Settings2, tone: "blue" },
  { key: "delete", label: "Xóa", icon: Trash2, tone: "red" },
];

const COLUMNS = [
  { key: "time", title: "Thời gian", render: (row) => <span className="audit-logs-page__time">{row.time}</span> },
  {
    key: "actor",
    title: "Người thực hiện",
    render: (row) => (
      <div>
        <div className="audit-logs-page__actor-name">{row.actor}</div>
        <div className="audit-logs-page__actor-role">{ROLE_LABELS[row.role]}</div>
      </div>
    ),
  },
  {
    key: "action",
    title: "Hành động",
    render: (row) => {
      const cfg = ACTION_CONFIG[row.action] ?? { label: row.action, variant: "neutral" };
      return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
    },
  },
  { key: "resource", title: "Đối tượng", render: (row) => <span className="audit-logs-page__resource">{row.resource}</span> },
  { key: "detail", title: "Chi tiết", render: (row) => <span className="audit-logs-page__detail">{row.detail}</span> },
  { key: "ip", title: "IP", render: (row) => <span className="audit-logs-page__ip">{row.ip}</span> },
];

// ── Date helpers ────────────────────────────────────────────────────────────────

function toLocalDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function subtractDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() - days);
  return d;
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

function endOfDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

const DATE_PRESETS = [
  {
    key: "today",
    label: "Hôm nay",
    getRange: () => {
      const today = new Date();
      return { from: toLocalDateStr(today), to: toLocalDateStr(today) };
    },
  },
  {
    key: "yesterday",
    label: "Hôm qua",
    getRange: () => {
      const y = subtractDays(new Date(), 1);
      return { from: toLocalDateStr(y), to: toLocalDateStr(y) };
    },
  },
  {
    key: "last7",
    label: "7 ngày",
    getRange: () => {
      const from = subtractDays(new Date(), 6);
      return { from: toLocalDateStr(from), to: toLocalDateStr(new Date()) };
    },
  },
  {
    key: "last30",
    label: "30 ngày",
    getRange: () => {
      const from = subtractDays(new Date(), 29);
      return { from: toLocalDateStr(from), to: toLocalDateStr(new Date()) };
    },
  },
  {
    key: "thisWeek",
    label: "Tuần này",
    getRange: () => {
      const from = startOfWeek(new Date());
      return { from: toLocalDateStr(from), to: toLocalDateStr(new Date()) };
    },
  },
  {
    key: "thisMonth",
    label: "Tháng này",
    getRange: () => {
      const from = startOfMonth(new Date());
      return { from: toLocalDateStr(from), to: toLocalDateStr(new Date()) };
    },
  },
  {
    key: "custom",
    label: "Tùy chỉnh",
    getRange: () => ({ from: "", to: "" }),
  },
];

export default function AuditPage() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [activePreset, setActivePreset] = useState("thisMonth");
  const [dateFrom, setDateFrom] = useState(() => {
    const from = startOfMonth(new Date());
    return toLocalDateStr(from);
  });
  const [dateTo, setDateTo] = useState(toLocalDateStr(new Date()));
  const [showCustom, setShowCustom] = useState(false);
  const [payload, setPayload] = useState({ items: [], stats: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadAuditLogs() {
      setLoading(true);
      setError("");
      try {
        const data = await getAuditLogs();
        if (mounted) {
          setPayload(data);
        }
      } catch (loadError) {
        if (mounted) {
          setError(stripHtml(loadError.message) || "Không tải được nhật ký thao tác.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadAuditLogs();
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(
    () =>
      (payload.items || []).filter((log) => {
        const matchSearch =
          !search ||
          log.actor.toLowerCase().includes(search.toLowerCase()) ||
          log.resource.includes(search) ||
          log.detail.toLowerCase().includes(search.toLowerCase());
        const matchRole = roleFilter === "all" || log.role === roleFilter;
        const matchAction = actionFilter === "all" || log.action === actionFilter;

        let matchDate = true;
        if (dateFrom || dateTo) {
          // log.time = "21/04/2026 14:30" → parse to YYYY-MM-DD for correct comparison
          const logDateStr = (log.time || "").split(" ")[0];
          if (logDateStr) {
            const parts = logDateStr.split("/");
            if (parts.length === 3) {
              const logDateYMD = `${parts[2]}-${parts[1]}-${parts[0]}`;
              if (dateFrom && logDateYMD < dateFrom) matchDate = false;
              if (dateTo && logDateYMD > dateTo) matchDate = false;
            }
          }
        }

        return matchSearch && matchRole && matchAction && matchDate;
      }),
    [actionFilter, payload.items, roleFilter, search, dateFrom, dateTo]
  );

  function applyPreset(presetKey) {
    setActivePreset(presetKey);
    const preset = DATE_PRESETS.find((p) => p.key === presetKey);
    if (!preset) return;
    const range = preset.getRange();
    setDateFrom(range.from);
    setDateTo(range.to);
    if (presetKey !== "custom") {
      setShowCustom(false);
    }
  }

  function openCustom() {
    setActivePreset("custom");
    setShowCustom(true);
  }

  return (
    <div className="dash-page audit-logs-page">
      <div className="dash-page-header">
        <div>
          <h1 className="dash-page-title">Nhật ký thao tác</h1>
          <p className="dash-page-sub">Theo dõi mọi hành động trên hệ thống MediCare</p>
        </div>
        <button className="dash-btn-primary" type="button" onClick={() => exportCSV(payload.items)}><Download className="mc-icon mc-icon--sm" /> Xuất CSV</button>
      </div>

      <div className="dash-stats-row">
        {STAT_CARDS.map((card) => (
          <div key={card.key} className={`dash-stat-card audit-logs-page__stat-card audit-logs-page__stat-card--${card.tone}`}>
            <div className="dash-stat-icon">{React.createElement(card.icon, { className: "mc-icon mc-icon--md" })}</div>
            <div className="dash-stat-val">{payload.stats?.[card.key] || 0}</div>
            <div className="dash-stat-label">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="dash-filter-bar">
        {/* ── Date range preset buttons ── */}
        <div className="audit-page__date-presets">
          {DATE_PRESETS.filter((p) => p.key !== "custom").map((preset) => (
            <button
              key={preset.key}
              type="button"
              className={`audit-page__preset-btn ${activePreset === preset.key ? "active" : ""}`}
              onClick={() => applyPreset(preset.key)}
            >
              {preset.label}
            </button>
          ))}
          <button
            type="button"
            className={`audit-page__preset-btn audit-page__preset-btn--custom ${activePreset === "custom" ? "active" : ""}`}
            onClick={openCustom}
          >
            <Calendar className="mc-icon mc-icon--xs" />
            Tùy chỉnh
          </button>
        </div>

        {/* ── Custom date range ── */}
        {showCustom && (
          <div className="audit-page__custom-range">
            <input
              type="date"
              className="audit-page__date-input"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setActivePreset("custom");
              }}
              max={dateTo || undefined}
            />
            <span className="audit-page__date-sep">—</span>
            <input
              type="date"
              className="audit-page__date-input"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setActivePreset("custom");
              }}
              min={dateFrom || undefined}
            />
            <button
              type="button"
              className="audit-page__date-clear"
              onClick={() => {
                setShowCustom(false);
                setActivePreset("thisMonth");
                const from = startOfMonth(new Date());
                setDateFrom(toLocalDateStr(from));
                setDateTo(toLocalDateStr(new Date()));
              }}
              title="Quay lại mặc định"
            >
              <X size={12} />
            </button>
          </div>
        )}
      </div>

      {/* ── Second filter row ── */}
      <div className="dash-filter-bar">
        <input className="dash-search-input" placeholder="Tìm theo người dùng, đối tượng, chi tiết..." value={search} onChange={(event) => setSearch(event.target.value)} />
        <select className="dash-filter-select" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
          <option value="all">Tất cả vai trò</option>
          <option value="receptionist">Lễ tân</option>
          <option value="doctor">Bác sĩ</option>
          <option value="admin">Quản trị</option>
        </select>
        <select className="dash-filter-select" value={actionFilter} onChange={(event) => setActionFilter(event.target.value)}>
          <option value="all">Tất cả hành động</option>
          {Object.entries(ACTION_CONFIG).map(([key, value]) => (
            <option key={key} value={key}>{value.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div style={{ padding: "40px", textAlign: "center" }}><LoadingSpinner /></div>
      ) : null}
      {error && !loading ? (
        <div className="audit-page__error">
          {error}
          <button type="button" className="audit-page__error-close" onClick={() => setError("")}>×</button>
        </div>
      ) : null}
      {!loading && !error && <Table columns={COLUMNS} data={filtered} emptyMessage="Không có kết quả." />}
    </div>
  );
}


