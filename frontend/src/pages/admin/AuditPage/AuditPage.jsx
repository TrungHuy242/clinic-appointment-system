import React, { useEffect, useMemo, useState } from "react";
import { Download, FileText, Settings2, ShieldCheck, Trash2 } from "lucide-react";
import Badge from "../../../components/Badge/Badge";
import Table from "../../../components/Table/Table";
import { getAuditLogs } from "../../../services/adminApi";
import "./AuditPage.css";

const ROLE_MAP = { receptionist: "Lễ tân", doctor: "Bác sĩ", admin: "Quản trị" };
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
    ROLE_MAP[item.role] || item.role || "",
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
        <div className="audit-logs-page__actor-role">{ROLE_MAP[row.role]}</div>
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

export default function AuditPage() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
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
          setError(loadError.message || "Không tải được nhật ký thao tác.");
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
        return matchSearch && matchRole && matchAction;
      }),
    [actionFilter, payload.items, roleFilter, search]
  );

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

      {loading ? <div className="dash-page-sub">Đang tải nhật ký thao tác...</div> : null}
      {error ? <div className="dash-page-sub">{error}</div> : null}
      {!loading && !error && <Table columns={COLUMNS} data={filtered} emptyMessage="Không có kết quả." />}
    </div>
  );
}


