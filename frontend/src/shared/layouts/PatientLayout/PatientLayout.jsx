import React from "react";
import { Outlet, Link, NavLink, useNavigate } from "react-router-dom";
import { Bell, CalendarDays, FileText, ShieldCheck, UserRound, LogOut } from "lucide-react";
import { useAuth, ROLE_LABELS } from "../../services/AuthContext";
import "./PatientLayout.css";

const NAV_ITEMS = [
  { to: "/app/patient/appointments", label: "Lịch hẹn", icon: CalendarDays },
  { to: "/app/patient/health-profile", label: "Hồ sơ sức khỏe", icon: FileText },
  { to: "/app/patient/account", label: "Tài khoản", icon: UserRound },
  { to: "/app/patient/notifications", label: "Thông báo", icon: Bell },
];

export default function PatientLayout() {
  const navigate = useNavigate();
  const { user, role, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

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
            <NavLink to="/app/patient/notifications" className="patient-notif-btn" title="Thông báo">
              <Bell className="mc-icon mc-icon--md" />
              <span className="patient-notif-dot" />
            </NavLink>
            <div className="patient-user-menu">
              <button
                type="button"
                className="patient-avatar-btn patient-avatar-trigger"
                title="Tài khoản của tôi"
              >
                <UserRound className="mc-icon mc-icon--md" />
              </button>
              <div className="patient-user-dropdown">
                <div className="patient-user-info">
                  <strong>{user?.fullName || user?.full_name || 'Bệnh nhân'}</strong>
                  <span>{ROLE_LABELS[role]}</span>
                </div>
                <hr />
                <button onClick={handleLogout} className="patient-logout-btn">
                  <LogOut className="mc-icon mc-icon--sm" />
                  Đăng xuất
                </button>
              </div>
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
