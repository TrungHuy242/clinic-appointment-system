import React, { useState } from "react";
import { BarChart3, CalendarDays, CircleCheck, Download, Users } from "lucide-react";
import "./ReportsPage.css";

const MONTHS = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"];
const REVENUE_DATA = [42, 58, 65, 70, 55, 80, 90, 75, 95, 110, 88, 120];
const APT_DATA = [120, 145, 160, 175, 140, 195, 220, 185, 230, 270, 215, 290];

const KPI_CARDS = [
  { key: "appointments", label: "Tổng lịch hẹn", icon: CalendarDays, tone: "sky", trend: "+12%" },
  { key: "revenue", label: "Doanh thu (tr.đ)", icon: BarChart3, tone: "green", trend: "+18%" },
  { key: "newPatients", label: "Bệnh nhân mới", icon: Users, tone: "yellow", trend: "+8%" },
  { key: "completionRate", label: "Tỷ lệ hoàn tất", icon: CircleCheck, tone: "violet", trend: "+2%" },
];

const SPECIALTY_STATS = [
  { name: "Khám tổng quát", count: 380, pct: 30, fillClass: "report-page__progress-fill--1" },
  { name: "Da liễu", count: 260, pct: 21, fillClass: "report-page__progress-fill--2" },
  { name: "Nhi khoa", count: 200, pct: 16, fillClass: "report-page__progress-fill--3" },
  { name: "Tai Mũi Họng", count: 180, pct: 14, fillClass: "report-page__progress-fill--4" },
  { name: "Nha khoa", count: 150, pct: 12, fillClass: "report-page__progress-fill--5" },
  { name: "Tim mạch", count: 88, pct: 7, fillClass: "report-page__progress-fill--6" },
];

const SUMMARY_ROWS = [
  ["Tổng lịch hẹn", "290"],
  ["Bệnh nhân mới", "48"],
  ["Đã hoàn tất", "272 (93.8%)"],
  ["Đã hủy / No-show", "18 (6.2%)"],
  ["Doanh thu thực tế", "384.000.000đ"],
  ["Lịch hẹn trung bình/ngày", "13.6"],
];

export default function ReportsPage() {
  const [period, setPeriod] = useState("year");
  const totalAppointments = APT_DATA.reduce((sum, value) => sum + value, 0);
  const totalRevenue = REVENUE_DATA.reduce((sum, value) => sum + value, 0);

  const kpiValues = {
    appointments: totalAppointments.toLocaleString(),
    revenue: (totalRevenue * 3.2).toFixed(0),
    newPatients: "248",
    completionRate: "94%",
  };

  return (
    <div className="dash-page report-page">
      <div className="dash-page-header">
        <div>
          <h1 className="dash-page-title">Báo cáo & Thống kê</h1>
          <p className="dash-page-sub">Tổng quan hoạt động Cơ sở Hải Châu</p>
        </div>
        <div className="report-page__header-actions">
          <div className="dash-filter-tabs report-page__period-tabs">
            {["week", "month", "quarter", "year"].map((item) => (
              <button key={item} className={`dash-filter-tab ${period === item ? "active" : ""}`} onClick={() => setPeriod(item)} type="button">
                {item === "week" ? "Tuần" : item === "month" ? "Tháng" : item === "quarter" ? "Quý" : "Năm"}
              </button>
            ))}
          </div>
          <button className="dash-btn-primary" type="button"><Download className="mc-icon mc-icon--sm" /> Xuất báo cáo</button>
        </div>
      </div>

      <div className="dash-stats-row report-page__stats-grid">
        {KPI_CARDS.map((card) => (
          <div key={card.key} className={`dash-stat-card report-page__stat-card report-page__stat-card--${card.tone}`}>
            <div className="dash-stat-icon">{React.createElement(card.icon, { className: "mc-icon mc-icon--md" })}</div>
            <div className="dash-stat-val">{kpiValues[card.key]}</div>
            <div className="dash-stat-label">{card.label}</div>
            <div className="report-page__stat-trend">↑ {card.trend} so với kỳ trước</div>
          </div>
        ))}
      </div>

      <div className="report-charts-grid">
        <div className="report-chart-card">
          <div className="report-chart-title">Lịch hẹn theo tháng (2026)</div>
          <div className="bar-chart">
            {APT_DATA.map((value, index) => (
              <div key={`apt-${MONTHS[index]}`} className="bar-chart__col">
                <div className="bar-chart__bar-wrap">
                  <div className={`bar-chart__bar report-page__bar report-page__bar--apt report-page__bar--apt-${index + 1}`} title={`${value} lịch`}>
                    <span className="bar-chart__val">{value}</span>
                  </div>
                </div>
                <div className="bar-chart__label">{MONTHS[index]}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="report-chart-card">
          <div className="report-chart-title">Doanh thu (triệu đồng)</div>
          <div className="bar-chart">
            {REVENUE_DATA.map((value, index) => (
              <div key={`rev-${MONTHS[index]}`} className="bar-chart__col">
                <div className="bar-chart__bar-wrap">
                  <div className={`bar-chart__bar report-page__bar report-page__bar--revenue report-page__bar--revenue-${index + 1}`} title={`${(value * 3.2).toFixed(0)} triệu`}>
                    <span className="bar-chart__val">{(value * 3.2).toFixed(0)}</span>
                  </div>
                </div>
                <div className="bar-chart__label">{MONTHS[index]}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="report-chart-card">
          <div className="report-chart-title">Phân bổ theo chuyên khoa</div>
          <div className="report-page__specialty-list">
            {SPECIALTY_STATS.map((item) => (
              <div key={item.name}>
                <div className="report-page__specialty-row">
                  <span className="report-page__specialty-name">{item.name}</span>
                  <span className="report-page__specialty-meta">{item.count} lượt ({item.pct}%)</span>
                </div>
                <div className="report-page__progress-track">
                  <div className={`report-page__progress-fill ${item.fillClass}`} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="report-chart-card">
          <div className="report-chart-title">Tóm tắt tháng hiện tại</div>
          <div className="report-page__summary-list">
            {SUMMARY_ROWS.map(([label, value]) => (
              <div key={label} className="report-page__summary-row">
                <span className="report-page__summary-label">{label}</span>
                <span className="report-page__summary-value">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
