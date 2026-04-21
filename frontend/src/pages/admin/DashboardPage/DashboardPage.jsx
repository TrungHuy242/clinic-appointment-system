import React, { useEffect, useState } from "react";
import {
  CalendarCheck,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Clock,
  LayoutDashboard,
  UserCheck,
  UserPlus,
} from "lucide-react";
import { getDashboard } from "../../../services/adminApi";
import { getStatusLabel, statusToClass } from "../../../services/formatters";
import { formatDate, getToday } from "../../../services/formatters";
import "./DashboardPage.css";

function stripHtml(raw) {
  if (typeof raw !== "string") return "";
  return raw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() || "Đã xảy ra lỗi.";
}

const TONE_MAP = {
  warning: 'amber',
  danger: 'red',
  info: 'blue',
  success: 'emerald',
};

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  const today = formatDate(new Date(), { weekday: "long", day: "numeric", month: "numeric", year: "numeric" });

  useEffect(() => {
    setLoading(true);
    setError("");
    getDashboard()
      .then((res) => setData(res))
      .catch((err) => setError(stripHtml(err.message) || "Không tải được dashboard."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="dash-page dashboard-page">
        <div className="dashboard-page__header">
          <div>
            <h1 className="dash-page-title">Tổng quan hệ thống</h1>
            <p className="dash-page-sub">{today}</p>
          </div>
        </div>
        <div className="dashboard-page__loading">
          <div className="dashboard-page__loading-spinner" />
          <span>Đang tải dữ liệu...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="dash-page dashboard-page">
      <div className="dashboard-page__header">
        <div>
          <h1 className="dash-page-title">Tổng quan hệ thống</h1>
          <p className="dash-page-sub">{getToday()}</p>
        </div>
      </div>

      {error && !data && (
        <div className="dashboard-page__error">
          {error}
          <button onClick={() => window.location.reload()}>Tải lại</button>
        </div>
      )}

      {error && data && (
        <div className="dashboard-page__error dashboard-page__error--inline">
          {error}
          <button type="button" className="dashboard-page__error-close" onClick={() => setError("")}>×</button>
        </div>
      )}

      {data && (
        <>
          {/* Stat Cards */}
          <div className="dashboard-page__stats-row">
            {data.statCards.map((card) => {
              const toneClass = {
                total_today: 'blue',
                pending: 'amber',
                checked_in: 'emerald',
                in_progress: 'violet',
                confirmed: 'sky',
                completed: 'teal',
              }[card.key] || 'blue';
              return (
                <div
                  key={card.key}
                  className={`dashboard-page__stat-card dashboard-page__stat-card--${toneClass}`}
                >
                  <div className="dashboard-page__stat-icon">
                    {card.key === 'total_today' && <CalendarClock className="mc-icon mc-icon--md" />}
                    {card.key === 'pending' && <Clock className="mc-icon mc-icon--md" />}
                    {card.key === 'checked_in' && <UserCheck className="mc-icon mc-icon--md" />}
                    {card.key === 'in_progress' && <UserPlus className="mc-icon mc-icon--md" />}
                    {card.key === 'confirmed' && <CheckCircle2 className="mc-icon mc-icon--md" />}
                    {card.key === 'completed' && <CheckCircle2 className="mc-icon mc-icon--md" />}
                  </div>
                  <div className="dashboard-page__stat-value">{card.value}</div>
                  <div className="dashboard-page__stat-label">{card.label}</div>
                </div>
              );
            })}
          </div>

          {/* Lower section: Recent Appointments + Alerts */}
          <div className="dashboard-page__lower">
            {/* Recent Appointments */}
            <div className="dashboard-page__recent">
              <div className="dashboard-page__recent-header">
                <LayoutDashboard className="mc-icon mc-icon--sm" />
                <h2 className="dashboard-page__section-title">Lịch hẹn gần đây</h2>
              </div>
              {data.recentAppointments.length === 0 ? (
                <div className="dashboard-page__empty">Không có lịch hẹn nào.</div>
              ) : (
                <div className="dashboard-page__table-wrap">
                  <table className="dashboard-page__table">
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
                          <td className="dashboard-page__td-code">{row.code}</td>
                          <td>{row.patient}</td>
                          <td>{row.doctor_name}</td>
                          <td>{row.date}</td>
                          <td>{row.time}</td>
                          <td>
                            <span className={`dashboard-page__badge dashboard-page__badge--${statusToClass(row.status)}`}>
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

            {/* Alerts */}
            <div className="dashboard-page__alerts">
              <div className="dashboard-page__alerts-header">
                <ClipboardList className="mc-icon mc-icon--sm" />
                <h2 className="dashboard-page__section-title">Cảnh báo nhanh</h2>
              </div>
              <div className="dashboard-page__alerts-list">
                {data.alerts.length === 0 ? (
                  <div className="dashboard-page__alerts-empty">Không có cảnh báo nào.</div>
                ) : (
                  data.alerts.map((alert, idx) => (
                    <div
                      key={idx}
                      className={`dashboard-page__alert-item dashboard-page__alert-item--${TONE_MAP[alert.type] || 'info'}`}
                    >
                      {alert.type === 'warning' && <UserPlus className="mc-icon mc-icon--sm" />}
                      {alert.type === 'danger' && <Clock className="mc-icon mc-icon--sm" />}
                      {alert.type === 'info' && <CalendarCheck className="mc-icon mc-icon--sm" />}
                      <span>{alert.message}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
