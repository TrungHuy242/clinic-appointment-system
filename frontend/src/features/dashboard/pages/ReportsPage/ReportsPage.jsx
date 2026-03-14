import React, { useEffect, useMemo, useState } from "react";
import { BarChart3, CalendarDays, CircleCheck, Download, Users } from "lucide-react";
import { getReports } from "../../services/portalApi";
import "./ReportsPage.css";

const KPI_CARDS = [
  { key: "appointments", label: "Tổng lịch hẹn", icon: CalendarDays, tone: "sky" },
  { key: "revenue", label: "Doanh thu (triệu)", icon: BarChart3, tone: "green" },
  { key: "newPatients", label: "Bệnh nhân mới", icon: Users, tone: "yellow" },
  { key: "completionRate", label: "Tỷ lệ hoàn tất", icon: CircleCheck, tone: "violet" },
];

const SPECIALTY_COLORS = ["#13c8ec", "#06b6d4", "#0ea5e9", "#3b82f6", "#8b5cf6", "#ec4899"];

function getBarHeight(value, maxValue) {
  if (!maxValue) return "8%";
  return `${Math.max((value / maxValue) * 100, 8)}%`;
}

export default function ReportsPage() {
  const [period, setPeriod] = useState("year");
  const [payload, setPayload] = useState({
    labels: [],
    appointmentSeries: [],
    revenueSeries: [],
    kpis: {},
    specialtyStats: [],
    summaryRows: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadReport() {
      setLoading(true);
      setError("");
      try {
        const data = await getReports(period);
        if (mounted) {
          setPayload(data);
        }
      } catch (loadError) {
        if (mounted) {
          setError(loadError.message || "Không tải được báo cáo.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadReport();
    return () => {
      mounted = false;
    };
  }, [period]);

  const maxAppointment = useMemo(() => Math.max(...payload.appointmentSeries, 0), [payload.appointmentSeries]);
  const maxRevenue = useMemo(() => Math.max(...payload.revenueSeries, 0), [payload.revenueSeries]);

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
            <div className="dash-stat-val">{payload.kpis?.[card.key] || 0}</div>
            <div className="dash-stat-label">{card.label}</div>
            <div className="report-page__stat-trend">Số liệu theo kỳ đang chọn</div>
          </div>
        ))}
      </div>

      {loading ? <div className="dash-page-sub">Đang tải báo cáo...</div> : null}
      {error ? <div className="dash-page-sub">{error}</div> : null}

      {!loading && !error && (
        <div className="report-charts-grid">
          <div className="report-chart-card">
            <div className="report-chart-title">Lịch hẹn theo kỳ</div>
            <div className="bar-chart">
              {payload.appointmentSeries.map((value, index) => (
                <div key={`apt-${payload.labels[index] || index}`} className="bar-chart__col">
                  <div className="bar-chart__bar-wrap">
                    <div
                      className="bar-chart__bar report-page__bar report-page__bar--apt"
                      style={{ height: getBarHeight(value, maxAppointment) }}
                      title={`${value} lịch`}
                    >
                      <span className="bar-chart__val">{value}</span>
                    </div>
                  </div>
                  <div className="bar-chart__label">{payload.labels[index]}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="report-chart-card">
            <div className="report-chart-title">Doanh thu (triệu đồng)</div>
            <div className="bar-chart">
              {payload.revenueSeries.map((value, index) => (
                <div key={`rev-${payload.labels[index] || index}`} className="bar-chart__col">
                  <div className="bar-chart__bar-wrap">
                    <div
                      className="bar-chart__bar report-page__bar report-page__bar--revenue"
                      style={{ height: getBarHeight(value, maxRevenue) }}
                      title={`${value} triệu`}
                    >
                      <span className="bar-chart__val">{value}</span>
                    </div>
                  </div>
                  <div className="bar-chart__label">{payload.labels[index]}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="report-chart-card">
            <div className="report-chart-title">Phân bổ theo chuyên khoa</div>
            <div className="report-page__specialty-list">
              {payload.specialtyStats.map((item, index) => (
                <div key={item.name}>
                  <div className="report-page__specialty-row">
                    <span className="report-page__specialty-name">{item.name}</span>
                    <span className="report-page__specialty-meta">{item.count} lượt ({item.pct}%)</span>
                  </div>
                  <div className="report-page__progress-track">
                    <div
                      className="report-page__progress-fill"
                      style={{ width: `${item.pct}%`, background: SPECIALTY_COLORS[index % SPECIALTY_COLORS.length] }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="report-chart-card">
            <div className="report-chart-title">Tóm tắt theo kỳ</div>
            <div className="report-page__summary-list">
              {payload.summaryRows.map((row) => (
                <div key={row.label} className="report-page__summary-row">
                  <span className="report-page__summary-label">{row.label}</span>
                  <span className="report-page__summary-value">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
