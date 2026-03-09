import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";

export default function Login() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("login");
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // mock: giả lập đăng nhập thành công
    navigate("/patient/appointments");
  };

  return (
    <div>
      <h1 style={{ fontSize: 26, fontWeight: 800, margin: "0 0 6px 0", color: "var(--color-text-main)" }}>
        Xin chào!
      </h1>
      <p style={{ fontSize: 14, color: "var(--color-text-muted)", margin: "0 0 24px 0" }}>
        Vui lòng nhập thông tin để đăng nhập vào hệ thống.
      </p>

      {/* Tabs */}
      <div className="auth-tabs">
        <button
          className={`auth-tab ${activeTab === "login" ? "active" : ""}`}
          onClick={() => setActiveTab("login")}
          type="button"
        >
          Đăng nhập
        </button>
        <button
          className={`auth-tab ${activeTab === "register" ? "active" : ""}`}
          onClick={() => setActiveTab("register")}
          type="button"
        >
          Đăng ký
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Input
          label="Email hoặc Số điện thoại"
          placeholder="VD: 0901 234 567"
          type="tel"
          required
        />
        {activeTab === "register" && (
          <Input
            label="Họ và tên"
            placeholder="Nguyễn Văn An"
            required
          />
        )}
        <div className="auth-pass-field">
          <Input
            label="Mật khẩu"
            placeholder="Nhập mật khẩu"
            type={showPass ? "text" : "password"}
            required
          />
          <button
            type="button"
            className="auth-pass-toggle"
            onClick={() => setShowPass(!showPass)}
          >
            {showPass ? "🙈" : "👁️"}
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

        <Button type="submit" style={{ width: "100%", padding: "12px 0", fontSize: 15 }}>
          {activeTab === "login" ? "Đăng nhập" : "Đăng ký →"}
        </Button>

        {activeTab === "login" && (
          <>
            <div className="auth-divider">
              <span>HOẶC</span>
            </div>
            <button type="button" className="auth-otp-btn">
              💬 Đăng nhập bằng mã OTP
            </button>
          </>
        )}
      </form>

      <p className="auth-switch">
        {activeTab === "login" ? (
          <>Bạn chưa có tài khoản?{" "}
            <button type="button" className="auth-forgot-link" onClick={() => setActiveTab("register")}>
              Đăng ký ngay
            </button>
          </>
        ) : (
          <>Đã có tài khoản?{" "}
            <button type="button" className="auth-forgot-link" onClick={() => setActiveTab("login")}>
              Đăng nhập
            </button>
          </>
        )}
      </p>
    </div>
  );
}