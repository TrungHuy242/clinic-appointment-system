import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, RefreshCw, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Button from "../../../components/Button/Button";
import { authApi } from "../../../services/authService";
import "./RegisterPage.css";

// ── OTP Modal ────────────────────────────────────────────────────────────────
function OtpModal({ phone, demoOtp, onVerified, onClose }) {
  const [digits, setDigits]     = useState(["", "", "", "", "", ""]);
  const [error, setError]       = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [currentOtp, setCurrentOtp] = useState(demoOtp);
  const [countdown, setCountdown]   = useState(60);
  const inputRefs = useRef([]);

  // Đếm ngược resend
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  function handleDigit(index, value) {
    const clean = value.replace(/\D/g, "").slice(-1);
    const next  = [...digits];
    next[index] = clean;
    setDigits(next);
    setError("");
    if (clean && index < 5) inputRefs.current[index + 1]?.focus();
  }

  function handleKeyDown(index, e) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setDigits(pasted.split(""));
      inputRefs.current[5]?.focus();
    }
    e.preventDefault();
  }

  async function handleVerify() {
    const otp = digits.join("");
    if (otp.length < 6) { setError("Vui lòng nhập đủ 6 số."); return; }
    setVerifying(true);
    setError("");
    try {
      await authApi.verifyOtp({ phone, otp });
      onVerified();
    } catch (err) {
      setError(err.message || "Mã OTP không đúng.");
      setDigits(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setVerifying(false);
    }
  }

  async function handleResend() {
    setResending(true);
    setError("");
    try {
      const res = await authApi.register({ _resend: true, phone });
      if (res.otp) { setCurrentOtp(res.otp); }
      setDigits(["", "", "", "", "", ""]);
      setCountdown(60);
      inputRefs.current[0]?.focus();
    } catch {
      setError("Không thể gửi lại mã. Thử lại sau.");
    } finally {
      setResending(false);
    }
  }

  const maskedPhone = phone.replace(/(\d{3})\d{4}(\d{3})/, "$1****$2");

  return (
    // Backdrop
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.45)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "16px",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: "#ffffff",
        borderRadius: "20px",
        padding: "32px 28px",
        width: "100%",
        maxWidth: "400px",
        boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
      }}>
        {/* Icon */}
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <div style={{
            width: "56px", height: "56px", borderRadius: "50%",
            background: "var(--color-background-success)",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
          }}>
            <ShieldCheck size={28} style={{ color: "var(--color-text-success)" }} />
          </div>
        </div>

        <h2 style={{ fontSize: "20px", fontWeight: 700, textAlign: "center", marginBottom: "8px", color: "#111827" }}>
          Xác minh số điện thoại
        </h2>
        <p style={{ fontSize: "13px", color: "#6b7280", textAlign: "center", marginBottom: "8px", lineHeight: 1.5 }}>
          Mã OTP đã được gửi đến <strong>{maskedPhone}</strong>
        </p>

        {/* Demo badge */}
        <div style={{
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: "10px",
          padding: "10px 14px",
          marginBottom: "24px",
          textAlign: "center",
        }}>
          <p style={{ fontSize: "11px", color: "#6b7280", marginBottom: "4px", fontWeight: 600 }}>
            Mã OTP của bạn
          </p>
          <p style={{ fontSize: "28px", fontWeight: 800, letterSpacing: "8px", color: "#0f766e", fontFamily: "monospace" }}>
            {currentOtp}
          </p>
        </div>

        {/* 6 digit inputs */}
        <div style={{ display: "flex", gap: "8px", justifyContent: "center", marginBottom: "20px" }}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => (inputRefs.current[i] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={(e) => handleDigit(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onPaste={handlePaste}
              style={{
                width: "44px", height: "52px",
                textAlign: "center", fontSize: "22px", fontWeight: 700,
                border: `2px solid ${error ? "#ef4444" : d ? "#3b82f6" : "#d1d5db"}`,
                borderRadius: "10px",
                background: "#f9fafb",
                color: "#111827",
                outline: "none",
                transition: "border-color .15s",
              }}
            />
          ))}
        </div>

        {error && (
          <p style={{ color: "#6b7280", fontSize: "13px", textAlign: "center", marginBottom: "12px" }}>
            {error}
          </p>
        )}

        {/* Verify button */}
        <Button
          type="button"
          className="auth-submit-btn"
          style={{ width: "100%", marginBottom: "16px" }}
          onClick={handleVerify}
          disabled={verifying || digits.join("").length < 6}
        >
          {verifying ? "Đang xác minh..." : "Xác nhận"}
          {!verifying && <ArrowRight size={16} />}
        </Button>

        {/* Resend */}
        <div style={{ textAlign: "center" }}>
          {countdown > 0 ? (
            <p style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>
              Gửi lại sau <strong>{countdown}s</strong>
            </p>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              style={{
                background: "none", border: "none", cursor: "pointer",
                fontSize: "13px", color: "var(--color-text-info)",
                fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "4px",
              }}
            >
              <RefreshCw size={13} className={resending ? "spinning" : ""} />
              {resending ? "Đang gửi lại..." : "Gửi lại mã OTP"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── RegisterPage ──────────────────────────────────────────────────────────────
function stripHtml(raw) {
  if (typeof raw !== "string") return "";
  return raw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() || "Đã xảy ra lỗi.";
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const [step, setStep]           = useState(1);
  const [form, setForm]           = useState({ name: "", phone: "", dob: "", gender: "", password: "", confirm: "" });
  const [errors, setErrors]       = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // OTP state
  const [showOtp, setShowOtp]   = useState(false);
  const [demoOtp, setDemoOtp]   = useState("");
  const [regPhone, setRegPhone] = useState("");

  const handleChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const validate = () => {
    const errs = {};
    if (!form.name.trim())            errs.name  = "Vui lòng nhập họ tên";
    if (!/^0\d{9}$/.test(form.phone)) errs.phone = "Số điện thoại 10 số, bắt đầu bằng 0";
    if (!form.dob)                    errs.dob   = "Vui lòng nhập ngày sinh";
    if (step === 2) {
      if (form.password.length < 6)             errs.password = "Mật khẩu tối thiểu 6 ký tự";
      if (form.password !== form.confirm)        errs.confirm  = "Mật khẩu không khớp";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    if (step === 1) { setStep(2); return; }

    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await authApi.register({
        name:            form.name,
        phone:           form.phone,
        dob:             form.dob,
        gender:          form.gender,
        password:        form.password,
        confirmPassword: form.confirm,
      });
      // Backend trả về otp (demo)
      setDemoOtp(res.otp || "");
      setRegPhone(form.phone);
      setShowOtp(true);
    } catch (error) {
      setSubmitError(stripHtml(error.message) || "Không thể đăng ký tài khoản.");
    } finally {
      setSubmitting(false);
    }
  };

  function handleOtpVerified() {
    setShowOtp(false);
    navigate("/login", { state: { registered: true } });
  }

  return (
    <>
      {showOtp && (
        <OtpModal
          phone={regPhone}
          demoOtp={demoOtp}
          onVerified={handleOtpVerified}
          onClose={() => setShowOtp(false)}
        />
      )}

      <div className="register-page">
        <div className="auth-page-badge register-page__badge">
          <ShieldCheck className="mc-icon mc-icon--sm" />
          Tạo tài khoản bệnh nhân
        </div>

        <h1 className="auth-page-title">Tạo tài khoản</h1>
        <p className="register-page-subtitle">
          {step === 1 ? "Bước 1/2 - Thông tin cá nhân" : "Bước 2/2 - Thiết lập đăng nhập"}
        </p>

        <div className="register-progress">
          {[1, 2].map((s) => (
            <div key={s} className={`register-progress__bar ${s <= step ? "active" : ""}`} />
          ))}
        </div>

        <form onSubmit={handleNext} className="register-form">
          {step === 1 && (
            <>
              <div className="auth-field-group">
                <label className="auth-field-label">Họ và tên *</label>
                <input
                  className={`auth-field-input ${errors.name ? "auth-field-input--err" : ""}`}
                  placeholder="Nguyễn Văn An"
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                />
                {errors.name && <span className="auth-field-error">{errors.name}</span>}
              </div>
              <div className="auth-field-group">
                <label className="auth-field-label">Số điện thoại *</label>
                <input
                  className={`auth-field-input ${errors.phone ? "auth-field-input--err" : ""}`}
                  placeholder="0901 234 567"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                />
                {errors.phone && <span className="auth-field-error">{errors.phone}</span>}
              </div>
              <div className="register-form__grid">
                <div className="auth-field-group">
                  <label className="auth-field-label">Ngày sinh *</label>
                  <input
                    className={`auth-field-input ${errors.dob ? "auth-field-input--err" : ""}`}
                    type="date"
                    value={form.dob}
                    onChange={(e) => handleChange("dob", e.target.value)}
                  />
                  {errors.dob && <span className="auth-field-error">{errors.dob}</span>}
                </div>
                <div className="auth-field-group">
                  <label className="auth-field-label">Giới tính</label>
                  <select className="auth-field-input" value={form.gender} onChange={(e) => handleChange("gender", e.target.value)}>
                    <option value="">-- Chọn --</option>
                    <option value="male">Nam</option>
                    <option value="female">Nữ</option>
                    <option value="other">Khác</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="auth-field-group">
                <label className="auth-field-label">Mật khẩu *</label>
                <input
                  className={`auth-field-input ${errors.password ? "auth-field-input--err" : ""}`}
                  type="password"
                  placeholder="Tối thiểu 6 ký tự"
                  value={form.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                />
                {errors.password && <span className="auth-field-error">{errors.password}</span>}
              </div>
              <div className="auth-field-group">
                <label className="auth-field-label">Xác nhận mật khẩu *</label>
                <input
                  className={`auth-field-input ${errors.confirm ? "auth-field-input--err" : ""}`}
                  type="password"
                  placeholder="Nhập lại mật khẩu"
                  value={form.confirm}
                  onChange={(e) => handleChange("confirm", e.target.value)}
                />
                {errors.confirm && <span className="auth-field-error">{errors.confirm}</span>}
              </div>
              <p className="register-note">
                Bằng cách đăng ký, bạn đồng ý với <strong>Điều khoản sử dụng</strong> và
                <strong> Chính sách bảo mật</strong> của MediCare Clinic.
              </p>
            </>
          )}

          {submitError && <div className="claim-submit-error">{submitError}</div>}

          <div className="register-actions">
            {step === 2 && (
              <Button type="button" variant="secondary" className="register-actions__back" onClick={() => setStep(1)}>
                <ArrowLeft className="mc-icon mc-icon--sm" />
                Quay lại
              </Button>
            )}
            <Button type="submit" className="register-actions__next" disabled={submitting}>
              {submitting ? "Đang xử lý..." : step === 1 ? "Tiếp theo" : "Hoàn tất đăng ký"}
              <ArrowRight className="mc-icon mc-icon--sm" />
            </Button>
          </div>
        </form>

        <p className="auth-switch register-switch">
          Đã có tài khoản?{" "}
          <button type="button" className="auth-forgot-link" onClick={() => navigate("/login")}>
            Đăng nhập ngay
          </button>
        </p>
      </div>
    </>
  );
}