import React, { useState } from "react";
import { ArrowRight, Eye, EyeOff, KeyRound, Smartphone, UserCog } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Input from "../../../components/Input/Input";
import Button from "../../../components/Button/Button";
import { authApi, ROLE_ROUTES, ROLES, useAuth } from "../../../services/authService";
import "./LoginPage.css";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [activeTab, setActiveTab] = useState("patient");
  const [loginType, setLoginType] = useState("login");
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({ identifier: "", username: "", name: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      if (loginType === "staff") {
        const response = await authApi.staffLogin({ username: form.username, password: form.password });
        if (response.success) {
          const userRole = response.user.role;
          login(response.user, userRole);
          const redirectPath = ROLE_ROUTES[userRole] || '/';
          navigate(redirectPath);
        }
      } else if (loginType === "login") {
        const response = await authApi.login({ identifier: form.identifier, password: form.password });
        if (response.success) {
          login(response.account, ROLES.PATIENT);
          navigate(ROLE_ROUTES[ROLES.PATIENT]);
        }
      } else {
        await authApi.register({
          name: form.name,
          phone: form.identifier,
          password: form.password,
        });
        setLoginType("login");
        setError("Đăng ký thành công! Vui lòng đăng nhập.");
      }
    } catch (submitError) {
      setError(submitError.message || "Không thể xử lý yêu cầu.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-page">
      <div className="auth-page-badge">
        <KeyRound className="mc-icon mc-icon--sm" />
        Truy cập an toàn
      </div>

      <h1 className="auth-page-title">Xin chào!</h1>
      <p className="auth-page-subtitle">
        Đăng nhập để quản lý lịch khám và hồ sơ sức khỏe
      </p>

      <div className="auth-tabs">
        <button
          className={`auth-tab ${activeTab === "patient" ? "active" : ""}`}
          onClick={() => { setActiveTab("patient"); setLoginType("login"); setError(""); }}
          type="button"
        >
          <Smartphone className="mc-icon mc-icon--sm" />
          Bệnh nhân
        </button>
        <button
          className={`auth-tab ${activeTab === "staff" ? "active" : ""}`}
          onClick={() => { setActiveTab("staff"); setLoginType("staff"); setError(""); }}
          type="button"
        >
          <UserCog className="mc-icon mc-icon--sm" />
          Nhân viên
        </button>
      </div>

      {activeTab === "staff" && (
        <div className="staff-login-info">
          <p>Dành cho: Quản trị viên, Lễ tân, Bác sĩ</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="auth-page-form">
        {activeTab === "patient" ? (
          <>
            <Input
              label={loginType === "login" ? "Số điện thoại" : "Số điện thoại"}
              placeholder="Nhập số điện thoại"
              type="tel"
              value={form.identifier}
              onChange={(event) => setForm((prev) => ({ ...prev, identifier: event.target.value }))}
              required
            />
            {loginType === "register" && (
              <Input
                label="Họ và tên"
                placeholder="Nguyễn Văn An"
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                required
              />
            )}
          </>
        ) : (
          <Input
            label="Tên đăng nhập"
            placeholder="admin, receptionist, doctor"
            value={form.username}
            onChange={(event) => setForm((prev) => ({ ...prev, username: event.target.value }))}
            required
          />
        )}

        <div className="auth-pass-field">
          <Input
            label="Mật khẩu"
            placeholder="Nhập mật khẩu"
            type={showPass ? "text" : "password"}
            value={form.password}
            onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
            required
          />
          <button
            type="button"
            className="auth-pass-toggle"
            onClick={() => setShowPass(!showPass)}
          >
            {showPass ? <EyeOff className="mc-icon mc-icon--md" /> : <Eye className="mc-icon mc-icon--md" />}
          </button>
        </div>

        {activeTab === "patient" && loginType === "login" && (
          <div className="auth-row-between">
            <label className="auth-remember">
              <input type="checkbox" />
              <span>Ghi nhớ đăng nhập</span>
            </label>
            <button type="button" className="auth-forgot-link">
              Quên mật khẩu?
            </button>
          </div>
        )}

        {error && <div className="claim-submit-error">{error}</div>}

        <Button type="submit" className="auth-submit-btn" disabled={submitting}>
          {submitting ? "Đang xử lý..." : activeTab === "staff" ? "Đăng nhập" : loginType === "login" ? "Đăng nhập" : "Tạo tài khoản"}
          <ArrowRight className="mc-icon mc-icon--sm" />
        </Button>

        {activeTab === "patient" && loginType === "login" && (
          <>
            <div className="auth-divider">
              <span>HOẶC</span>
            </div>
            <button type="button" className="auth-otp-btn">
              <Smartphone className="mc-icon mc-icon--sm" />
              Tiếp tục với OTP
            </button>
          </>
        )}
      </form>

      {activeTab === "patient" && (
        <p className="auth-switch">
          {loginType === "login" ? (
            <>
              Chưa có tài khoản?{" "}
              <button type="button" className="auth-forgot-link" onClick={() => setLoginType("register")}>
                Đăng ký ngay
              </button>
            </>
          ) : (
            <>
              Đã có tài khoản?{" "}
              <button type="button" className="auth-forgot-link" onClick={() => setLoginType("login")}>
                Đăng nhập
              </button>
            </>
          )}
        </p>
      )}
    </div>
  );
}


