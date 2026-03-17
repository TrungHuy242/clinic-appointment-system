import React from "react";
import { Outlet, Link, NavLink, useNavigate } from "react-router-dom";
import { ShieldCheck, LogOut, Users, CalendarCheck, ClipboardList } from "lucide-react";
import { useAuth, ROLE_LABELS } from "../../services/AuthContext";
import "../StaffLayout/StaffLayout.css";

const NAV_ITEMS = [
  { to: "/app/reception/patients", label: "Quản lý bệnh nhân", icon: Users },
  { to: "/app/reception/appointments", label: "Quản lý lịch hẹn", icon: CalendarCheck },
  { to: "/app/reception/checkin", label: "Check-in", icon: ClipboardList },
];

export default function ReceptionLayout() {
  const navigate = useNavigate();
  const { user, role, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="staff-layout staff-layout--reception">
      <header className="staff-header">
        <div className="staff-header-inner">
          <Link to="/" className="staff-brand">
            <div className="staff-brand__logo">
              <ShieldCheck className="mc-icon mc-icon--md" />
            </div>
            <div>
              <div className="staff-brand__title">MediCare Clinic</div>
              <div className="staff-brand__subtitle">Cổng Lễ tân</div>
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
                <Users className="mc-icon mc-icon--md" />
              </button>
              <div className="staff-user-dropdown">
                <div className="staff-user-info">
                  <strong>{user?.fullName || user?.full_name || 'Nhân viên'}</strong>
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
