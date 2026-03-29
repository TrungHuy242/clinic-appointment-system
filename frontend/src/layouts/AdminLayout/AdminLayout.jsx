import React from "react";
import { Outlet, Link, NavLink, useLocation } from "react-router-dom";
import {
  BarChart3,
  Building2,
  CalendarClock,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  Users,
} from "lucide-react";
import { ROLE_LABELS, useAuth } from "../../services/authService";
import "./AdminLayout.css";

const ADMIN_NAV_ITEMS = [
  { to: "/app/admin/dashboard", label: "Tổng quan", icon: LayoutDashboard },
  { to: "/app/admin/users", label: "Người dùng", icon: Users },
  { to: "/app/admin/catalog", label: "Danh mục", icon: Building2 },
  { to: "/app/admin/audit", label: "Nhật ký", icon: ClipboardList },
  { to: "/app/admin/appointments", label: "Lịch hẹn", icon: CalendarClock },
  { to: "/app/admin/reports", label: "Báo cáo", icon: BarChart3 },
];

const PAGE_TITLES = {
  "/app/admin/dashboard": "Tổng quan",
  "/app/admin/users": "Quản lý người dùng",
  "/app/admin/catalog": "Danh mục hệ thống",
  "/app/admin/audit": "Nhật ký hoạt động",
  "/app/admin/appointments": "Quản lý lịch hẹn",
  "/app/admin/reports": "Báo cáo & Thống kê",
};

function getPageTitle(pathname) {
  if (pathname.includes("/catalog/doctors/")) {
    return pathname.endsWith("/create") ? "Thêm bác sĩ" : "Chi tiết bác sĩ";
  }
  if (pathname.includes("/catalog/receptionists/")) {
    return pathname.endsWith("/create") ? "Thêm lễ tân" : "Chi tiết lễ tân";
  }
  return PAGE_TITLES[pathname] || "Quản trị hệ thống";
}

export default function AdminLayout() {
  const { user, role, logout } = useAuth();
  const { pathname } = useLocation();
  const pageTitle = getPageTitle(pathname);

  return (
    <div className="admin-layout">
      {/* Sidebar trái - cố định */}
      <aside className="admin-layout__sidebar">
        <Link to="/" className="admin-layout__sidebar-brand">
          <div className="admin-layout__sidebar-logo">
            <ShieldCheck className="mc-icon mc-icon--md" />
          </div>
          <div>
            <div className="admin-layout__sidebar-brand-title">MediCare Clinic</div>
            <div className="admin-layout__sidebar-brand-subtitle">Cổng quản trị</div>
          </div>
        </Link>

        <nav className="admin-layout__sidebar-nav" aria-label="Điều hướng quản trị">
          {ADMIN_NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to !== "/app/admin/catalog"}
              className={({ isActive }) =>
                `admin-layout__sidebar-nav-link ${isActive ? "admin-layout__sidebar-nav-link--active" : ""}`
              }
            >
              <item.icon className="mc-icon mc-icon--sm" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="admin-layout__sidebar-footer">
          <div className="admin-layout__sidebar-user">
            <div className="admin-layout__sidebar-user-info">
              <span className="admin-layout__sidebar-user-name">
                {user?.fullName || user?.full_name || "Quản trị viên"}
              </span>
              <span className="admin-layout__sidebar-user-role">
                {ROLE_LABELS[role] || "Quản trị viên"}
              </span>
            </div>
            <button
              type="button"
              onClick={logout}
              className="admin-layout__sidebar-logout"
              title="Đăng xuất"
            >
              <LogOut className="mc-icon mc-icon--sm" />
            </button>
          </div>
        </div>
      </aside>

      {/* Body bên phải */}
      <div className="admin-layout__body">
        {/* Topbar mỏng - page title */}
        <header className="admin-layout__topbar">
          <h1 className="admin-layout__topbar-title">{pageTitle}</h1>
        </header>

        {/* Main content */}
        <main className="admin-layout__content">
          <div className="admin-layout__content-inner">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
