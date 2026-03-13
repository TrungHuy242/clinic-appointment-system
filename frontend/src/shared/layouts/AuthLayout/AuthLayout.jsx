import React from "react";
import { Outlet, Link } from "react-router-dom";
import { CalendarCheck2, HeartPulse, ShieldCheck, Sparkles, Star } from "lucide-react";
import "./AuthLayout.css";

const HIGHLIGHTS = [
  { icon: CalendarCheck2, text: "Đặt lịch nhanh và theo dõi trạng thái theo thời gian thực" },
  { icon: ShieldCheck, text: "Hồ sơ bệnh nhân được quản lý tập trung và bảo mật" },
  { icon: HeartPulse, text: "Kết nối thuận tiện với bác sĩ và lịch sử khám" },
];

export default function AuthLayout() {
  return (
    <div className="layout-auth-new">
      <div className="auth-left-panel">
        <div className="auth-left-glow auth-left-glow--top" />
        <div className="auth-left-glow auth-left-glow--bottom" />

        <div className="auth-left-inner">
          <Link to="/" className="auth-left-brand">
            <div className="auth-left-logo" aria-hidden="true">
              <Sparkles className="mc-icon mc-icon--lg" />
            </div>
            <span>MediCare Clinic</span>
          </Link>

          <div className="auth-left-badge">Patient Experience Platform</div>
          <h2 className="auth-left-headline">
            Chăm sóc sức khỏe
            <br />
            <span className="auth-left-accent">toàn diện, tinh gọn và đáng tin cậy</span>
          </h2>
          <p className="auth-left-sub">
            Một không gian số để bệnh nhân đặt lịch, liên kết hồ sơ và theo dõi toàn bộ hành trình
            chăm sóc tại MediCare Clinic.
          </p>

          <div className="auth-highlight-list">
            {HIGHLIGHTS.map((item) => (
              <div key={item.text} className="auth-highlight-item">
                <div className="auth-highlight-icon">
                  <item.icon className="mc-icon mc-icon--md" />
                </div>
                <span>{item.text}</span>
              </div>
            ))}
          </div>

          <div className="auth-left-social-proof">
            <div className="auth-social-avatars" aria-hidden="true">
              <span className="auth-social-avatar">AN</span>
              <span className="auth-social-avatar">BT</span>
              <span className="auth-social-avatar">LH</span>
              <span className="auth-social-more">+20k</span>
            </div>
            <div>
              <div className="auth-social-stars">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star key={index} className="mc-icon mc-icon--sm" fill="currentColor" />
                ))}
              </div>
              <div className="auth-social-text">Được tin dùng bởi hơn 20.000 bệnh nhân tại Đà Nẵng</div>
            </div>
          </div>
        </div>
      </div>

      <div className="auth-right-panel">
        <div className="auth-right-inner">
          <div className="auth-card-new">
            <Outlet />
          </div>
          <div className="auth-footer-new">
            <small>© {new Date().getFullYear()} MediCare Clinic - Cơ sở Hải Châu</small>
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