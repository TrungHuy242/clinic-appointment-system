import React, { useState } from "react";
import Badge from "../../../components/common/Badge";
import Table from "../../../components/common/Table";
import "../../../styles/pages/dashboard.css";

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

const COLS = [
    { key: "time", title: "Thời gian", render: r => <span style={{ fontSize: 13, fontFamily: "monospace" }}>{r.time}</span> },
    {
        key: "actor", title: "Người thực hiện", render: r => (
            <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{r.actor}</div>
                <div style={{ fontSize: 11, color: "var(--color-text-muted)" }}>{ROLE_MAP[r.role]}</div>
            </div>
        )
    },
    {
        key: "action", title: "Hành động", render: r => {
            const cfg = ACTION_CONFIG[r.action] ?? { label: r.action, variant: "neutral" };
            return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
        }
    },
    {
        key: "resource", title: "Đối tượng", render: r => (
            <span style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 600, color: "var(--color-primary)" }}>{r.resource}</span>
        )
    },
    { key: "detail", title: "Chi tiết", render: r => <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>{r.detail}</span> },
    { key: "ip", title: "IP", render: r => <span style={{ fontSize: 12, fontFamily: "monospace" }}>{r.ip}</span> },
];

export default function AuditLogs() {
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [actionFilter, setActionFilter] = useState("all");

    const filtered = MOCK_LOGS.filter(log => {
        const matchSearch = !search || log.actor.toLowerCase().includes(search.toLowerCase()) || log.resource.includes(search) || log.detail.toLowerCase().includes(search.toLowerCase());
        const matchRole = roleFilter === "all" || log.role === roleFilter;
        const matchAction = actionFilter === "all" || log.action === actionFilter;
        return matchSearch && matchRole && matchAction;
    });

    return (
        <div className="dash-page">
            <div className="dash-page-header">
                <div>
                    <h1 className="dash-page-title">Nhật ký thao tác</h1>
                    <p className="dash-page-sub">Theo dõi mọi hành động trên hệ thống MediCare</p>
                </div>
                <button className="dash-btn-primary">⬇ Xuất CSV</button>
            </div>

            {/* Stats */}
            <div className="dash-stats-row">
                {[
                    { label: "Tổng thao tác", value: MOCK_LOGS.length, icon: "📋", color: "#e0f2fe" },
                    { label: "Tạo mới", value: MOCK_LOGS.filter(l => l.action === "CREATE").length, icon: "✅", color: "#dcfce7" },
                    { label: "Cập nhật", value: MOCK_LOGS.filter(l => l.action === "UPDATE").length, icon: "✏️", color: "#eff6ff" },
                    { label: "Xóa", value: MOCK_LOGS.filter(l => l.action === "DELETE").length, icon: "🗑️", color: "#fee2e2" },
                ].map(s => (
                    <div key={s.label} className="dash-stat-card" style={{ background: s.color }}>
                        <div className="dash-stat-icon">{s.icon}</div>
                        <div className="dash-stat-val">{s.value}</div>
                        <div className="dash-stat-label">{s.label}</div>
                    </div>
                ))}
            </div>

            <div className="dash-filter-bar">
                <input className="dash-search-input" placeholder="🔍 Tìm theo người dùng, đối tượng, chi tiết..."
                    value={search} onChange={e => setSearch(e.target.value)} />
                <select className="dash-filter-select" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
                    <option value="all">Tất cả vai trò</option>
                    <option value="receptionist">Lễ tân</option>
                    <option value="doctor">Bác sĩ</option>
                    <option value="admin">Quản trị</option>
                </select>
                <select className="dash-filter-select" value={actionFilter} onChange={e => setActionFilter(e.target.value)}>
                    <option value="all">Tất cả hành động</option>
                    {Object.entries(ACTION_CONFIG).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                    ))}
                </select>
            </div>

            <div className="mc-table-wrapper">
                <Table columns={COLS} data={filtered} emptyMessage="Không có kết quả." />
            </div>
        </div>
    );
}
