import React from "react";
import { Outlet, Link, NavLink, useNavigate } from "react-router-dom";
import { ShieldCheck, LogOut, Stethoscope, Calendar, ClipboardList } from "lucide-react";
import { useAuth, ROLE_LABELS } from "../../services/AuthContext";
import "../StaffLayout/StaffLayout.css";

const NAV_ITEMS = [
  { to: "/app/doctor/schedule", label: "Lịch làm việc", icon: Calendar },
  { to: "/app/doctor/queue", label: "Hàng đợi khám", icon: ClipboardList },
  { to: "/app/doctor/visits", label: "Phiếu khám", icon: Stethoscope },
];

export default function DoctorLayout() {
  const navigate = useNavigate();
  const { user, role, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="staff-layout staff-layout--doctor">
      <header className="staff-header">
        <div className="staff-header-inner">
          <Link to="/" className="staff-brand">
            <div className="staff-brand__logo">
              <ShieldCheck className="mc-icon mc-icon--md" />
            </div>
            <div>
              <div className="staff-brand__title">MediCare Clinic</div>
              <div className="staff-brand__subtitle">Cổng Bác sĩ</div>
            </div>
          </Link>

          <nav className="staff-nav">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `staff-nav-link ${isActive ? "active" : ""}`}
              >
                <item.icon className="mc-icon mc-icon--sm" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="staff-header-actions">
            <div className="staff-user-menu">
              <button className="staff-avatar-trigger">
                <Stethoscope className="mc-icon mc-icon--md" />
              </button>
              <div className="staff-user-dropdown">
                <div className="staff-user-info">
                  <strong>{user?.fullName || user?.full_name || 'Bác sĩ'}</strong>
                  <span>{ROLE_LABELS[role]}</span>
                </div>
                <hr />
                <button onClick={handleLogout} className="staff-logout-btn">
                  <LogOut className="mc-icon mc-icon--sm" />
                  Đăng xuất
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="staff-content">
        <div className="staff-content-inner">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
