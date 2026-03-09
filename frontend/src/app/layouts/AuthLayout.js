import React from "react";
import { Outlet, Link } from "react-router-dom";
import "../../styles/layout.css";
import "../../styles/pages/auth.css";

export default function AuthLayout() {
  return (
    <div className="layout-auth-new">
      {/* Left panel: brand/visual */}
      <div className="auth-left-panel">
        <div className="auth-left-inner">
          <Link to="/" className="auth-left-brand">
            <div className="auth-left-logo">+</div>
            <span>MediCare Clinic</span>
          </Link>
          <h2 className="auth-left-headline">
            Chăm sóc sức khỏe
            <br />
            <span className="auth-left-accent">Toàn diện & Tận tâm</span>
          </h2>
          <p className="auth-left-sub">
            Kết nối với các chuyên gia y tế hàng đầu và quản lý
            hồ sơ sức khỏe của bạn một cách dễ dàng và bảo mật.
          </p>
          <div className="auth-left-social-proof">
            <div className="auth-social-avatars">
              <span>👩‍⚕️</span>
              <span>👨‍⚕️</span>
              <span>👩</span>
              <span className="auth-social-more">+2k</span>
            </div>
            <div>
              <div className="auth-social-stars">⭐⭐⭐⭐⭐</div>
              <div className="auth-social-text">Được tin dùng bởi hơn 20.000 bệnh nhân</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel: form */}
      <div className="auth-right-panel">
        <div className="auth-right-inner">
          <div className="auth-card-new">
            <Outlet />
          </div>
          <div className="auth-footer-new">
            <small>© {new Date().getFullYear()} MediCare Clinic – Cơ sở Hải Châu</small>
            <div className="auth-footer-links">
              <a href="#!">Điều khoản sử dụng</a>
              <a href="#!">Chính sách bảo mật</a>
              <a href="#!">Trợ giúp</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
