import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  CalendarCheck,
  CalendarDays,
  CalendarX,
  CheckCircle2,
  Clock,
  MapPin,
  Plus,
  Search,
  Stethoscope,
  User,
} from "lucide-react";
import { appointmentApi } from "../../services/patientApi";
import "./MyAppointmentsPage.css";

const TABS = [
  { key: "upcoming", label: "Sắp tới", icon: CalendarCheck },
  { key: "history", label: "Đã hoàn thành", icon: CheckCircle2 },
  { key: "cancelled", label: "Đã hủy", icon: CalendarX },
];

const STATUS_CONFIG = {
  confirmed: { label: "Đã xác nhận", className: "status-confirmed", color: "#16a34a" },
  pending: { label: "Chờ xác nhận", className: "status-pending", color: "#d97706" },
  completed: { label: "Hoàn thành", className: "status-completed", color: "#16a34a" },
  cancelled: { label: "Đã hủy", className: "status-cancelled", color: "#dc2626" },
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
      setError(loadError.message || "Không tải được danh sách lịch hẹn.");
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
      date: date.getDate(),
      month: date.getMonth() + 1,
      year: date.getFullYear(),
    };
  };

  const handleRefresh = () => {
    loadAppointments(true);
  };

  const handleViewAppointment = async (appointment) => {
    // Get patient phone from account info or use from appointment
    try {
      const accountInfo = await appointmentApi.getAccountInfo();
      const phoneNumber = accountInfo?.phone || "";
      // Navigate to lookup page with code and current tab info
      navigate(`/lookup?code=${appointment.code}&phone=${encodeURIComponent(phoneNumber)}&tab=${activeTab}&from=patient`);
    } catch {
      // If can't get phone, still navigate with just code
      navigate(`/lookup?code=${appointment.code}&tab=${activeTab}&from=patient`);
    }
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
            <button className="ma-btn ma-btn--refresh" onClick={handleRefresh} disabled={refreshing}>
              <Search size={18} className={refreshing ? "spinning" : ""} />
              Làm mới
            </button>
            <button className="ma-btn ma-btn--primary" onClick={() => navigate("/book")}>
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
              onClick={() => navigate(`/patient/appointments?tab=${tab.key}`)}
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
            <div className="ma-spinner"></div>
            <p>Đang tải lịch hẹn...</p>
          </div>
        ) : error ? (
          <div className="ma-state ma-state--error">
            <div className="ma-state-icon ma-state-icon--error">
              <CalendarX size={32} />
            </div>
            <h3>Không tải được lịch hẹn</h3>
            <p>{error}</p>
            <button className="ma-btn ma-btn--primary" onClick={handleRefresh}>
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
              return (
                <div
                  key={appointment.id}
                  className="ma-card"
                  onClick={() => handleViewAppointment(appointment)}
                >
                  {/* Date Column */}
                  <div className="ma-card-date">
                    <div className="ma-card-date-main">
                      <span className="ma-card-day">{date}</span>
                      <span className="ma-card-month">Tháng {month}</span>
                    </div>
                    <span className="ma-card-weekday">{dayName}</span>
                  </div>

                  {/* Info Column */}
                  <div className="ma-card-info">
                    <div className="ma-card-header">
                      <StatusBadge status={appointment.status} />
                      <span className="ma-card-code">{appointment.code}</span>
                    </div>

                    <h3 className="ma-card-service">
                      <Stethoscope size={16} />
                      {appointment.service}
                    </h3>

                    <div className="ma-card-details">
                      <div className="ma-card-detail">
                        <Clock size={14} />
                        <span>{appointment.timeStart} - {appointment.timeEnd}</span>
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

                  {/* Arrow */}
                  <div className="ma-card-arrow">
                    <Stethoscope size={18} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
