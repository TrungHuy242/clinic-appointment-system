import React from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import "../../styles/layout.css";
import Button from "../../components/common/Button";

export default function PublicLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  return (
    <div className="layout layout-public">
      <header className="public-header">
        <div className="public-header__inner">
          <Link to="/" className="brand">
            <div className="brand__logo">+</div>
            <div className="brand__text">
              <div className="brand__name">MediCare Clinic</div>
              <div className="brand__sub">Cơ sở Hải Châu</div>
            </div>
          </Link>

          <nav className="public-nav">
            <Link className={isActive("/") && location.pathname === "/" ? "nav-link active" : "nav-link"} to="/">
              Trang chủ
            </Link>
            <Link className="nav-link" to="#">
              Dịch vụ
            </Link>
            <Link className="nav-link" to="#">
              Đội ngũ bác sĩ
            </Link>
            <Link className="nav-link" to="#">
              Liên hệ
            </Link>
            <Button variant="secondary" size="sm" onClick={() => navigate("/patient/login")}
              style={{ marginLeft: 4 }}>
              Đăng nhập
            </Button>
            <Button variant="primary" size="sm" onClick={() => navigate("/book")}
              style={{ marginLeft: 4, background: "var(--color-primary)", color: "#0d191b", fontWeight: 700 }}>
              Đặt lịch khám
            </Button>
          </nav>
        </div>
      </header>

      <main className="public-main">
        <Outlet />
      </main>

      <footer className="public-footer">
        <div className="public-footer__inner">
          <div>
            <strong>© 2024 MediCare Clinic.</strong> Bảo lưu mọi quyền.
          </div>
          <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
            Giờ làm việc: 08:00–11:30 · 13:30–17:00 — Hotline: 1900 1234
          </div>
        </div>
      </footer>
    </div>
  );
}
