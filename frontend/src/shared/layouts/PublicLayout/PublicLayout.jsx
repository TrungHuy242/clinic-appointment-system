import React from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  LogIn,
  MapPin,
  PhoneCall,
  Search,
  ShieldCheck,
  Stethoscope,
  Users,
} from "lucide-react";
import Button from "../../components/Button/Button";
import "./PublicLayout.css";

const NAV_ITEMS = [
  { label: "Trang chủ", to: "/" },
  { label: "Dịch vụ", to: "#services", icon: Stethoscope },
  { label: "Đội ngũ bác sĩ", to: "#team", icon: Users },
  { label: "Tra cứu lịch hẹn", to: "/lookup", icon: Search },
  { label: "Liên hệ", to: "#contact", icon: PhoneCall },
];

export default function PublicLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

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
            <div className="public-footer__copyright">
              © {new Date().getFullYear()} MediCare Clinic. Bảo lưu mọi quyền.
            </div>
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