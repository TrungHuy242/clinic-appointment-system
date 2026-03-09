import React from "react";
import { Outlet, Link, NavLink, useNavigate } from "react-router-dom";
import "../../styles/pages/patient-portal.css";

export default function PatientLayout() {
  const navigate = useNavigate();

  return (
    <div className="patient-layout">
      <header className="patient-header">
        <div className="patient-header-inner">
          <Link to="/" className="patient-brand">
            <div className="brand__logo" style={{ width: 34, height: 34, fontSize: 16 }}>+</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15 }}>MediCare Clinic</div>
              <div style={{ fontSize: 11, color: "var(--color-text-muted)" }}>Cổng bệnh nhân</div>
            </div>
          </Link>

          <nav className="patient-nav">
            {[
              { to: "/patient/appointments", label: "Lịch hẹn", icon: "📋" },
              { to: "/patient/health-profile", label: "Hồ sơ sức khỏe", icon: "🩺" },
              { to: "/patient/account", label: "Tài khoản", icon: "👤" },
              { to: "/patient/notifications", label: "Thông báo", icon: "🔔" },
            ].map(item => (
              <NavLink key={item.to} to={item.to}
                className={({ isActive }) => `patient-nav-link ${isActive ? "active" : ""}`}>
                <span className="patient-nav-icon">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="patient-header-actions">
            <NavLink to="/patient/notifications" className="patient-notif-btn">
              🔔<span className="patient-notif-dot" />
            </NavLink>
            <div className="patient-avatar-btn" onClick={() => navigate("/patient/account")} title="Tài khoản của tôi">
              👤
            </div>
          </div>
        </div>
      </header>

      <main className="patient-content">
        <div className="patient-content-inner">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
