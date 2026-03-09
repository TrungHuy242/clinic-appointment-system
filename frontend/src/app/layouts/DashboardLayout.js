import React, { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import "../../styles/layout.css";
import Button from "../../components/common/Button";

export default function DashboardLayout() {
  const [role, setRole] = useState("receptionist"); // receptionist | doctor | admin
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  const menu = getMenuByRole(role);

  return (
    <div className={`layout layout-dashboard ${collapsed ? "sidebar-collapsed" : ""}`}>
      <aside className="sidebar">
        <div className="sidebar__top">
          <NavLink to="/" className="sidebar-brand">
            <div className="brand__logo">+</div>
            {!collapsed && (
              <div>
                <div className="brand__name">MediCare Clinic</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 1 }}>Admin Portal</div>
              </div>
            )}
          </NavLink>
          <button
            type="button"
            className="icon-btn"
            onClick={() => setCollapsed(!collapsed)}
            title="Thu gọn sidebar"
          >
            {collapsed ? "→" : "←"}
          </button>
        </div>

        <div className="sidebar__section">
          {!collapsed && <div className="sidebar__label">{getRoleName(role)}</div>}
          <nav className="sidebar__nav">
            {menu.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `sidebar__link${isActive ? " active" : ""}`}
              >
                <span className="sidebar__icon">{item.icon}</span>
                <span className="sidebar__text">{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="sidebar__bottom">
          {!collapsed && <div>MediCare Clinic · Hải Châu</div>}
        </div>
      </aside>

      <div className="dashboard-main">
        <header className="topbar">
          <div className="topbar__left">
            <div className="topbar__title">
              {getRoleName(role)} — MediCare Admin Portal
            </div>
          </div>

          <div className="topbar__right">
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--color-bg-soft)", borderRadius: 10, padding: "6px 12px", border: "1px solid var(--color-border-subtle)" }}>
              <span style={{ fontSize: 12, color: "var(--color-text-muted)", fontWeight: 600 }}>VAI TRÒ:</span>
              <select
                style={{ border: "none", background: "transparent", fontWeight: 700, fontSize: 14, color: "var(--color-text-main)", cursor: "pointer", outline: "none" }}
                value={role}
                onChange={(e) => {
                  const next = e.target.value;
                  setRole(next);
                  if (next === "receptionist") navigate("/app/reception/appointments");
                  if (next === "doctor") navigate("/app/doctor/schedule");
                  if (next === "admin") navigate("/app/admin/catalog");
                }}
                title="Đổi vai trò để demo"
              >
                <option value="receptionist">👩‍💼 Lễ tân</option>
                <option value="doctor">👨‍⚕️ Bác sĩ</option>
                <option value="admin">🛡️ Quản trị</option>
              </select>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate("/")}
            >
              ← Về trang chủ
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

function getRoleName(role) {
  const map = {
    receptionist: "Lễ tân",
    doctor: "Bác sĩ",
    admin: "Quản trị viên",
  };
  return map[role] ?? role;
}

function getMenuByRole(role) {
  if (role === "doctor") {
    return [
      { to: "/app/doctor/schedule", label: "Lịch của tôi", icon: "📅" },
      { to: "/app/doctor/visit", label: "Khám bệnh", icon: "🩺" },
    ];
  }
  if (role === "admin") {
    return [
      { to: "/app/admin/catalog", label: "Chuyên khoa & Cơ sở", icon: "🏥" },
      { to: "/app/admin/reports", label: "Báo cáo & Thống kê", icon: "📊" },
      { to: "/app/admin/audit-logs", label: "Nhật ký thao tác", icon: "🧾" },
    ];
  }
  // receptionist default
  return [
    { to: "/app/reception/appointments", label: "Quản lý lịch hẹn", icon: "📋" },
    { to: "/app/reception/checkin", label: "Check-in PA4", icon: "✅" },
    { to: "/app/reception/patients", label: "Bệnh nhân", icon: "👥" },
  ];
}
