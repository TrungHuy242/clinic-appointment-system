import React, { useState } from "react";
import "../../../styles/pages/dashboard.css";

const MONTHS = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"];
const REVENUE_DATA = [42, 58, 65, 70, 55, 80, 90, 75, 95, 110, 88, 120];
const APT_DATA = [120, 145, 160, 175, 140, 195, 220, 185, 230, 270, 215, 290];
const MAX_REVENUE = Math.max(...REVENUE_DATA);
const MAX_APT = Math.max(...APT_DATA);

const SPECIALTY_STATS = [
    { name: "Khám tổng quát", count: 380, pct: 30, color: "#13c8ec" },
    { name: "Da liễu", count: 260, pct: 21, color: "#06b6d4" },
    { name: "Nhi khoa", count: 200, pct: 16, color: "#0ea5e9" },
    { name: "Tai Mũi Họng", count: 180, pct: 14, color: "#3b82f6" },
    { name: "Nha khoa", count: 150, pct: 12, color: "#8b5cf6" },
    { name: "Tim mạch", count: 88, pct: 7, color: "#ec4899" },
];

export default function Reports() {
    const [period, setPeriod] = useState("year");
    const totalApt = APT_DATA.reduce((a, b) => a + b, 0);
    const totalRevenue = REVENUE_DATA.reduce((a, b) => a + b, 0);

    return (
        <div className="dash-page">
            <div className="dash-page-header">
                <div>
                    <h1 className="dash-page-title">Báo cáo & Thống kê</h1>
                    <p className="dash-page-sub">Tổng quan hoạt động MediCare Hải Châu</p>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                    <div className="dash-filter-tabs" style={{ margin: 0 }}>
                        {["week", "month", "quarter", "year"].map(p => (
                            <button key={p} className={`dash-filter-tab ${period === p ? "active" : ""}`} onClick={() => setPeriod(p)}>
                                {p === "week" ? "Tuần" : p === "month" ? "Tháng" : p === "quarter" ? "Quý" : "Năm"}
                            </button>
                        ))}
                    </div>
                    <button className="dash-btn-primary">⬇ Xuất báo cáo</button>
                </div>
            </div>

            {/* KPI Grid */}
            <div className="dash-stats-row" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
                {[
                    { label: "Tổng lịch hẹn", value: totalApt.toLocaleString(), icon: "📋", color: "#e0f2fe", trend: "+12%" },
                    { label: "Doanh thu (tr.đ)", value: (totalRevenue * 3.2).toFixed(0), icon: "💰", color: "#dcfce7", trend: "+18%" },
                    { label: "Bệnh nhân mới", value: "248", icon: "👥", color: "#fef3c7", trend: "+8%" },
                    { label: "Tỷ lệ hoàn tất", value: "94%", icon: "✅", color: "#ede9fe", trend: "+2%" },
                ].map(s => (
                    <div key={s.label} className="dash-stat-card" style={{ background: s.color }}>
                        <div className="dash-stat-icon">{s.icon}</div>
                        <div className="dash-stat-val">{s.value}</div>
                        <div className="dash-stat-label">{s.label}</div>
                        <div style={{ fontSize: 12, color: "#16a34a", fontWeight: 700, marginTop: 4 }}>↑ {s.trend} so với kỳ trước</div>
                    </div>
                ))}
            </div>

            <div className="report-charts-grid">
                {/* Bar chart – appointments */}
                <div className="report-chart-card">
                    <div className="report-chart-title">Lịch hẹn theo tháng (2026)</div>
                    <div className="bar-chart">
                        {APT_DATA.map((v, i) => (
                            <div key={i} className="bar-chart__col">
                                <div className="bar-chart__bar-wrap">
                                    <div className="bar-chart__bar" style={{ height: `${(v / MAX_APT) * 100}%`, background: "var(--color-primary)" }} title={`${v} lịch`}>
                                        <span className="bar-chart__val">{v}</span>
                                    </div>
                                </div>
                                <div className="bar-chart__label">{MONTHS[i]}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bar chart – revenue */}
                <div className="report-chart-card">
                    <div className="report-chart-title">Doanh thu (triệu đồng)</div>
                    <div className="bar-chart">
                        {REVENUE_DATA.map((v, i) => (
                            <div key={i} className="bar-chart__col">
                                <div className="bar-chart__bar-wrap">
                                    <div className="bar-chart__bar" style={{ height: `${(v / MAX_REVENUE) * 100}%`, background: "#8b5cf6" }} title={`${(v * 3.2).toFixed(0)} triệu`}>
                                        <span className="bar-chart__val">{(v * 3.2).toFixed(0)}</span>
                                    </div>
                                </div>
                                <div className="bar-chart__label">{MONTHS[i]}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Specialty breakdown */}
                <div className="report-chart-card">
                    <div className="report-chart-title">Phân bổ theo chuyên khoa</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {SPECIALTY_STATS.map(s => (
                            <div key={s.name}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                    <span style={{ fontSize: 13, fontWeight: 600 }}>{s.name}</span>
                                    <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>{s.count} lượt ({s.pct}%)</span>
                                </div>
                                <div style={{ height: 8, background: "var(--color-border-subtle)", borderRadius: 99, overflow: "hidden" }}>
                                    <div style={{ height: "100%", width: `${s.pct}%`, background: s.color, borderRadius: 99, transition: "width 0.5s" }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Summary table */}
                <div className="report-chart-card">
                    <div className="report-chart-title">Tóm tắt tháng hiện tại</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                        {[
                            ["Tổng lịch hẹn", "290"],
                            ["Bệnh nhân mới", "48"],
                            ["Đã hoàn tất", "272 (93.8%)"],
                            ["Đã hủy / No-show", "18 (6.2%)"],
                            ["Doanh thu thực tế", "384.000.000đ"],
                            ["Lịch hẹn trung bình/ngày", "13.6"],
                        ].map(([k, v]) => (
                            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--color-border-subtle)", fontSize: 14 }}>
                                <span style={{ color: "var(--color-text-muted)" }}>{k}</span>
                                <span style={{ fontWeight: 700 }}>{v}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
