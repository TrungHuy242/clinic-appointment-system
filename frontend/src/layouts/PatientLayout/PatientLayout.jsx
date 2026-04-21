import React, { useEffect, useState } from "react";
import { Outlet, Link, NavLink, useNavigate } from "react-router-dom";
import {
  Bell,
  CalendarDays,
  FileText,
  LogOut,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { ROLE_LABELS, useAuth } from "../../services/authService";
import { patientApi } from "../../services/patientApi";
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
  const [hasUnread, setHasUnread] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Fetch notifications for badge
  useEffect(() => {
    patientApi.getNotifications()
      .then((data) => {
        const unread = Array.isArray(data)
          ? data.some((n) => !n.is_read && !n.read)
          : (data.count > 0 || data.unread_count > 0);
        setHasUnread(unread);
      })
      .catch(() => {
        setHasUnread(false);
      });
  }, []);

  // Fetch account profile to display real name in sidebar
  useEffect(() => {
    patientApi.getAccountInfo()
      .then((data) => {
        const name = data?.full_name || data?.fullName || data?.name || "";
        if (name) setProfileName(name);
      })
      .catch(() => {});
  }, []);

  const displayName =
    profileName || user?.fullName || user?.full_name || user?.name || "Bệnh nhân";

  function handleLogout() {
    logout();
    navigate("/login");
  }

  // Close sidebar on nav click (mobile)
  function handleNavClick() {
    setSidebarOpen(false);
  }

  return (
    <div className="patient-layout">
      {/* ── Sidebar ── */}
      <aside className={`patient-sidebar${sidebarOpen ? " open" : ""}`}>
        {/* Brand */}
        <div className="psidebar-brand">
          <Link to="/" className="psidebar-brand-link">
            <div className="psidebar-logo" aria-hidden="true">
              <ShieldCheck className="mc-icon mc-icon--md" />
            </div>
            <div>
              <div className="psidebar-brand-name">MediCare Clinic</div>
              <div className="psidebar-brand-sub">Cổng bệnh nhân</div>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="psidebar-nav" aria-label="Điều hướng bệnh nhân">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={handleNavClick}
              className={({ isActive }) =>
                `psidebar-nav-link ${isActive ? "active" : ""}`
              }
            >
              <item.icon className="mc-icon mc-icon--sm psidebar-nav-icon" />
              <span>{item.label}</span>
              {item.to === "/app/patient/notifications" && hasUnread && (
                <span className="psidebar-nav-dot" aria-label="Có thông báo mới" />
              )}
            </NavLink>
          ))}
        </nav>

        {/* User info + logout at bottom */}
        <div className="psidebar-footer">
          <div className="psidebar-user">
            <div className="psidebar-user-avatar" aria-hidden="true">
              <UserRound className="mc-icon mc-icon--md" />
            </div>
            <div className="psidebar-user-info">
              <strong className="psidebar-user-name">{displayName}</strong>
              <span className="psidebar-user-role">{ROLE_LABELS[role]}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="psidebar-logout"
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
          className="psidebar-overlay"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Main content ── */}
      <div className="patient-main">
        {/* Mobile top bar */}
        <header className="patient-mobile-bar">
          <button
            type="button"
            className="patient-mobile-menu-btn"
            onClick={() => setSidebarOpen(true)}
            aria-label="Mở menu"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <div className="patient-mobile-brand">
            <div className="patient-mobile-logo" aria-hidden="true">
              <ShieldCheck className="mc-icon mc-icon--sm" />
            </div>
            <span>MediCare Clinic</span>
          </div>
          <NavLink
            to="/app/patient/notifications"
            className="patient-mobile-notif"
            title="Thông báo"
          >
            <Bell className="mc-icon mc-icon--md" />
            {hasUnread && <span className="patient-notif-dot" />}
          </NavLink>
        </header>

        <main className="patient-content">
          <div className="patient-content-inner">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
