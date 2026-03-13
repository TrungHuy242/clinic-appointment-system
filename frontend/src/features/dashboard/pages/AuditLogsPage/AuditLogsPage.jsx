import React, { useState } from "react";
import { Download, FileText, Settings2, ShieldCheck, Trash2 } from "lucide-react";
import Badge from "../../../../shared/components/Badge/Badge";
import Table from "../../../../shared/components/Table/Table";
import "./AuditLogsPage.css";

const ACTION_CONFIG = {
  CREATE: { label: "Tạo mới", variant: "success" },
  UPDATE: { label: "Cập nhật", variant: "info" },
  DELETE: { label: "Xóa", variant: "danger" },
  LOGIN: { label: "Đăng nhập", variant: "neutral" },
  CHECKIN: { label: "Check-in", variant: "warning" },
  COMPLETE: { label: "Hoàn tất khám", variant: "success" },
};

const MOCK_LOGS = [
  { id: 1, actor: "Lễ tân Nguyễn A", role: "receptionist", action: "CHECKIN", resource: "APT-2026-0011", time: "09/03/2026 08:52", ip: "192.168.1.10", detail: "Check-in PA4 thành công - Nguyễn Văn An" },
  { id: 2, actor: "BS. Nguyễn Thị Sarah", role: "doctor", action: "COMPLETE", resource: "APT-2026-0012", time: "09/03/2026 08:45", ip: "192.168.1.15", detail: "Hoàn tất khám - Chẩn đoán: Viêm da dị ứng" },
  { id: 3, actor: "Admin Trần B", role: "admin", action: "CREATE", resource: "Specialty:Nội khoa", time: "09/03/2026 07:30", ip: "192.168.1.5", detail: "Thêm chuyên khoa Nội khoa" },
  { id: 4, actor: "Lễ tân Nguyễn A", role: "receptionist", action: "LOGIN", resource: "System", time: "09/03/2026 07:59", ip: "192.168.1.10", detail: "Đăng nhập thành công" },
  { id: 5, actor: "Admin Trần B", role: "admin", action: "UPDATE", resource: "Doctor:BS-003", time: "08/03/2026 16:45", ip: "192.168.1.5", detail: "Cập nhật lịch làm việc BS. Trần Thị C" },
  { id: 6, actor: "BS. Nguyễn Văn A", role: "doctor", action: "COMPLETE", resource: "APT-2026-0009", time: "08/03/2026 15:20", ip: "192.168.1.18", detail: "Hoàn tất khám - Nhi khoa" },
  { id: 7, actor: "Admin Trần B", role: "admin", action: "DELETE", resource: "Slot:SL-099", time: "08/03/2026 14:00", ip: "192.168.1.5", detail: "Xóa slot trùng lịch" },
  { id: 8, actor: "Lễ tân Nguyễn A", role: "receptionist", action: "CREATE", resource: "APT-2026-0015", time: "07/03/2026 09:10", ip: "192.168.1.10", detail: "Tạo lịch hẹn mới cho Hoàng Anh Em" },
];

const ROLE_MAP = { receptionist: "Lễ tân", doctor: "Bác sĩ", admin: "Quản trị" };
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

export default function AuditLogsPage() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");

  const filtered = MOCK_LOGS.filter((log) => {
    const matchSearch = !search || log.actor.toLowerCase().includes(search.toLowerCase()) || log.resource.includes(search) || log.detail.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || log.role === roleFilter;
    const matchAction = actionFilter === "all" || log.action === actionFilter;
    return matchSearch && matchRole && matchAction;
  });

  const stats = {
    total: MOCK_LOGS.length,
    create: MOCK_LOGS.filter((item) => item.action === "CREATE").length,
    update: MOCK_LOGS.filter((item) => item.action === "UPDATE").length,
    delete: MOCK_LOGS.filter((item) => item.action === "DELETE").length,
  };

  return (
    <div className="dash-page audit-logs-page">
      <div className="dash-page-header">
        <div>
          <h1 className="dash-page-title">Nhật ký thao tác</h1>
          <p className="dash-page-sub">Theo dõi mọi hành động trên hệ thống MediCare</p>
        </div>
        <button className="dash-btn-primary" type="button"><Download className="mc-icon mc-icon--sm" /> Xuất CSV</button>
      </div>

      <div className="dash-stats-row">
        {STAT_CARDS.map((card) => (
          <div key={card.key} className={`dash-stat-card audit-logs-page__stat-card audit-logs-page__stat-card--${card.tone}`}>
            <div className="dash-stat-icon">{React.createElement(card.icon, { className: "mc-icon mc-icon--md" })}</div>
            <div className="dash-stat-val">{stats[card.key]}</div>
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

      <Table columns={COLUMNS} data={filtered} emptyMessage="Không có kết quả." />
    </div>
  );
}
