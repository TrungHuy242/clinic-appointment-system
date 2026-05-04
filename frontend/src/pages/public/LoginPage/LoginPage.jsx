import React, { useState, useEffect, useRef } from "react";
import { ArrowRight, Eye, EyeOff, KeyRound, Smartphone, RotateCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Input from "../../../components/Input/Input";
import Button from "../../../components/Button/Button";
import ForgotPasswordModal from "../../../components/ForgotPasswordModal/ForgotPasswordModal";
import { authApi, ROLE_ROUTES, ROLES, useAuth } from "../../../services/authService";
import "./LoginPage.css";

function stripHtml(raw) {
  if (typeof raw !== "string") return "";
  return raw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() || "Đã xảy ra lỗi.";
}

function OtpDigitInput({ value, onChange }) {
  const inputRefs = useRef([]);

  function handleChange(index, char) {
    if (!/^\d?$/.test(char)) return;
    const digits = value.replace(/\D/g, "").padEnd(6, " ").split("").slice(0, 6);
    digits[index] = char;
    const newValue = digits.join("");
    onChange(newValue);
    if (char && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index, e) {
    if (e.key === "Backspace" && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handlePaste(e) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    onChange(pasted);
    if (pasted.length > 0) {
      inputRefs.current[Math.min(pasted.length, 5)]?.focus();
    }
  }

  const digits = value.replace(/\D/g, "").padEnd(6, " ").split("").slice(0, 6);

  return (
    <div className="otp-input-row">
      {digits.map((char, i) => (
        <input
          key={i}
          ref={(el) => (inputRefs.current[i] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={char === " " ? "" : char}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={i === 0 ? handlePaste : undefined}
          className="otp-digit-input"
          aria-label={`OTP digit ${i + 1}`}
        />
      ))}
    </div>
  );
}

function formatCountdown(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  // ── Forgot password modal ──────────────────────────────────────
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // ── Password login state ──────────────────────────────────────────────
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({ identifier: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // ── OTP state ───────────────────────────────────────────────────────
  const [otpMode, setOtpMode] = useState(false); // true = OTP flow active
  const [otpPhone, setOtpPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [otpCodeDev, setOtpCodeDev] = useState(""); // DEV: hiển thị mã OTP

  // ── Password login handlers ─────────────────────────────────────────
  function handleChange(field) {
    return (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const response = await authApi.login({
        identifier: form.identifier,
        password: form.password,
      });

      if (response.success) {
        const role = response.role;

        if (role === ROLES.PATIENT) {
          login(response.account, ROLES.PATIENT);
        } else {
          login(response.user, role);
        }

        navigate(ROLE_ROUTES[role] || "/");
      }
    } catch (submitError) {
      setError(stripHtml(submitError.message) || "Không thể xử lý yêu cầu.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── OTP countdown timer ─────────────────────────────────────────────
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((c) => Math.max(0, c - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // ── OTP handlers ────────────────────────────────────────────────────
  function handleOtpPhoneChange(e) {
    const val = e.target.value.replace(/\D/g, "").slice(0, 10);
    setOtpPhone(val);
    setOtpError("");
  }

  async function handleSendOtp() {
    if (otpPhone.length < 10) {
      setOtpError("Vui lòng nhập số điện thoại hợp lệ (10 chữ số).");
      return;
    }
    setOtpSending(true);
    setOtpError("");
    try {
      const resp = await authApi.sendOtp(otpPhone);
      setOtpSent(true);
      setOtpCodeDev(resp.otp_code_dev || "");
      setCountdown(300); // 5 phút
    } catch (err) {
      setOtpError(stripHtml(err.message) || "Không thể gửi mã OTP. Vui lòng thử lại.");
    } finally {
      setOtpSending(false);
    }
  }

  async function handleVerifyOtp(event) {
    event.preventDefault();
    if (otpCode.replace(/\D/g, "").length !== 6) {
      setOtpError("Vui lòng nhập đủ 6 chữ số của mã OTP.");
      return;
    }
    setOtpVerifying(true);
    setOtpError("");
    try {
      const response = await authApi.verifyOtp(otpPhone, otpCode);
      if (response.success) {
        login(response.account, ROLES.PATIENT);
        navigate(ROLE_ROUTES[ROLES.PATIENT] || "/");
      }
    } catch (err) {
      setOtpError(stripHtml(err.message) || "Mã OTP không hợp lệ. Vui lòng thử lại.");
    } finally {
      setOtpVerifying(false);
    }
  }

  function handleBackToPassword() {
    setOtpMode(false);
    setOtpPhone("");
    setOtpCode("");
    setOtpError("");
    setOtpSent(false);
    setCountdown(0);
    setOtpCodeDev("");
  }

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

      {/* ── Password form (default) ── */}
      {!otpMode && (
        <form onSubmit={handleSubmit} className="auth-page-form">
          <Input
            label="Số điện thoại / Tên đăng nhập"
            placeholder="Nhập số điện thoại hoặc tên đăng nhập"
            type="text"
            value={form.identifier}
            onChange={handleChange("identifier")}
            required
          />

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

          <div className="auth-row-between">
            <label className="auth-remember">
              <input type="checkbox" />
              <span>Ghi nhớ đăng nhập</span>
            </label>
            <button type="button" className="auth-forgot-link" onClick={() => setShowForgotPassword(true)}>
              Quên mật khẩu?
            </button>
          </div>

          {error && <div className="claim-submit-error">{error}</div>}

          <Button type="submit" className="auth-submit-btn" disabled={submitting}>
            {submitting ? "Đang xử lý..." : "Đăng nhập"}
            {!submitting && <ArrowRight className="mc-icon mc-icon--sm" />}
          </Button>

          <div className="auth-divider">
            <span>HOẶC</span>
          </div>

          <button
            type="button"
            className="auth-otp-btn"
            onClick={() => {
              setOtpMode(true);
              setOtpPhone("");
              setOtpCode("");
              setOtpError("");
              setOtpSent(false);
            }}
          >
            <Smartphone className="mc-icon mc-icon--sm" />
            Tiếp tục với OTP
          </button>
        </form>
      )}

      {/* ── OTP form (when OTP button clicked) ── */}
      {otpMode && (
        <form
          onSubmit={otpSent ? handleVerifyOtp : (e) => { e.preventDefault(); handleSendOtp(); }}
          className="auth-page-form"
        >
          {!otpSent ? (
            <>
              <p className="otp-intro">
                Nhập số điện thoại đã đăng ký để nhận mã OTP đăng nhập qua tin nhắn SMS.
              </p>
              <Input
                label="Số điện thoại"
                placeholder="Nhập số điện thoại (VD: 0912345678)"
                type="tel"
                value={otpPhone}
                onChange={handleOtpPhoneChange}
                required
              />
              {otpError && <div className="claim-submit-error">{otpError}</div>}
              <Button
                type="button"
                className="auth-submit-btn"
                onClick={handleSendOtp}
                disabled={otpSending}
              >
                {otpSending ? "Đang gửi..." : "Gửi mã OTP"}
                {!otpSending && <Smartphone className="mc-icon mc-icon--sm" />}
              </Button>
            </>
          ) : (
            <>
              <p className="otp-intro">
                Mã OTP đã được gửi đến số <strong>{otpPhone}</strong>.
                Vui lòng nhập mã 6 chữ số bên dưới.
              </p>

              {/* DEV: hiển thị mã OTP để test */}
              {otpCodeDev && (
                <div className="otp-code-dev">
                  <span className="otp-code-dev-label">Mã OTP (DEV):</span>
                  <span className="otp-code-dev-value">{otpCodeDev}</span>
                </div>
              )}

              <div className="otp-digit-wrapper">
                <OtpDigitInput value={otpCode} onChange={setOtpCode} />
              </div>

              <div className="otp-countdown-row">
                {countdown > 0 ? (
                  <span className="otp-countdown">
                    Mã hết hiệu lực sau <strong>{formatCountdown(countdown)}</strong>
                  </span>
                ) : (
                  <span className="otp-expired">Mã OTP đã hết hiệu lực.</span>
                )}
              </div>

              {otpError && <div className="claim-submit-error">{otpError}</div>}

              <Button
                type="submit"
                className="auth-submit-btn"
                disabled={otpVerifying || otpCode.replace(/\D/g, "").length !== 6}
              >
                {otpVerifying ? "Đang xác minh..." : "Xác minh OTP"}
                {!otpVerifying && <ArrowRight className="mc-icon mc-icon--sm" />}
              </Button>

              <div className="otp-resend-row">
                <button
                  type="button"
                  className="auth-otp-resend"
                  onClick={() => {
                    setOtpCode("");
                    setOtpSent(false);
                    setOtpCodeDev("");
                    setCountdown(0);
                    handleSendOtp();
                  }}
                  disabled={otpSending}
                >
                  <RotateCcw className="mc-icon mc-icon--xs" />
                  {otpSending ? "Đang gửi lại..." : "Gửi lại mã OTP"}
                </button>
              </div>
            </>
          )}

          <button
            type="button"
            className="auth-back-link"
            onClick={handleBackToPassword}
          >
            ← Quay lại đăng nhập bằng mật khẩu
          </button>
        </form>
      )}

      {!otpMode && (
        <p className="auth-switch">
          Chưa có tài khoản?{" "}
          <button
            type="button"
            className="auth-forgot-link"
            onClick={() => navigate("/register")}
          >
            Đăng ký ngay
          </button>
        </p>
      )}

      <ForgotPasswordModal
        open={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
        onSuccess={() => {
          setShowForgotPassword(false);
          setOtpMode(true);
        }}
      />
    </div>
  );
}
