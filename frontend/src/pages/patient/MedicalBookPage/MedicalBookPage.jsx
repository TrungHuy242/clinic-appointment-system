import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  CalendarDays,
  ChevronRight,
  FileText,
  Pill,
  Search,
  Stethoscope,
  User,
} from "lucide-react";
import { patientApi } from "../../../services/patientApi";
import "./MedicalBookPage.css";

function stripHtml(raw) {
  if (typeof raw !== "string") return "";
  return raw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() || "Đã xảy ra lỗi.";
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const days = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
  return {
    dayName: days[d.getDay()],
    day: d.getDate(),
    month: d.getMonth() + 1,
    year: d.getFullYear(),
  };
}

export default function MedicalBookPage() {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const loadRecords = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      const data = await patientApi.getMedicalRecords();
      setRecords(data || []);
    } catch (err) {
      setError(stripHtml(err.message) || "Không tải được sổ khám.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  return (
    <div className="mb-page">
      {/* Header */}
      <header className="mb-header">
        <div className="mb-header-content">
          <div className="mb-header-text">
            <h1>Sổ khám điện tử</h1>
            <p>Theo dõi lịch hẹn, kết quả khám và đơn thuốc tại Cơ sở Hải Châu</p>
          </div>
          <div className="mb-header-actions">
            <button
              className="mb-btn mb-btn--refresh"
              onClick={() => loadRecords(true)}
              disabled={refreshing}
            >
              <Search size={18} className={refreshing ? "spinning" : ""} />
              Làm mới
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mb-content">
        {loading ? (
          <div className="mb-state mb-state--loading">
            <div className="mb-spinner" />
            <p>Đang tải sổ khám...</p>
          </div>
        ) : error ? (
          <div className="mb-state mb-state--error">
            <div className="mb-state-icon mb-state-icon--error">
              <FileText size={32} />
            </div>
            <h3>Không tải được sổ khám</h3>
            <p>{error}</p>
            <button className="mb-btn mb-btn--primary" onClick={() => loadRecords(true)}>
              Thử lại
            </button>
          </div>
        ) : records.length === 0 ? (
          <div className="mb-state mb-state--empty">
            <div className="mb-state-icon">
              <BookOpen size={48} />
            </div>
            <h3>Chưa có hồ sơ khám bệnh</h3>
            <p>Bạn chưa hoàn thành lịch hẹn khám bệnh nào.</p>
            <button
              className="mb-btn mb-btn--primary"
              onClick={() => navigate("/book")}
            >
              Đặt lịch khám ngay
            </button>
          </div>
        ) : (
          <div className="mb-list">
            {records.map((record) => {
              const { dayName, day, month, year } = formatDate(record.examDate);
              return (
                <div
                  key={record.id}
                  className="mb-card"
                  onClick={() => navigate(`/app/patient/records/${record.id}`)}
                >
                  {/* Date */}
                  <div className="mb-card-date">
                    <div className="mb-card-date-main">
                      <span className="mb-card-day">{day}</span>
                      <span className="mb-card-month">Tháng {month}</span>
                      <span className="mb-card-year">{year}</span>
                    </div>
                    <span className="mb-card-weekday">{dayName}</span>
                  </div>

                  {/* Info */}
                  <div className="mb-card-info">
                    <div className="mb-card-header">
                      <span className="mb-card-code">
                        <FileText size={11} />
                        {record.appointmentCode}
                      </span>
                    </div>

                    <h3 className="mb-card-service">
                      <Stethoscope size={16} />
                      {record.service}
                    </h3>

                    <div className="mb-card-details">
                      <div className="mb-card-detail">
                        <User size={14} />
                        <span>{record.doctor.name}</span>
                      </div>
                      <div className="mb-card-detail">
                        <CalendarDays size={14} />
                        <span>{dayName}, {day}/{month}/{year}</span>
                      </div>
                      {record.diagnosis?.name && record.diagnosis.name !== "Chưa có chẩn đoán" && (
                        <div className="mb-card-detail mb-card-diagnosis">
                          <Stethoscope size={14} />
                          <span>{record.diagnosis.name}</span>
                        </div>
                      )}
                    </div>

                    {record.hasMedicines && (
                      <div className="mb-card-medicines-badge">
                        <Pill size={12} />
                        Có đơn thuốc
                      </div>
                    )}
                  </div>

                  {/* Arrow */}
                  <div className="mb-card-arrow">
                    <ChevronRight size={20} />
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
