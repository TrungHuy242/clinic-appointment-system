import React, { useEffect, useState } from "react";
import Badge from "../../../components/common/Badge";
import Button from "../../../components/common/Button";
import Table from "../../../components/common/Table";
import LoadingSpinner from "../../../components/common/LoadingSpinner";
import { listTodayAppointments } from "../../../services/appointmentsApi";
import "../../../styles/pages/dashboard.css";

const STATUS_CONFIG = {
    CONFIRMED: { label: "Đã xác nhận", variant: "success" },
    PENDING_PA1: { label: "Chờ xác nhận", variant: "warning" },
    CHECKED_IN: { label: "Đã check-in", variant: "info" },
    CANCELLED: { label: "Đã hủy", variant: "danger" },
    COMPLETED: { label: "Hoàn tất", variant: "neutral" },
};

const COLS = [
    {
        key: "code", title: "Mã lịch hẹn", render: r => (
            <span style={{ fontFamily: "monospace", fontWeight: 700, color: "var(--color-primary)", fontSize: 13 }}>{r.code}</span>
        )
    },
    { key: "patientName", title: "Bệnh nhân", dataIndex: "patientName" },
    { key: "specialty", title: "Chuyên khoa", dataIndex: "specialty" },
    {
        key: "slot", title: "Giờ hẹn", render: r => (
            <span style={{ fontWeight: 600, fontSize: 13 }}>{r.slot}</span>
        )
    },
    {
        key: "status", title: "Trạng thái", render: r => {
            const cfg = STATUS_CONFIG[r.status] ?? { label: r.status, variant: "neutral" };
            return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
        }
    },
    {
        key: "actions", title: "", render: r => (
            <div style={{ display: "flex", gap: 6 }}>
                <button className="dash-action-btn dash-action-btn--sm" title="Chi tiết">🔍</button>
                {r.status === "CONFIRMED" && (
                    <button className="dash-action-btn dash-action-btn--sm dash-action-btn--primary" title="Check-in">✅</button>
                )}
            </div>
        )
    },
];

export default function Appointments() {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

    useEffect(() => {
        setLoading(true);
        listTodayAppointments()
            .then(setAppointments)
            .finally(() => setLoading(false));
    }, [date]);

    const filtered = appointments.filter(a => {
        const matchSearch = !search || a.patientName?.toLowerCase().includes(search.toLowerCase()) || a.code?.includes(search);
        const matchStatus = filterStatus === "all" || a.status === filterStatus;
        return matchSearch && matchStatus;
    });

    const stats = {
        total: appointments.length,
        confirmed: appointments.filter(a => a.status === "CONFIRMED").length,
        checkedIn: appointments.filter(a => a.status === "CHECKED_IN").length,
        cancelled: appointments.filter(a => a.status === "CANCELLED").length,
    };

    return (
        <div className="dash-page">
            <div className="dash-page-header">
                <div>
                    <h1 className="dash-page-title">Quản lý lịch hẹn</h1>
                    <p className="dash-page-sub">Theo dõi & cập nhật trạng thái lịch hẹn trong ngày</p>
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <input type="date" value={date} onChange={e => setDate(e.target.value)}
                        style={{ padding: "8px 12px", borderRadius: "var(--radius-lg)", border: "1.5px solid var(--color-border-subtle)", fontSize: 14 }} />
                    <Button size="sm">+ Tạo lịch hẹn</Button>
                </div>
            </div>

            {/* Stats cards */}
            <div className="dash-stats-row">
                {[
                    { label: "Tổng lịch hẹn", value: stats.total, icon: "📋", color: "#e0f2fe" },
                    { label: "Đã xác nhận", value: stats.confirmed, icon: "✅", color: "#dcfce7" },
                    { label: "Đã check-in", value: stats.checkedIn, icon: "🏥", color: "#eff6ff" },
                    { label: "Đã hủy", value: stats.cancelled, icon: "❌", color: "#fee2e2" },
                ].map(s => (
                    <div key={s.label} className="dash-stat-card" style={{ background: s.color }}>
                        <div className="dash-stat-icon">{s.icon}</div>
                        <div className="dash-stat-val">{s.value}</div>
                        <div className="dash-stat-label">{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Filter bar */}
            <div className="dash-filter-bar">
                <input className="dash-search-input"
                    placeholder="🔍 Tìm kiếm bệnh nhân, mã lịch hẹn..."
                    value={search}
                    onChange={e => setSearch(e.target.value)} />
                <select className="dash-filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                    <option value="all">Tất cả trạng thái</option>
                    {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                    ))}
                </select>
            </div>

            {loading ? (
                <div style={{ textAlign: "center", padding: 40 }}><LoadingSpinner /></div>
            ) : (
                <div className="mc-table-wrapper">
                    <Table columns={COLS} data={filtered} emptyMessage="Không có lịch hẹn nào phù hợp." />
                </div>
            )}
        </div>
    );
}
