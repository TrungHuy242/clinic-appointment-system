import React, { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BarChart3,
  Building2,
  CalendarDays,  FileText,
  PanelLeftClose,
  PanelLeftOpen,
  ScanLine,
  ShieldCheck,
  Stethoscope,
  Users,
} from "lucide-react";
import Button from "../../components/Button/Button";
import "./DashboardLayout.css";

const ROLE_LABELS = {
  receptionist: "Lễ tân",
  doctor: "Bác sĩ",
  admin: "Quản trị viên",
};

const ROLE_ROUTES = {
  receptionist: "/app/reception/appointments",
  doctor: "/app/doctor/schedule",
  admin: "/app/admin/catalog",
};

const MENUS = {
  doctor: [
    { to: "/app/doctor/schedule", label: "Lịch của tôi", icon: CalendarDays },
    { to: "/app/doctor/visit", label: "Khám bệnh", icon: Stethoscope },
  ],
  admin: [
    { to: "/app/admin/catalog", label: "Chuyên khoa và cơ sở", icon: Building2 },
    { to: "/app/admin/reports", label: "Báo cáo và thống kê", icon: BarChart3 },
    { to: "/app/admin/audit-logs", label: "Nhật ký thao tác", icon: FileText },
  ],
  receptionist: [
    { to: "/app/reception/appointments", label: "Quản lý lịch hẹn", icon: CalendarDays },
    { to: "/app/reception/checkin", label: "Check-in PA4", icon: ScanLine },
    { to: "/app/reception/patients", label: "Bệnh nhân", icon: Users },
  ],
};

export default function DashboardLayout() {
  const [role, setRole] = useState("receptionist");
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  const menu = MENUS[role] || MENUS.receptionist;

  return (
    <div className={`layout layout-dashboard ${collapsed ? "sidebar-collapsed" : ""}`}>
      <aside className="sidebar">
        <div className="sidebar__top">
          <NavLink to="/" className="sidebar-brand">
            <div className="brand__logo" aria-hidden="true">
              <ShieldCheck className="mc-icon mc-icon--md" />
            </div>
            {!collapsed && (
              <div>
                <div className="brand__name">MediCare Clinic</div>
                <div className="sidebar-brand__meta">Operations Workspace</div>
              </div>
            )}
          </NavLink>
          <button
            type="button"
            className="icon-btn"
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
          >
            {collapsed ? <PanelLeftOpen className="mc-icon mc-icon--md" /> : <PanelLeftClose className="mc-icon mc-icon--md" />}
          </button>
        </div>

        <div className="sidebar__section">
          {!collapsed && <div className="sidebar__label">{ROLE_LABELS[role]}</div>}
          <nav className="sidebar__nav">
            {menu.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `sidebar__link${isActive ? " active" : ""}`}
              >
                <span className="sidebar__icon">
                  <item.icon className="mc-icon mc-icon--md" />
                </span>
                <span className="sidebar__text">{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="sidebar__bottom">
          {!collapsed && <div>MediCare Clinic · Cơ sở Hải Châu</div>}
        </div>
      </aside>

      <div className="dashboard-main">
        <header className="topbar">
          <div className="topbar__left">
            <div className="topbar__eyebrow">Dashboard</div>
            <div className="topbar__title">{ROLE_LABELS[role]} · MediCare Admin Portal</div>
          </div>

          <div className="topbar__right">
            <div className="dashboard-role-switcher">
              <span className="dashboard-role-switcher__label">Vai trò</span>
              <select
                className="dashboard-role-switcher__select"
                value={role}
                onChange={(event) => {
                  const next = event.target.value;
                  setRole(next);
                  navigate(ROLE_ROUTES[next]);
                }}
                title="Đổi vai trò để demo"
              >
                <option value="receptionist">Lễ tân</option>
                <option value="doctor">Bác sĩ</option>
                <option value="admin">Quản trị viên</option>
              </select>
            </div>

            <Button variant="secondary" size="sm" onClick={() => navigate("/")}>
              <ArrowLeft className="mc-icon mc-icon--sm" />
              Về trang chủ
            </Button>
          </div>
        </header>

        <main className="dashboard-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}