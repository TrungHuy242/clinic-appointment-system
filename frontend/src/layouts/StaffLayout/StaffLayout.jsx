import React, { useEffect, useState } from "react";
import { Outlet, Link, NavLink, useNavigate } from "react-router-dom";
import {
  BarChart3,
  Bell,
  Building2,
  Calendar,
  CalendarCheck,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Settings,
  ShieldCheck,
  Stethoscope,
  UserRound,
  Users,
} from "lucide-react";
import { ROLE_LABELS, useAuth } from "../../services/authService";
import { receptionApi } from "../../services/receptionApi";
import { doctorApi } from "../../services/doctorApi";
import "./StaffLayout.css";

const STAFF_PORTALS = {
  reception: {
    subtitle: "Cổng lễ tân",
    accentColor: "#0891b2",
    wrapperClassName: "staff-layout--reception",
    avatarIcon: Users,
    fallbackName: "Nhân viên",
    profileApi: () => receptionApi.getProfile(),
    navItems: [
      { to: "/app/reception/dashboard", label: "Trang chủ", icon: LayoutDashboard },
      { to: "/app/reception/appointments", label: "Lịch hẹn", icon: CalendarCheck },
      { to: "/app/reception/checkin", label: "Check-in", icon: ClipboardList },
      { to: "/app/reception/patients", label: "Bệnh nhân", icon: Users },
      { to: "/app/reception/profile", label: "Hồ sơ của tôi", icon: UserRound },
    ],
  },
  doctor: {
    subtitle: "Cổng bác sĩ",
    accentColor: "#7c3aed",
    wrapperClassName: "staff-layout--doctor",
    avatarIcon: Stethoscope,
    fallbackName: "Bác sĩ",
    profileApi: () => doctorApi.getProfile(),
    navItems: [
      { to: "/app/doctor/schedule", label: "Lịch làm việc", icon: Calendar },
      { to: "/app/doctor/queue", label: "Hàng đợi khám", icon: ClipboardList },
      { to: "/app/doctor/visits", label: "Phiếu khám", icon: Stethoscope },
      { to: "/app/doctor/profile", label: "Hồ sơ của tôi", icon: UserRound },
    ],
  },
  admin: {
    subtitle: "Cổng quản trị",
    accentColor: "#dc2626",
    wrapperClassName: "staff-layout--admin",
    avatarIcon: Settings,
    fallbackName: "Quản trị viên",
    profileApi: () => Promise.reject(new Error("No profile API")),
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileName, setProfileName] = useState("");

  // Fetch staff profile to display name in sidebar
  useEffect(() => {
    config.profileApi()
      .then((data) => {
        const name =
          data?.full_name ||
          data?.fullName ||
          data?.name ||
          data?.username ||
          "";
        if (name) setProfileName(name);
      })
      .catch(() => {});
  }, []);

  const displayName =
    profileName ||
    user?.fullName ||
    user?.full_name ||
    user?.name ||
    config.fallbackName;

  function handleLogout() {
    logout();
    navigate("/login");
  }

  function handleNavClick() {
    setSidebarOpen(false);
  }

  return (
    <div className={`staff-layout ${config.wrapperClassName}`}>
      {/* ── Sidebar ── */}
      <aside className={`staff-sidebar${sidebarOpen ? " open" : ""}`}>
        {/* Brand */}
        <div className="ssidebar-brand">
          <Link to="/" className="ssidebar-brand-link">
            <div className="ssidebar-logo" aria-hidden="true">
              <ShieldCheck className="mc-icon mc-icon--md" />
            </div>
            <div>
              <div className="ssidebar-brand-name">MediCare Clinic</div>
              <div
                className="ssidebar-brand-sub"
                style={{ color: config.accentColor }}
              >
                {config.subtitle}
              </div>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="ssidebar-nav" aria-label="Điều hướng nhân viên">
          {config.navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={handleNavClick}
              className={({ isActive }) =>
                `ssidebar-nav-link${isActive ? " active" : ""}`
              }
            >
              <item.icon className="mc-icon mc-icon--sm ssidebar-nav-icon" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer: user info + logout */}
        <div className="ssidebar-footer">
          <div className="ssidebar-user">
            <div
              className="ssidebar-user-avatar"
              aria-hidden="true"
            >
              <AvatarIcon className="mc-icon mc-icon--md" />
            </div>
            <div className="ssidebar-user-info">
              <strong className="ssidebar-user-name">{displayName}</strong>
              <span className="ssidebar-user-role">{ROLE_LABELS[role]}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="ssidebar-logout"
            title="Đăng xuất"
          >
            <LogOut className="mc-icon mc-icon--sm" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* ── Mobile overlay ── */}
      {sidebarOpen && (
        <div
          className="ssidebar-overlay"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Main content ── */}
      <div className="staff-main">
        {/* Mobile top bar */}
        <header className="staff-mobile-bar">
          <button
            type="button"
            className="staff-mobile-menu-btn"
            onClick={() => setSidebarOpen(true)}
            aria-label="Mở menu"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <div className="staff-mobile-brand">
            <div className="staff-mobile-logo" aria-hidden="true">
              <ShieldCheck className="mc-icon mc-icon--sm" />
            </div>
            <span style={{ color: config.accentColor }}>{config.subtitle}</span>
          </div>
          <NavLink
            to={config.navItems[0]?.to || "/"}
            className="staff-mobile-home"
            title="Trang chủ"
          >
            <LayoutDashboard className="mc-icon mc-icon--md" />
          </NavLink>
        </header>

        <main className="staff-content">
          <div className="staff-content-inner">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
