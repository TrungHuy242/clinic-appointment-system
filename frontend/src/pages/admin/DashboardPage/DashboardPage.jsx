import React, { useEffect, useState } from "react";
import {
  Activity,
  AlertCircle,
  CalendarCheck,
  CalendarClock,
  CheckCircle2,
  Clock,
  RefreshCw,
  Stethoscope,
  TrendingUp,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import { getDashboard } from "../../../services/adminApi";
import {
  getStatusLabel,
  statusToClass,
} from "../../../services/formatters";
import "./DashboardPage.css";

function stripHtml(raw) {
  if (typeof raw !== "string") return "";
  return raw
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim() || "Đã xảy ra lỗi.";
}

const TONE_MAP = {
  warning: "amber",
  danger: "red",
  info: "blue",
};

const STAT_CARD_META = {
  total_today: {
    label: "Tổng lịch hẹn",
    icon: CalendarClock,
    bg: "rgba(59, 130, 246, 0.08)",
    color: "#3b82f6",
    border: "#bfdbfe",
  },
  pending: {
    label: "Chờ xác nhận",
    icon: Clock,
    bg: "rgba(245, 158, 11, 0.08)",
    color: "#f59e0b",
    border: "#fde68a",
  },
  confirmed: {
    label: "Đã xác nhận",
    icon: CheckCircle2,
    bg: "rgba(14, 165, 233, 0.08)",
    color: "#0ea5e9",
    border: "#bae6fd",
  },
  checked_in: {
    label: "Đã check-in",
    icon: UserCheck,
    bg: "rgba(16, 185, 129, 0.08)",
    color: "#10b981",
    border: "#6ee7b7",
  },
  in_progress: {
    label: "Đang khám",
    icon: Stethoscope,
    bg: "rgba(139, 92, 246, 0.08)",
    color: "#8b5cf6",
    border: "#c4b5fd",
  },
  completed: {
    label: "Hoàn tất",
    icon: Activity,
    bg: "rgba(6, 182, 212, 0.08)",
    color: "#06b6d4",
    border: "#a5f3fc",
  },
};

function ProgressBar({ value, max, color }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="dash-progress-bar">
      <div
        className="dash-progress-bar__fill"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  );
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  const todayLabel = new Date().toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  function load() {
    setLoading(true);
    setError("");
    getDashboard()
      .then((res) => setData(res))
      .catch((err) =>
        setError(stripHtml(err.message) || "Không tải được dữ liệu.")
      )
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <div className="dash-page dashboard-page">
        <div className="dashboard-page__header">
          <div>
            <h1 className="dash-page-title">Tổng quan</h1>
            <p className="dash-page-sub">{todayLabel}</p>
          </div>
        </div>
        <div className="dashboard-page__loading">
          <div className="dashboard-page__loading-spinner" />
          <span>Đang tải dữ liệu...</span>
        </div>
      </div>
    );
  }

  const statCards = data?.statCards || [];
  const total = statCards.find((c) => c.key === "total_today")?.value || 0;
  const completed = statCards.find((c) => c.key === "completed")?.value || 0;
  const inProgress = statCards.find((c) => c.key === "in_progress")?.value || 0;
  const checkedIn = statCards.find((c) => c.key === "checked_in")?.value || 0;
  const pending = statCards.find((c) => c.key === "pending")?.value || 0;
  const confirmed = statCards.find((c) => c.key === "confirmed")?.value || 0;

  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="dash-page dashboard-page">
      {/* ── Header ── */}
      <div className="dashboard-page__header">
        <div>
          <h1 className="dash-page-title">Tổng quan</h1>
          <p className="dash-page-sub">{todayLabel}</p>
        </div>
        <button
          type="button"
          className="dashboard-page__refresh-btn"
          onClick={load}
          title="Tải lại dữ liệu"
        >
          <RefreshCw size={15} />
          Làm mới
        </button>
      </div>

      {error && !data && (
        <div className="dashboard-page__error">
          {error}
          <button onClick={load}>Tải lại</button>
        </div>
      )}

      {error && data && (
        <div className="dashboard-page__error dashboard-page__error--inline">
          {error}
          <button
            type="button"
            className="dashboard-page__error-close"
            onClick={() => setError("")}
          >
            ×
          </button>
        </div>
      )}

      {data && (
        <>
          {/* ── Stat Cards ── */}
          <div className="dashboard-page__stats-row">
            {statCards.map((card) => {
              const meta = STAT_CARD_META[card.key] || STAT_CARD_META.total_today;
              const Icon = meta.icon;
              return (
                <div
                  key={card.key}
                  className="dash-stat-card"
                  style={{
                    background: meta.bg,
                    borderColor: meta.border,
                  }}
                >
                  <div
                    className="dash-stat-card__icon"
                    style={{ background: meta.color + "18", color: meta.color }}
                  >
                    <Icon size={20} />
                  </div>
                  <div className="dash-stat-card__body">
                    <div
                      className="dash-stat-card__value"
                      style={{ color: meta.color }}
                    >
                      {card.value}
                    </div>
                    <div className="dash-stat-card__label">{meta.label}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Middle Row ── */}
          <div className="dashboard-page__middle">
            {/* Funnel + Progress */}
            <div className="dash-card">
              <div className="dash-card__header">
                <TrendingUp size={16} className="dash-card__header-icon" />
                <h2 className="dash-card__title">Tiến độ hôm nay</h2>
                <span className="dash-card__badge">{completionRate}% hoàn tất</span>
              </div>
              <div className="dash-progress-section">
                <div className="dash-progress-overall">
                  <div className="dash-progress-overall__bar">
                    <div
                      className="dash-progress-overall__fill"
                      style={{ width: `${completionRate}%` }}
                    />
                    {inProgress > 0 && (
                      <div
                        className="dash-progress-overall__fill dash-progress-overall__fill--active"
                        style={{
                          width: `${total > 0 ? (inProgress / total) * 100 : 0}%`,
                          left: `${total > 0 ? (checkedIn / total) * 100 : 0}%`,
                        }}
                      />
                    )}
                  </div>
                  <div className="dash-progress-overall__legend">
                    <div className="dash-progress-overall__legend-item">
                      <div
                        className="dash-progress-legend-dot"
                        style={{ background: "#10b981" }}
                      />
                      <span>Hoàn tất ({completed})</span>
                    </div>
                    <div className="dash-progress-overall__legend-item">
                      <div
                        className="dash-progress-legend-dot"
                        style={{ background: "#8b5cf6" }}
                      />
                      <span>Đang khám ({inProgress})</span>
                    </div>
                  </div>
                </div>

                <div className="dash-funnel">
                  {[
                    { label: "Chờ xác nhận", value: pending, color: "#f59e0b", key: "pending" },
                    { label: "Đã xác nhận", value: confirmed, color: "#0ea5e9", key: "confirmed" },
                    { label: "Đã check-in", value: checkedIn, color: "#10b981", key: "checked_in" },
                    { label: "Đang khám", value: inProgress, color: "#8b5cf6", key: "in_progress" },
                    { label: "Hoàn tất", value: completed, color: "#06b6d4", key: "completed" },
                  ].map((step) => (
                    <div key={step.key} className="dash-funnel-row">
                      <div className="dash-funnel-row__label">{step.label}</div>
                      <div className="dash-funnel-row__bar-wrap">
                        <ProgressBar
                          value={step.value}
                          max={total || 1}
                          color={step.color}
                        />
                      </div>
                      <div
                        className="dash-funnel-row__value"
                        style={{ color: step.color }}
                      >
                        {step.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Alerts */}
            <div className="dash-card">
              <div className="dash-card__header">
                <AlertCircle size={16} className="dash-card__header-icon" />
                <h2 className="dash-card__title">Thông báo</h2>
              </div>
              <div className="dash-alerts-list">
                {data.alerts.length === 0 ? (
                  <div className="dash-alerts-empty">
                    <CheckCircle2 size={28} />
                    <p>Không có thông báo nào</p>
                  </div>
                ) : (
                  data.alerts.map((alert, idx) => (
                    <div
                      key={idx}
                      className={`dash-alert-item dash-alert-item--${TONE_MAP[alert.type] || "blue"}`}
                    >
                      {alert.type === "warning" && (
                        <UserPlus size={16} className="dash-alert-item__icon" />
                      )}
                      {alert.type === "danger" && (
                        <Clock size={16} className="dash-alert-item__icon" />
                      )}
                      {alert.type === "info" && (
                        <CalendarCheck
                          size={16}
                          className="dash-alert-item__icon"
                        />
                      )}
                      <span className="dash-alert-item__text">{alert.message}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* ── Recent Appointments ── */}
          <div className="dash-card">
            <div className="dash-card__header">
              <CalendarCheck size={16} className="dash-card__header-icon" />
              <h2 className="dash-card__title">Lịch hẹn gần đây</h2>
              <span className="dash-card__count">
                {data.recentAppointments.length} lịch hẹn
              </span>
            </div>

            {data.recentAppointments.length === 0 ? (
              <div className="dash-recent-empty">
                <CalendarCheck size={36} />
                <p>Chưa có lịch hẹn nào</p>
              </div>
            ) : (
              <div className="dash-recent-table-wrap">
                <table className="dash-recent-table">
                  <thead>
                    <tr>
                      <th>Mã lịch</th>
                      <th>Bệnh nhân</th>
                      <th>Bác sĩ</th>
                      <th>Ngày</th>
                      <th>Giờ</th>
                      <th>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentAppointments.map((row) => (
                      <tr key={row.code}>
                        <td className="dash-recent-td-code">{row.code}</td>
                        <td>
                          <div className="dash-recent-patient">
                            <div className="dash-recent-avatar">
                              <Users size={14} />
                            </div>
                            <span>{row.patient}</span>
                          </div>
                        </td>
                        <td>
                          <div className="dash-recent-doctor">
                            <Stethoscope size={13} />
                            <span>{row.doctor_name}</span>
                          </div>
                        </td>
                        <td>{row.date}</td>
                        <td className="dash-recent-time">{row.time}</td>
                        <td>
                          <span
                            className={`dash-recent-badge dash-recent-badge--${statusToClass(row.status)}`}
                          >
                            {getStatusLabel(row.status)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
