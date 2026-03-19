import React, { useState } from "react";
import { ArrowRight, Eye, EyeOff, KeyRound, Smartphone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Input from "../../../components/Input/Input";
import Button from "../../../components/Button/Button";
import { authApi, ROLE_ROUTES, ROLES, useAuth } from "../../../services/authService";
import "./LoginPage.css";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loginType, setLoginType] = useState("login"); // "login" | "register"
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({ identifier: "", name: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleChange(field) {
    return (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      if (loginType === "register") {
        await authApi.register({
          name: form.name,
          phone: form.identifier,
          password: form.password,
        });
        setLoginType("login");
        setError("Đăng ký thành công! Vui lòng đăng nhập.");
        return;
      }

      // Unified login — backend trả về role để frontend tự phân luồng
      const response = await authApi.login({
        identifier: form.identifier,
        password: form.password,
      });

      if (response.success) {
        const role = response.role;

        if (role === ROLES.PATIENT) {
          login(response.account, ROLES.PATIENT);
        } else {
          // admin | receptionist | doctor
          login(response.user, role);
        }

        navigate(ROLE_ROUTES[role] || "/");
      }
    } catch (submitError) {
      setError(submitError.message || "Không thể xử lý yêu cầu.");
    } finally {
      setSubmitting(false);
    }
  }

  const isRegister = loginType === "register";

  return (
    <div className="login-page">
      <div className="auth-page-badge">
        <KeyRound className="mc-icon mc-icon--sm" />
        Truy cập an toàn
      </div>

      <h1 className="auth-page-title">Xin chào!</h1>
      <p className="auth-page-subtitle">
        Đăng nhập để quản lý lịch khám và hồ sơ sức khoẻ
      </p>

      <form onSubmit={handleSubmit} className="auth-page-form">
        <Input
          label={isRegister ? "Số điện thoại" : "Số điện thoại / Tên đăng nhập"}
          placeholder={
            isRegister ? "Nhập số điện thoại" : "Nhập số điện thoại hoặc tên đăng nhập"
          }
          type="text"
          value={form.identifier}
          onChange={handleChange("identifier")}
          required
        />

        {isRegister && (
          <Input
            label="Họ và tên"
            placeholder="Nguyễn Văn An"
            value={form.name}
            onChange={handleChange("name")}
            required
          />
        )}

        <div className="auth-pass-field">
          <Input
            label="Mật khẩu"
            placeholder="Nhập mật khẩu"
            type={showPass ? "text" : "password"}
            value={form.password}
            onChange={handleChange("password")}
            required
          />
          <button
            type="button"
            className="auth-pass-toggle"
            onClick={() => setShowPass((v) => !v)}
          >
            {showPass
              ? <EyeOff className="mc-icon mc-icon--md" />
              : <Eye className="mc-icon mc-icon--md" />}
          </button>
        </div>

        {!isRegister && (
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

        {error && (
          <div
            className={`claim-submit-error${
              error.includes("thành công") ? " claim-submit-success" : ""
            }`}
          >
            {error}
          </div>
        )}

        <Button type="submit" className="auth-submit-btn" disabled={submitting}>
          {submitting ? "Đang xử lý..." : isRegister ? "Tạo tài khoản" : "Đăng nhập"}
          <ArrowRight className="mc-icon mc-icon--sm" />
        </Button>

        {!isRegister && (
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

      <p className="auth-switch">
        {isRegister ? (
          <>
            Đã có tài khoản?{" "}
            <button
              type="button"
              className="auth-forgot-link"
              onClick={() => { setLoginType("login"); setError(""); }}
            >
              Đăng nhập
            </button>
          </>
        ) : (
          <>
            Chưa có tài khoản?{" "}
            <button
              type="button"
              className="auth-forgot-link"
              onClick={() => { setLoginType("register"); setError(""); }}
            >
              Đăng ký ngay
            </button>
          </>
        )}
      </p>
    </div>
  );
}