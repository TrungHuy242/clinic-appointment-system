import React, { useState } from "react";
import Badge from "../../../components/common/Badge";
import "../../../styles/pages/dashboard.css";

const MOCK_SCHEDULE = [
    { time: "08:00", patientName: "Nguyễn Văn An", phone: "0901234567", service: "Da liễu - Khám lần đầu", status: "waiting", code: "APT-2026-0011" },
    { time: "08:50", patientName: "Trần Thị Bình", phone: "0912345678", service: "Da liễu - Tái khám", status: "checked_in", code: "APT-2026-0012" },
    { time: "09:15", patientName: "Lê Văn Cường", phone: "0934567890", service: "Da liễu - Kê đơn", status: "in_progress", code: "APT-2026-0013" },
    { time: "09:40", patientName: "Phạm Thị Dung", phone: "0945678901", service: "Da liễu - Khám lần đầu", status: "done", code: "APT-2026-0014" },
    { time: "10:05", patientName: "Hoàng Anh Em", phone: "0956789012", service: "Da liễu - Tái khám", status: "waiting", code: "APT-2026-0015" },
    { time: "10:30", patientName: "Vũ Thị Phương", phone: "0967890123", service: "Da liễu - Tư vấn", status: "waiting", code: "APT-2026-0016" },
    { time: "14:00", patientName: "Mai Văn Quốc", phone: "0978901234", service: "Da liễu - Khám lần đầu", status: "waiting", code: "APT-2026-0017" },
];

const STATUS_MAP = {
    waiting: { label: "Chờ khám", variant: "neutral", icon: "🕐" },
    checked_in: { label: "Đã check-in", variant: "info", icon: "📍" },
    in_progress: { label: "Đang khám", variant: "warning", icon: "🩺" },
    done: { label: "Hoàn tất", variant: "success", icon: "✅" },
};

export default function MySchedule() {
    const [today] = useState(new Date().toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" }));
    const [activeFilter, setActiveFilter] = useState("all");

    const filtered = activeFilter === "all" ? MOCK_SCHEDULE : MOCK_SCHEDULE.filter(s => s.status === activeFilter);

    const stats = {
        total: MOCK_SCHEDULE.length,
        waiting: MOCK_SCHEDULE.filter(s => s.status === "waiting").length,
        inProgress: MOCK_SCHEDULE.filter(s => s.status === "in_progress").length,
        done: MOCK_SCHEDULE.filter(s => s.status === "done").length,
    };

    return (
        <div className="dash-page">
            <div className="dash-page-header">
                <div>
                    <h1 className="dash-page-title">Lịch khám của tôi</h1>
                    <p className="dash-page-sub">📅 {today}</p>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                    <div style={{ padding: "8px 16px", background: "var(--color-primary-light)", borderRadius: 10, fontSize: 13, fontWeight: 600, color: "var(--color-primary)" }}>
                        BS. Nguyễn Thị Sarah · Da liễu
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="dash-stats-row">
                {[
                    { label: "Tổng lịch hẹn", value: stats.total, icon: "📋", color: "#e0f2fe" },
                    { label: "Chờ khám", value: stats.waiting, icon: "🕐", color: "#fef3c7" },
                    { label: "Đang khám", value: stats.inProgress, icon: "🩺", color: "#eff6ff" },
                    { label: "Hoàn tất", value: stats.done, icon: "✅", color: "#dcfce7" },
                ].map(s => (
                    <div key={s.label} className="dash-stat-card" style={{ background: s.color }}>
                        <div className="dash-stat-icon">{s.icon}</div>
                        <div className="dash-stat-val">{s.value}</div>
                        <div className="dash-stat-label">{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Filter tabs */}
            <div className="dash-filter-tabs">
                {[
                    { key: "all", label: "Tất cả" },
                    { key: "waiting", label: "Chờ khám" },
                    { key: "in_progress", label: "Đang khám" },
                    { key: "done", label: "Hoàn tất" },
                ].map(f => (
                    <button key={f.key} className={`dash-filter-tab ${activeFilter === f.key ? "active" : ""}`}
                        onClick={() => setActiveFilter(f.key)}>
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Schedule list */}
            <div className="schedule-list">
                {filtered.map((item, idx) => {
                    const cfg = STATUS_MAP[item.status];
                    return (
                        <div key={idx} className={`schedule-item ${item.status === "in_progress" ? "schedule-item--active" : ""} ${item.status === "done" ? "schedule-item--done" : ""}`}>
                            <div className="schedule-item__time">
                                <div className="schedule-time-val">{item.time}</div>
                            </div>
                            <div className="schedule-item__dot">
                                <div className={`schedule-dot schedule-dot--${item.status}`} />
                            </div>
                            <div className="schedule-item__content">
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: 15 }}>{item.patientName}</div>
                                        <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 2 }}>{item.phone} · {item.code}</div>
                                        <div style={{ fontSize: 13, color: "var(--color-text-secondary)", marginTop: 4 }}>{item.service}</div>
                                    </div>
                                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                                        <Badge variant={cfg.variant}>{cfg.icon} {cfg.label}</Badge>
                                        {(item.status === "waiting" || item.status === "checked_in") && (
                                            <button className="dash-action-btn dash-action-btn--primary" style={{ padding: "6px 14px", fontSize: 13 }}>
                                                Bắt đầu khám →
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
