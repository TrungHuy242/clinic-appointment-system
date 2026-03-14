import React, { useState } from "react";
import { ArrowRight, Eye, EyeOff, KeyRound, Smartphone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Input from "../../../../shared/components/Input/Input";
import Button from "../../../../shared/components/Button/Button";
import { appointmentApi } from "../../../patients/services/patientApi";
import "./LoginPage.css";

export default function LoginPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("login");
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({ identifier: "", name: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      if (activeTab === "login") {
        await appointmentApi.login({ identifier: form.identifier, password: form.password });
      } else {
        await appointmentApi.register({
          name: form.name,
          phone: form.identifier,
          password: form.password,
        });
      }
      navigate("/patient/appointments");
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

      <h1 className="auth-page-title">Xin chào</h1>
      <p className="auth-page-subtitle">
        Vui lòng nhập thông tin để đăng nhập vào hệ thống bệnh nhân của MediCare Clinic.
      </p>

      <div className="auth-tabs">
        <button
          className={`auth-tab ${activeTab === "login" ? "active" : ""}`}
          onClick={() => {
            setActiveTab("login");
            setError("");
          }}
          type="button"
        >
          Đăng nhập
        </button>
        <button
          className={`auth-tab ${activeTab === "register" ? "active" : ""}`}
          onClick={() => {
            setActiveTab("register");
            setError("");
          }}
          type="button"
        >
          Đăng ký nhanh
        </button>
      </div>

      <form onSubmit={handleSubmit} className="auth-page-form">
        <Input
          label={activeTab === "login" ? "Email hoặc số điện thoại" : "Số điện thoại"}
          placeholder={activeTab === "login" ? "VD: 0901 234 567" : "VD: 0912345678"}
          type="tel"
          value={form.identifier}
          onChange={(event) => setForm((prev) => ({ ...prev, identifier: event.target.value }))}
          required
        />
        {activeTab === "register" && (
          <Input
            label="Họ và tên"
            placeholder="Nguyễn Văn An"
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
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
            title={showPass ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          >
            {showPass ? <EyeOff className="mc-icon mc-icon--md" /> : <Eye className="mc-icon mc-icon--md" />}
          </button>
        </div>

        {activeTab === "login" && (
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
          {submitting ? "Đang xử lý" : activeTab === "login" ? "Đăng nhập" : "Tiếp tục"}
          <ArrowRight className="mc-icon mc-icon--sm" />
        </Button>

        {activeTab === "login" && (
          <>
            <div className="auth-divider">
              <span>HOẶC</span>
            </div>
            <button type="button" className="auth-otp-btn">
              <Smartphone className="mc-icon mc-icon--sm" />
              Đăng nhập bằng mã OTP
            </button>
          </>
        )}
      </form>

      <p className="auth-switch">
        {activeTab === "login" ? (
          <>
            Bạn chưa có tài khoản?{" "}
            <button type="button" className="auth-forgot-link" onClick={() => setActiveTab("register")}>
              Đăng ký ngay
            </button>
          </>
        ) : (
          <>
            Đã có tài khoản?{" "}
            <button type="button" className="auth-forgot-link" onClick={() => setActiveTab("login")}>
              Đăng nhập
            </button>
          </>
        )}
      </p>
    </div>
  );
}
