import React, { useState, useRef, useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  CalendarCheck2,
  HeartPulse,
  LogIn,
  LogOut,
  MapPin,
  PhoneCall,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Stethoscope,
  User,
  Users,
} from "lucide-react";
import Button from "../../components/Button/Button";
import { useAuth } from "../../services/authService";
import "./PublicLayout.css";
import "./AuthPanel.css";

const NAV_ITEMS = [
  { label: "Trang chủ",        to: "/" },
  { label: "Dịch vụ",          to: "#services",  icon: Stethoscope },
  { label: "Đội ngũ bác sĩ",   to: "#team",      icon: Users       },
  { label: "Tra cứu lịch hẹn", to: "/lookup",    icon: Search      },
  { label: "Liên hệ",          to: "#contact",   icon: PhoneCall   },
];

const AUTH_HIGHLIGHTS = [
  { icon: CalendarCheck2, text: "Đặt lịch nhanh và theo dõi trạng thái theo thời gian thực" },
  { icon: ShieldCheck,    text: "Hồ sơ bệnh nhân được quản lý tập trung và bảo mật"         },
  { icon: HeartPulse,     text: "Kết nối thuận tiện với bác sĩ và lịch sử khám"              },
];

export default function PublicLayout({ variant = "default" }) {
  const location  = useLocation();
  const navigate  = useNavigate();
  const { isAuthenticated, role, user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Auth variant (trang login / register) ──────────────────────────────
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
              Một không gian số để bệnh nhân đặt lịch, liên kết hồ sơ và theo dõi hành trình
              chăm sóc tại MediCare Clinic.
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
                <span className="auth-social-more">+50</span>
              </div>
              <div>
                <div className="auth-social-stars">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="mc-icon mc-icon--sm" fill="currentColor" />
                  ))}
                </div>
                <div className="auth-social-text">
                  Demo — số liệu giả lập cho môi trường phát triển
                </div>
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

  // ── Default variant (public pages: landing, /book, /lookup …) ─────────
  return (
    <div className="layout layout-public">
      <header className="public-header">
        <div className="public-header__inner">
          {/* Brand */}
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

          {/* Nav */}
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

            {/* ── Auth buttons: thay đổi theo trạng thái đăng nhập ── */}
            {isAuthenticated ? (
              <div className="public-nav__user-menu" ref={menuRef}>
                <button
                  type="button"
                  className={`public-nav__user-trigger${menuOpen ? " open" : ""}`}
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-haspopup="true"
                  aria-expanded={menuOpen}
                >
                  <span className="user-avatar">
                    <User className="mc-icon mc-icon--sm" />
                  </span>
                  <span className="user-name">
                    {user?.name || user?.fullName || "Cổng của tôi"}
                  </span>
                  <svg
                    className={`user-chevron${menuOpen ? " rotated" : ""}`}
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M2 4L6 8L10 4"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>

                {menuOpen && (
                  <div className="public-nav__dropdown" role="menu">
                    <div className="dropdown-user-info">
                      <div className="dropdown-user-name">
                        {user?.name || user?.fullName}
                      </div>
                      <div className="dropdown-user-role">{role}</div>
                    </div>
                    <button
                      type="button"
                      className="dropdown-item dropdown-item--danger"
                      role="menuitem"
                      onClick={() => {
                        logout();
                        navigate("/login");
                      }}
                    >
                      <LogOut className="mc-icon mc-icon--sm" />
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                className="public-nav__login-btn"
                onClick={() => navigate("/login")}
              >
                <LogIn className="mc-icon mc-icon--sm" />
                Đăng nhập
              </Button>
            )}
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
                <div className="public-footer__subtitle">
                  Nền tảng đặt lịch và quản lý chăm sóc sức khỏe
                </div>
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