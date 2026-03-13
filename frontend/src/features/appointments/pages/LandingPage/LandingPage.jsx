import React from "react";
import {
  ArrowRight,
  Baby,
  Brain,
  Building2,
  CircleAlert,
  Clock3,
  HeartPulse,
  MapPin,
  ShieldCheck,
  Smile,
  Sparkles,
  Star,
  Stethoscope,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./LandingPage.css";

const SPECIALTIES = [
  { icon: Baby, name: "Nhi khoa", slug: "nhi-khoa" },
  { icon: Sparkles, name: "Da liễu", slug: "da-lieu" },
  { icon: Stethoscope, name: "Tai Mũi Họng", slug: "tai-mui-hong" },
  { icon: Smile, name: "Nha khoa", slug: "nha-khoa" },
  { icon: HeartPulse, name: "Tim mạch", slug: "tim-mach" },
  { icon: Brain, name: "Thần kinh", slug: "than-kinh" },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      <section className="landing-hero">
        <div className="landing-hero__content">
          <div className="landing-hero__badge">
            <ShieldCheck className="mc-icon mc-icon--sm" />
            MediCare Hải Châu - 123 Nguyễn Văn Linh, Đà Nẵng
          </div>
          <h1 className="landing-hero__title">
            Chăm sóc sức khỏe hiện đại,
            <br />
            <span className="landing-hero__title-accent">đặt lịch nhanh, trải nghiệm rõ ràng</span>
          </h1>
          <p className="landing-hero__sub">
            Hệ thống đặt lịch trực tuyến cho phép bạn chọn chuyên khoa, bác sĩ và khung giờ phù hợp
            chỉ trong vài bước ngắn gọn.
          </p>
          <div className="landing-hero__actions">
            <button className="landing-btn-primary" onClick={() => navigate("/book")}>
              Đặt lịch ngay
              <ArrowRight className="mc-icon mc-icon--sm" />
            </button>
            <button className="landing-btn-outline" onClick={() => navigate("/lookup")}>
              Tra cứu lịch hẹn
            </button>
          </div>
          <div className="landing-hero__stats">
            <div className="landing-hero__stat-card">
              <span className="landing-hero__stat-value">24/7</span>
              <span className="landing-hero__stat-label">Đặt lịch trực tuyến</span>
            </div>
            <div className="landing-hero__stat-card">
              <span className="landing-hero__stat-value">30+</span>
              <span className="landing-hero__stat-label">Bác sĩ và chuyên khoa</span>
            </div>
            <div className="landing-hero__stat-card">
              <span className="landing-hero__stat-value">4.9</span>
              <span className="landing-hero__stat-label">Điểm hài lòng bệnh nhân</span>
            </div>
          </div>
        </div>

        <div className="landing-hero__image">
          <div className="landing-hero__img-placeholder">
            <div className="hospital-illustration">
              <div className="hosp-building">
                <Building2 className="mc-icon landing-hero__building-icon" />
              </div>
              <div className="hosp-tag">
                <MapPin className="mc-icon mc-icon--sm" />
                Cơ sở Hải Châu
              </div>
              <div className="landing-hero__floating-card">
                <div className="landing-hero__floating-title">Lịch trống hôm nay</div>
                <div className="landing-hero__floating-row">
                  <Stethoscope className="mc-icon mc-icon--sm" />
                  Da liễu · 09:15 · 10:05
                </div>
                <div className="landing-hero__floating-row">
                  <Clock3 className="mc-icon mc-icon--sm" />
                  Xác nhận PA1 trong vòng 15 phút
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section" id="services">
        <div className="landing-section__header">
          <div className="landing-step-num">1</div>
          <div>
            <h2 className="landing-section__title">Chọn chuyên khoa</h2>
            <p className="landing-section__sub">Khởi đầu bằng chuyên khoa phù hợp với nhu cầu khám của bạn.</p>
          </div>
        </div>
        <div className="landing-specialty-grid">
          {SPECIALTIES.map((specialty) => (
            <button
              key={specialty.name}
              className={`landing-specialty-card landing-specialty-card--${specialty.slug}`}
              onClick={() => navigate("/book")}
            >
              <span className="landing-specialty-icon">
                <specialty.icon className="mc-icon landing-specialty-icon__svg" />
              </span>
              <span className="landing-specialty-name">{specialty.name}</span>
            </button>
          ))}
          <button className="landing-specialty-card landing-specialty-card--more" onClick={() => navigate("/book")}>
            <span className="landing-specialty-icon">
              <ArrowRight className="mc-icon landing-specialty-icon__svg" />
            </span>
            <span className="landing-specialty-name">Xem toàn bộ</span>
          </button>
        </div>
      </section>

      <section className="landing-section" id="team">
        <div className="landing-section__header">
          <div className="landing-step-num">2</div>
          <div>
            <h2 className="landing-section__title">Chọn bác sĩ và thời gian</h2>
            <p className="landing-section__sub">Tham khảo lịch khám trực tiếp và chốt khung giờ phù hợp.</p>
          </div>
        </div>
        <div className="landing-doctor-preview">
          <div className="landing-doctor-card landing-doctor-card--active">
            <div className="landing-doctor-top">
              <div className="landing-doctor-avatar">NA</div>
              <div className="landing-doctor-info">
                <div className="landing-doctor-name">BS. Nguyễn Văn A</div>
                <div className="landing-doctor-specialty">Da liễu</div>
                <div className="landing-doctor-rating">
                  <Star className="mc-icon mc-icon--sm" fill="currentColor" />
                  4.8 · 8 năm kinh nghiệm
                </div>
              </div>
            </div>
            <div className="landing-slot-grid">
              {["08:00", "08:50", "09:15", "09:40", "10:05"].map((time, index) => (
                <button
                  key={time}
                  className={`landing-slot ${index === 1 ? "landing-slot--selected" : ""} ${index === 3 ? "landing-slot--booked" : ""}`}
                >
                  {time}
                </button>
              ))}
            </div>
            <button className="landing-book-btn" onClick={() => navigate("/book")}>
              Đặt lịch với bác sĩ này
              <ArrowRight className="mc-icon mc-icon--sm" />
            </button>
          </div>
          <div className="landing-doctor-card">
            <div className="landing-doctor-top">
              <div className="landing-doctor-avatar landing-doctor-avatar--alt">NS</div>
              <div className="landing-doctor-info">
                <div className="landing-doctor-name">BS. Nguyễn Thị Sarah</div>
                <div className="landing-doctor-specialty">Nhi khoa</div>
                <div className="landing-doctor-rating">
                  <Star className="mc-icon mc-icon--sm" fill="currentColor" />
                  4.9 · 10 năm kinh nghiệm
                </div>
              </div>
            </div>
            <div className="landing-no-schedule">
              <CircleAlert className="mc-icon mc-icon--sm" />
              <span>Bác sĩ không có lịch trống hôm nay</span>
            </div>
            <button className="landing-view-btn" onClick={() => navigate("/book")}>
              Xem lịch ngày khác
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}