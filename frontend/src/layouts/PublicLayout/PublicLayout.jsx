import React from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  CalendarCheck2,
  HeartPulse,
  LogIn,
  MapPin,
  PhoneCall,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Stethoscope,
  Users,
} from "lucide-react";
import Button from "../../components/Button/Button";
import "./PublicLayout.css";
import "./AuthPanel.css";

const NAV_ITEMS = [
  { label: "Trang chủ", to: "/" },
  { label: "Dịch vụ", to: "#services", icon: Stethoscope },
  { label: "Đội ngũ bác sĩ", to: "#team", icon: Users },
  { label: "Tra cứu lịch hẹn", to: "/lookup", icon: Search },
  { label: "Liên hệ", to: "#contact", icon: PhoneCall },
];

const AUTH_HIGHLIGHTS = [
  { icon: CalendarCheck2, text: "Đặt lịch nhanh và theo dõi trạng thái theo thời gian thực" },
  { icon: ShieldCheck, text: "Hồ sơ bệnh nhân được quản lý tập trung và bảo mật" },
  { icon: HeartPulse, text: "Kết nối thuận tiện với bác sĩ và lịch sử khám" },
];

export default function PublicLayout({ variant = "default" }) {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  if (variant === "auth") {
    return (
      <div className="layout-auth-new">
        <div className="auth-left-panel">
          <div className="auth-left-glow auth-left-glow--top" />
          <div className="auth-left-glow auth-left-glow--bottom" />

          <div className="auth-left-inner">
            <Link to="/" className="auth-left-brand">
              <div className="auth-left-logo" aria-hidden="true">
                <Sparkles className="mc-icon mc-icon--lg" />
              </div>
              <span>MediCare Clinic</span>
            </Link>

            <div className="auth-left-badge">Patient Experience Platform</div>
            <h2 className="auth-left-headline">
              Chăm sóc sức khỏe
              <br />
              <span className="auth-left-accent">toàn diện, tinh gọn và đáng tin cậy</span>
            </h2>
            <p className="auth-left-sub">
              Một không gian số để bệnh nhân đặt lịch, liên kết hồ sơ và theo dõi hành trình chăm sóc tại MediCare Clinic.
            </p>

            <div className="auth-highlight-list">
              {AUTH_HIGHLIGHTS.map((item) => (
                <div key={item.text} className="auth-highlight-item">
                  <div className="auth-highlight-icon">
                    <item.icon className="mc-icon mc-icon--md" />
                  </div>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>

            <div className="auth-left-social-proof">
              <div className="auth-social-avatars" aria-hidden="true">
                <span className="auth-social-avatar">AN</span>
                <span className="auth-social-avatar">BT</span>
                <span className="auth-social-avatar">LH</span>
                <span className="auth-social-more">+20k</span>
              </div>
              <div>
                <div className="auth-social-stars">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star key={index} className="mc-icon mc-icon--sm" fill="currentColor" />
                  ))}
                </div>
                <div className="auth-social-text">Được tin dùng bởi hơn 20.000 bệnh nhân tại Đà Nẵng</div>
              </div>
            </div>
          </div>
        </div>

        <div className="auth-right-panel">
          <div className="auth-right-inner">
            <div className="auth-card-new">
              <Outlet />
            </div>
            <div className="auth-footer-new">
              <small>© {new Date().getFullYear()} MediCare Clinic - Cơ sở Hải Châu</small>
              <div className="auth-footer-links">
                <a href="#!">Điều khoản sử dụng</a>
                <a href="#!">Chính sách bảo mật</a>
                <a href="#!">Trợ giúp</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="layout layout-public">
      <header className="public-header">
        <div className="public-header__inner">
          <div className="public-header__lead">
            <Link to="/" className="brand">
              <div className="brand__logo" aria-hidden="true">
                <ShieldCheck className="mc-icon mc-icon--lg" />
              </div>
              <div className="brand__text">
                <div className="brand__name">MediCare Clinic</div>
                <div className="brand__sub">Cơ sở Hải Châu</div>
              </div>
            </Link>

            <div className="public-header__meta">
              <MapPin className="mc-icon mc-icon--sm" />
              <span>123 Nguyễn Văn Linh, Hải Châu, Đà Nẵng</span>
            </div>
          </div>

          <nav className="public-nav" aria-label="Điều hướng chính">
            {NAV_ITEMS.map((item) => {
              const content = (
                <>
                  {item.icon ? <item.icon className="mc-icon mc-icon--sm" /> : null}
                  <span>{item.label}</span>
                </>
              );

              if (item.to.startsWith("#")) {
                return (
                  <a key={item.label} className="nav-link" href={item.to}>
                    {content}
                  </a>
                );
              }

              return (
                <Link
                  key={item.label}
                  className={isActive(item.to) ? "nav-link active" : "nav-link"}
                  to={item.to}
                >
                  {content}
                </Link>
              );
            })}

            <Button
              variant="secondary"
              size="sm"
              className="public-nav__login-btn"
              onClick={() => navigate("/patient/login")}
            >
              <LogIn className="mc-icon mc-icon--sm" />
              Đăng nhập
            </Button>
          </nav>
        </div>
      </header>

      <main className="public-main">
        <Outlet />
      </main>

      <footer className="public-footer">
        <div className="public-footer__inner">
          <div className="public-footer__brand-block">
            <div className="public-footer__brand-row">
              <div className="brand__logo public-footer__logo" aria-hidden="true">
                <ShieldCheck className="mc-icon mc-icon--md" />
              </div>
              <div>
                <div className="public-footer__title">MediCare Clinic</div>
                <div className="public-footer__subtitle">Nền tảng đặt lịch và quản lý chăm sóc sức khỏe</div>
              </div>
            </div>
            <div className="public-footer__copyright">© {new Date().getFullYear()} MediCare Clinic. Bảo lưu mọi quyền.</div>
          </div>

          <div className="public-footer__meta-grid">
            <div className="public-footer__meta-card">
              <div className="public-footer__meta-label">Giờ làm việc</div>
              <div className="public-footer__meta-value">08:00 - 11:30 · 13:30 - 17:00</div>
            </div>
            <div className="public-footer__meta-card">
              <div className="public-footer__meta-label">Hỗ trợ đặt lịch</div>
              <div className="public-footer__meta-value">1900 1234 · support@medicare.vn</div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
