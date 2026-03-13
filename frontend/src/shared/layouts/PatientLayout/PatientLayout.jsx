import React from "react";
import { Outlet, Link, NavLink, useNavigate } from "react-router-dom";
import { Bell, CalendarDays, FileText, ShieldCheck, UserRound } from "lucide-react";
import "./PatientLayout.css";

const NAV_ITEMS = [
  { to: "/patient/appointments", label: "Lịch hẹn", icon: CalendarDays },
  { to: "/patient/health-profile", label: "Hồ sơ sức khỏe", icon: FileText },
  { to: "/patient/account", label: "Tài khoản", icon: UserRound },
  { to: "/patient/notifications", label: "Thông báo", icon: Bell },
];

export default function PatientLayout() {
  const navigate = useNavigate();

  return (
    <div className="patient-layout">
      <header className="patient-header">
        <div className="patient-header-inner">
          <Link to="/" className="patient-brand">
            <div className="patient-brand__logo" aria-hidden="true">
              <ShieldCheck className="mc-icon mc-icon--md" />
            </div>
            <div>
              <div className="patient-brand__title">MediCare Clinic</div>
              <div className="patient-brand__subtitle">Cổng bệnh nhân</div>
            </div>
          </Link>

          <nav className="patient-nav" aria-label="Điều hướng bệnh nhân">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `patient-nav-link ${isActive ? "active" : ""}`}
              >
                <item.icon className="mc-icon mc-icon--sm patient-nav-icon" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="patient-header-actions">
            <NavLink to="/patient/notifications" className="patient-notif-btn" title="Thông báo">
              <Bell className="mc-icon mc-icon--md" />
              <span className="patient-notif-dot" />
            </NavLink>
            <button
              type="button"
              className="patient-avatar-btn patient-avatar-trigger"
              onClick={() => navigate("/patient/account")}
              title="Tài khoản của tôi"
            >
              <UserRound className="mc-icon mc-icon--md" />
            </button>
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