import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  CalendarCheck,
  CalendarDays,
  CalendarX,
  CheckCircle2,
  ChevronRight,
  Clock,
  Copy,
  MapPin,
  Plus,
  QrCode,
  Search,
  Stethoscope,
  User,
} from "lucide-react";
import { appointmentApi } from "../../../services/patientApi";
import "./MyAppointmentsPage.css";

function stripHtml(raw) {
  if (typeof raw !== "string") return "";
  return raw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() || "Đã xảy ra lỗi.";
}

const TABS = [
  { key: "upcoming",  label: "Sắp tới",        icon: CalendarCheck },
  { key: "history",   label: "Đã hoàn thành",   icon: CheckCircle2  },
  { key: "cancelled", label: "Đã hủy",          icon: CalendarX     },
];

const STATUS_CONFIG = {
  confirmed:  { label: "Đã xác nhận", className: "status-confirmed" },
  pending:    { label: "Chờ xác nhận",  className: "status-pending"  },
  completed:  { label: "Hoàn thành",   className: "status-completed" },
  cancelled:  { label: "Đã hủy",       className: "status-cancelled" },
};

function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span className={`ma-status-badge ${config.className}`}>
      {status === "pending" && <Clock size={12} />}
      {config.label}
    </span>
  );
}

function CopyCodeButton({ code }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async (e) => {
    e.stopPropagation();
    if (!navigator?.clipboard?.writeText) return;
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button className="ma-copy-code-btn" onClick={handleCopy} title="Sao chép mã lịch hẹn">
      <Copy size={11} />
      {copied ? "Đã lưu!" : code}
    </button>
  );
}

export default function MyAppointmentsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "upcoming";

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const loadAppointments = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      const data = await appointmentApi.getAppointments(activeTab);
      setAppointments(data);
    } catch (loadError) {
      setError(stripHtml(loadError.message) || "Không tải được danh sách lịch hẹn.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const days = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
    return {
      dayName: days[date.getDay()],
      date:    date.getDate(),
      month:   date.getMonth() + 1,
    };
  };

  const handleViewAppointment = (appointment) => {
    // Nếu có recordId (lịch đã hoàn thành) → vào trang hồ sơ khám
    if (appointment.recordId) {
      navigate(`/app/patient/records/${appointment.recordId}`);
      return;
    }
    // Chưa có hồ sơ (lịch sắp tới / đã hủy) → tra cứu bằng mã lịch hẹn
    navigate(`/lookup?code=${appointment.code}&from=patient`);
  };

  return (
    <div className="ma-page">
      {/* Header */}
      <header className="ma-header">
        <div className="ma-header-content">
          <div className="ma-header-text">
            <h1>Lịch hẹn của tôi</h1>
            <p>Quản lý và theo dõi lịch khám tại MediCare Clinic</p>
          </div>
          <div className="ma-header-actions">
            <button
              className="ma-btn ma-btn--refresh"
              onClick={() => loadAppointments(true)}
              disabled={refreshing}
            >
              <Search size={18} className={refreshing ? "spinning" : ""} />
              Làm mới
            </button>
            <button
              className="ma-btn ma-btn--primary"
              onClick={() => navigate("/book")}
            >
              <Plus size={18} />
              Đặt lịch hẹn mới
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="ma-tabs-container">
        <div className="ma-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              className={`ma-tab ${activeTab === tab.key ? "active" : ""}`}
              onClick={() => navigate(`/app/patient/appointments?tab=${tab.key}`)}
            >
              <tab.icon size={18} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="ma-content">
        {loading ? (
          <div className="ma-state ma-state--loading">
            <div className="ma-spinner" />
            <p>Đang tải lịch hẹn...</p>
          </div>
        ) : error ? (
          <div className="ma-state ma-state--error">
            <div className="ma-state-icon ma-state-icon--error">
              <CalendarX size={32} />
            </div>
            <h3>Không tải được lịch hẹn</h3>
            <p>{error}</p>
            <button className="ma-btn ma-btn--primary" onClick={() => loadAppointments(true)}>
              Thử lại
            </button>
          </div>
        ) : appointments.length === 0 ? (
          <div className="ma-state ma-state--empty">
            <div className="ma-state-icon">
              <CalendarDays size={48} />
            </div>
            <h3>Không có lịch hẹn</h3>
            <p>
              {activeTab === "upcoming"
                ? "Bạn chưa có lịch hẹn nào sắp tới."
                : activeTab === "history"
                  ? "Bạn chưa có lịch hẹn nào đã hoàn thành."
                  : "Bạn chưa có lịch hẹn nào bị hủy."}
            </p>
            {activeTab === "upcoming" && (
              <button className="ma-btn ma-btn--primary" onClick={() => navigate("/book")}>
                <Plus size={18} />
                Đặt lịch ngay
              </button>
            )}
          </div>
        ) : (
          <div className="ma-list">
            {appointments.map((appointment) => {
              const { dayName, date, month } = formatDate(appointment.date);
              const isClickable = !!appointment.recordId || activeTab !== "cancelled";
              return (
                <div
                  key={appointment.id}
                  className={`ma-card ${isClickable ? "ma-card--clickable" : ""}`}
                  onClick={isClickable ? () => handleViewAppointment(appointment) : undefined}
                >
                  {/* Date */}
                  <div className="ma-card-date">
                    <div className="ma-card-date-main">
                      <span className="ma-card-day">{date}</span>
                      <span className="ma-card-month">Tháng {month}</span>
                    </div>
                    <span className="ma-card-weekday">{dayName}</span>
                  </div>

                  {/* Info */}
                  <div className="ma-card-info">
                    <div className="ma-card-header">
                      <StatusBadge status={appointment.status} />
                      {appointment.qrText && (
                        <span className="ma-qr-badge">
                          <QrCode size={11} />
                          Có QR
                        </span>
                      )}
                      <CopyCodeButton code={appointment.code} />
                    </div>

                    <h3 className="ma-card-service">
                      <Stethoscope size={16} />
                      {appointment.service}
                    </h3>

                    <div className="ma-card-details">
                      <div className="ma-card-detail">
                        <Clock size={14} />
                        <span>{appointment.timeStart} – {appointment.timeEnd}</span>
                      </div>
                      <div className="ma-card-detail">
                        <User size={14} />
                        <span>{appointment.doctor.name}</span>
                      </div>
                      <div className="ma-card-detail">
                        <MapPin size={14} />
                        <span>{appointment.location}</span>
                      </div>
                    </div>
                  </div>

                  {/* Arrow — chỉ hiện khi có thể click */}
                  {isClickable && (
                    <div className="ma-card-arrow">
                      <ChevronRight size={20} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}