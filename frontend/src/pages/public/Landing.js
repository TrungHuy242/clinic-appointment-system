import React from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/pages/landing.css";

export default function Landing() {
  const navigate = useNavigate();

  const specialties = [
    { icon: "👶", name: "Nhi khoa", color: "#e0f2fe", iconColor: "#0369a1" },
    { icon: "🔬", name: "Da liễu", color: "#fce7f3", iconColor: "#9d174d" },
    { icon: "👂", name: "Tai Mũi Họng", color: "#fef3c7", iconColor: "#92400e" },
    { icon: "🦷", name: "Nha khoa", color: "#d1fae5", iconColor: "#065f46" },
    { icon: "🫀", name: "Tim mạch", color: "#fee2e2", iconColor: "#991b1b" },
    { icon: "🧠", name: "Thần kinh", color: "#ede9fe", iconColor: "#5b21b6" },
  ];

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="landing-hero">
        <div className="landing-hero__content">
          <div className="landing-hero__badge">
            📍 MEDICARE HẢI CHÂU – 123 NGUYỄN VĂN LINH, ĐÀ NẴNG
          </div>
          <h1 className="landing-hero__title">
            Sức khỏe của bạn,
            <br />
            <span className="landing-hero__title-accent">Ưu tiên của chúng tôi</span>
          </h1>
          <p className="landing-hero__sub">
            Trải nghiệm dịch vụ chăm sóc sức khỏe đẳng cấp quốc tế tại cơ sở Hải Châu.
            Đặt lịch khám trực tuyến chỉ với vài thao tác đơn giản.
          </p>
          <div className="landing-hero__actions">
            <button
              className="landing-btn-primary"
              onClick={() => navigate("/book")}
            >
              Đặt lịch ngay
            </button>
            <button
              className="landing-btn-outline"
              onClick={() => navigate("/lookup")}
            >
              Tìm hiểu thêm
            </button>
          </div>
        </div>
        <div className="landing-hero__image">
          <div className="landing-hero__img-placeholder">
            <div className="hospital-illustration">
              <div className="hosp-building">🏥</div>
              <div className="hosp-tag">MediCare Hải Châu</div>
            </div>
          </div>
        </div>
      </section>

      {/* Step 1: Chọn chuyên khoa */}
      <section className="landing-section">
        <div className="landing-section__header">
          <div className="landing-step-num">1</div>
          <div>
            <h2 className="landing-section__title">Chọn Chuyên khoa</h2>
            <p className="landing-section__sub">Bạn cần khám chuyên khoa nào tại MediCare Hải Châu?</p>
          </div>
        </div>
        <div className="landing-specialty-grid">
          {specialties.map((sp) => (
            <button
              key={sp.name}
              className="landing-specialty-card"
              style={{ "--card-bg": sp.color, "--icon-color": sp.iconColor }}
              onClick={() => navigate("/book")}
            >
              <span className="landing-specialty-icon">{sp.icon}</span>
              <span className="landing-specialty-name">{sp.name}</span>
            </button>
          ))}
          <button
            className="landing-specialty-card landing-specialty-card--more"
            onClick={() => navigate("/book")}
          >
            <span className="landing-specialty-icon">⋯</span>
            <span className="landing-specialty-name">Xem tất cả</span>
          </button>
        </div>
      </section>

      {/* Step 2: Chọn bác sĩ */}
      <section className="landing-section">
        <div className="landing-section__header">
          <div className="landing-step-num">2</div>
          <div>
            <h2 className="landing-section__title">Chọn Bác sĩ & Thời gian</h2>
            <p className="landing-section__sub">Lựa chọn bác sĩ chuyên khoa phù hợp</p>
          </div>
        </div>
        <div className="landing-doctor-preview">
          <div className="landing-doctor-card landing-doctor-card--active">
            <div className="landing-doctor-top">
              <div className="landing-doctor-avatar">👨‍⚕️</div>
              <div className="landing-doctor-info">
                <div className="landing-doctor-name">BS. Nguyễn Văn A</div>
                <div className="landing-doctor-specialty">Da liễu</div>
                <div className="landing-doctor-rating">⭐ 4.8 · 8 năm KN</div>
              </div>
            </div>
            <div className="landing-slot-grid">
              {["08:00", "08:50", "09:15", "09:40", "10:05"].map((t, i) => (
                <button key={t} className={`landing-slot ${i === 1 ? "landing-slot--selected" : ""} ${i === 3 ? "landing-slot--booked" : ""}`}>
                  {t}
                </button>
              ))}
            </div>
            <button className="landing-book-btn" onClick={() => navigate("/book")}>
              Đặt lịch ngay →
            </button>
          </div>
          <div className="landing-doctor-card">
            <div className="landing-doctor-top">
              <div className="landing-doctor-avatar">👩‍⚕️</div>
              <div className="landing-doctor-info">
                <div className="landing-doctor-name">BS. Nguyễn Thị Sarah</div>
                <div className="landing-doctor-specialty">Nhi khoa</div>
                <div className="landing-doctor-rating">⭐ 4.9 · 10 năm KN</div>
              </div>
            </div>
            <div className="landing-no-schedule">
              <span>📅</span>
              <span>Bác sĩ không có lịch khám hôm nay</span>
            </div>
            <button className="landing-view-btn" onClick={() => navigate("/book")}>
              Xem lịch khác
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
