import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Plus,
  RefreshCw,
  ScanLine,
  Stethoscope,
  TriangleAlert,
  UserRound,
  Users,
  XCircle,
} from "lucide-react";
import Badge from "../../../components/Badge/Badge";
import LoadingSpinner from "../../../components/LoadingSpinner/LoadingSpinner";
import { receptionApi } from "../../../services/receptionApi";
import { getStatusInfo } from "../../../services/formatters";
import "./DashboardPage.css";

function stripHtml(raw) {
  if (typeof raw !== "string") return "";
  return raw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() || "Đã xảy ra lỗi.";
}

const STAT_CARDS = [
  { key: "total", label: "Tổng lịch hẹn", icon: CalendarDays, tone: "sky" },
  { key: "confirmed", label: "Đã xác nhận", icon: CheckCircle2, tone: "green" },
  { key: "checkedIn", label: "Đã check-in", icon: ScanLine, tone: "blue" },
  { key: "waiting", label: "Đang chờ bác sĩ", icon: ClipboardList, tone: "yellow" },
  { key: "inProgress", label: "Đang khám", icon: Stethoscope, tone: "violet" },
  { key: "completed", label: "Hoàn tất", icon: CalendarCheck, tone: "teal" },
  { key: "cancelled", label: "Hủy / Không đến", icon: XCircle, tone: "red" },
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const [data, setData] = useState({ stats: {}, upcoming: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    setError("");
    try {
      const result = await receptionApi.getDashboard();
      setData(result);
    } catch (err) {
      setError(stripHtml(err.message) || "Không tải được dashboard.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="reception-dashboard">
        <div className="reception-dashboard__loading"><LoadingSpinner /></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="reception-dashboard">
        <div className="reception-dashboard__error">
          <TriangleAlert size={24} />
          <p>{error}</p>
          <button onClick={loadDashboard}>Thử lại</button>
        </div>
      </div>
    );
  }

  const { stats, upcoming } = data;

  return (
    <div className="reception-dashboard">
      <div className="dash-page-header">
        <div>
          <h1 className="dash-page-title">Trang chủ lễ tân</h1>
          <p className="dash-page-sub">
            {new Date().toLocaleDateString("vi-VN", {
              weekday: "long",
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })}
          </p>
        </div>
        <div className="reception-dashboard__header-actions">
          <button className="reception-dashboard__refresh-btn" onClick={loadDashboard} type="button">
            <RefreshCw size={14} /> Làm mới
          </button>
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div className="reception-dashboard__quick-actions">
        <button
          className="reception-dashboard__qa-btn reception-dashboard__qa-btn--primary"
          onClick={() => navigate("/app/reception/checkin")}
          type="button"
        >
          <ScanLine className="mc-icon mc-icon--md" />
          <span>Check-in bệnh nhân</span>
        </button>
        <button
          className="reception-dashboard__qa-btn"
          onClick={() => navigate("/app/reception/appointments")}
          type="button"
        >
          <CalendarDays className="mc-icon mc-icon--md" />
          <span>Xem lịch hẹn</span>
        </button>
        <button
          className="reception-dashboard__qa-btn"
          onClick={() => navigate("/app/reception/patients")}
          type="button"
        >
          <Users className="mc-icon mc-icon--md" />
          <span>Quản lý bệnh nhân</span>
        </button>
        <button
          className="reception-dashboard__qa-btn"
          onClick={() => navigate("/book")}
          type="button"
        >
          <Plus className="mc-icon mc-icon--md" />
          <span>Tạo lịch hẹn</span>
        </button>
      </div>

      {/* ── Stats ── */}
      <div className="dash-stats-row reception-dashboard__stats-grid">
        {STAT_CARDS.map((card) => (
          <div
            key={card.key}
            className={`dash-stat-card reception-dashboard__stat-card reception-dashboard__stat-card--${card.tone}`}
          >
            <div className="dash-stat-icon">
              <card.icon className="mc-icon mc-icon--md" />
            </div>
            <div className="dash-stat-val">{stats[card.key] || 0}</div>
            <div className="dash-stat-label">{card.label}</div>
          </div>
        ))}
      </div>

      {/* ── Upcoming list ── */}
      <div className="reception-dashboard__section">
        <div className="reception-dashboard__section-header">
          <h2 className="reception-dashboard__section-title">Lịch hẹn sắp tới</h2>
          <button
            className="reception-dashboard__see-all"
            onClick={() => navigate("/app/reception/appointments")}
            type="button"
          >
            Xem tất cả
          </button>
        </div>

        {upcoming.length === 0 ? (
          <div className="reception-dashboard__empty">
            <CalendarDays size={32} />
            <p>Không có lịch hẹn nào sắp tới hôm nay.</p>
          </div>
        ) : (
          <div className="reception-dashboard__list">
            {upcoming.map((item) => {
              const cfg = getStatusInfo(item.status) ?? { label: item.status, variant: "neutral" };
              return (
                <div key={item.id} className="reception-dashboard__item">
                  <div className="reception-dashboard__item-slot">{item.slot.split(" - ")[0]}</div>
                  <div className="reception-dashboard__item-info">
                    <div className="reception-dashboard__item-patient">
                      <UserRound className="mc-icon mc-icon--xs" />
                      {item.patientName}
                    </div>
                    <div className="reception-dashboard__item-meta">
                      {item.specialty} · {item.doctor} · {item.code}
                    </div>
                  </div>
                  <Badge variant={cfg.variant}>{cfg.label}</Badge>
                  <div className="reception-dashboard__item-actions">
                    {(item.status === "CONFIRMED") && (
                      <button
                        className="reception-dashboard__checkin-btn"
                        onClick={() => navigate(`/app/reception/checkin?code=${item.code}`)}
                        type="button"
                      >
                        Check-in
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
