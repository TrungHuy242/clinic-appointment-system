import React from "react";
import { Outlet, Link, NavLink, useNavigate } from "react-router-dom";
import {
  BarChart3,
  Building2,
  Calendar,
  CalendarCheck,
  ClipboardList,
  LogOut,
  Settings,
  ShieldCheck,
  Stethoscope,
  Users,
} from "lucide-react";
import { ROLE_LABELS, useAuth } from "../../services/authService";
import "./StaffLayout.css";

const STAFF_PORTALS = {
  reception: {
    subtitle: "Cổng lễ tân",
    wrapperClassName: "staff-layout--reception",
    avatarIcon: Users,
    fallbackName: "Nhân viên",
    navItems: [
      { to: "/app/reception/patients", label: "Quản lý bệnh nhân", icon: Users },
      { to: "/app/reception/appointments", label: "Quản lý lịch hẹn", icon: CalendarCheck },
      { to: "/app/reception/checkin", label: "Check-in", icon: ClipboardList },
    ],
  },
  doctor: {
    subtitle: "Cổng bác sĩ",
    wrapperClassName: "staff-layout--doctor",
    avatarIcon: Stethoscope,
    fallbackName: "Bác sĩ",
    navItems: [
      { to: "/app/doctor/schedule", label: "Lịch làm việc", icon: Calendar },
      { to: "/app/doctor/queue", label: "Hàng đợi khám", icon: ClipboardList },
      { to: "/app/doctor/visits", label: "Phiếu khám", icon: Stethoscope },
    ],
  },
  admin: {
    subtitle: "Cổng quản trị",
    wrapperClassName: "staff-layout--admin",
    avatarIcon: Settings,
    fallbackName: "Quản trị viên",
    navItems: [
      { to: "/app/admin/users", label: "Quản lý người dùng", icon: Users },
      { to: "/app/admin/catalog", label: "Danh mục", icon: Building2 },
      { to: "/app/admin/audit", label: "Nhật ký", icon: ClipboardList },
      { to: "/app/admin/reports", label: "Báo cáo", icon: BarChart3 },
    ],
  },
};

export default function StaffLayout({ portal }) {
  const navigate = useNavigate();
  const { user, role, logout } = useAuth();
  const config = STAFF_PORTALS[portal] || STAFF_PORTALS.reception;
  const AvatarIcon = config.avatarIcon;

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className={`staff-layout ${config.wrapperClassName}`}>
      <header className="staff-header">
        <div className="staff-header-inner">
          <Link to="/" className="staff-brand">
            <div className="staff-brand__logo">
              <ShieldCheck className="mc-icon mc-icon--md" />
            </div>
            <div>
              <div className="staff-brand__title">MediCare Clinic</div>
              <div className="staff-brand__subtitle">{config.subtitle}</div>
            </div>
          </Link>

          <nav className="staff-nav" aria-label="Điều hướng nhân viên">
            {config.navItems.map((item) => (
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
              <button type="button" className="staff-avatar-trigger" title="Tài khoản của tôi">
                <AvatarIcon className="mc-icon mc-icon--md" />
              </button>
              <div className="staff-user-dropdown">
                <div className="staff-user-info">
                  <strong>{user?.fullName || user?.full_name || config.fallbackName}</strong>
                  <span>{ROLE_LABELS[role]}</span>
                </div>
                <hr />
                <button type="button" onClick={handleLogout} className="staff-logout-btn">
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
