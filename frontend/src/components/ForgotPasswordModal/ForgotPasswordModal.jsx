import React, { useState, useEffect, useRef } from "react";
import { ArrowRight, CheckCircle, Eye, EyeOff, KeyRound, RotateCcw, Smartphone, X } from "lucide-react";
import Button from "../Button/Button";
import { authApi } from "../../services/authService";
import "./ForgotPasswordModal.css";

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
    onChange(digits.join(""));
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
    <div className="fp-otp-row">
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
          className="fp-otp-digit"
          aria-label={`OTP ký tự ${i + 1}`}
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

// step: 'phone' | 'otp' | 'reset' | 'success'
export default function ForgotPasswordModal({ open, onClose, onSuccess }) {
  const [step, setStep] = useState("phone");
  const [phone, setPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [otpCodeDev, setOtpCodeDev] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    if (!open) {
      setStep("phone");
      setPhone("");
      setOtpCode("");
      setNewPassword("");
      setConfirmPassword("");
      setCountdown(0);
      setOtpCodeDev("");
      setError("");
      setSending(false);
      setVerifying(false);
      setResetting(false);
    }
  }, [open]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((c) => Math.max(0, c - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  async function handleSendOtp() {
    const clean = phone.replace(/\D/g, "");
    if (clean.length < 10) {
      setError("Vui lòng nhập số điện thoại hợp lệ (10 chữ số).");
      return;
    }
    setSending(true);
    setError("");
    try {
      const resp = await authApi.forgotPasswordSendOtp(clean);
      setOtpCodeDev(resp.otp_code_dev || "");
      setCountdown(300);
      setStep("otp");
    } catch (err) {
      setError(stripHtml(err.message) || "Không thể gửi mã OTP. Vui lòng thử lại.");
    } finally {
      setSending(false);
    }
  }

  async function handleVerifyOtp() {
    if (otpCode.replace(/\D/g, "").length !== 6) {
      setError("Vui lòng nhập đủ 6 chữ số của mã OTP.");
      return;
    }
    setVerifying(true);
    setError("");
    try {
      await authApi.verifyOtp(phone.replace(/\D/g, ""), otpCode);
      setStep("reset");
    } catch (err) {
      const msg = stripHtml(err.message || "");
      setError(msg || "Mã OTP không đúng hoặc đã hết hạn. Vui lòng thử lại.");
    } finally {
      setVerifying(false);
    }
  }

  async function handleResetPassword() {
    const pwd = newPassword.trim();
    if (pwd.length < 6) {
      setError("Mật khẩu mới phải từ 6 ký tự trở lên.");
      return;
    }
    if (pwd !== confirmPassword.trim()) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }
    setResetting(true);
    setError("");
    try {
      await authApi.forgotPasswordReset(
        phone.replace(/\D/g, ""),
        otpCode,
        pwd,
        confirmPassword.trim()
      );
      setStep("success");
    } catch (err) {
      const msg = stripHtml(err.message || "");
      setError(msg || "Đặt lại mật khẩu thất bại. Vui lòng thử lại.");
    } finally {
      setResetting(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fp-backdrop">
      <div className="fp-overlay" onClick={onClose} />

      <div className="fp-modal">
        {/* Header */}
        <div className="fp-header">
          <div className="fp-header-icon">
            <KeyRound className="mc-icon mc-icon--md" />
          </div>
          <div className="fp-header-text">
            <h2 className="fp-title">Quên mật khẩu?</h2>
            <p className="fp-subtitle">
              {step === "phone" && "Nhập số điện thoại đã đăng ký để nhận mã OTP đặt lại mật khẩu."}
              {step === "otp" && "Nhập mã OTP đã gửi đến số điện thoại để xác minh."}
              {(step === "reset" || step === "success") && "Nhập mật khẩu mới để hoàn tất."}
            </p>
          </div>
          <button type="button" className="fp-close" onClick={onClose}>
            <X className="mc-icon mc-icon--sm" />
          </button>
        </div>

        {/* Step indicator */}
        {step !== "success" && (
          <div className="fp-steps">
            <div className={`fp-step-dot ${step === "phone" ? "active" : ""} ${step === "otp" || step === "reset" ? "done" : ""}`} />
            <div className={`fp-step-line ${step === "otp" || step === "reset" ? "done" : ""}`} />
            <div className={`fp-step-dot ${step === "otp" ? "active" : ""} ${step === "reset" ? "done" : ""}`} />
            <div className={`fp-step-line ${step === "reset" ? "done" : ""}`} />
            <div className={`fp-step-dot ${step === "reset" ? "active" : ""}`} />
          </div>
        )}

        {/* Body */}
        <div className="fp-body">

          {/* ── Step 1: Phone ── */}
          {step === "phone" && (
            <div className="fp-form">
              <div className="fp-field">
                <label className="fp-label">Số điện thoại</label>
                <input
                  className="fp-phone-input"
                  type="tel"
                  placeholder="Nhập số điện thoại (VD: 0912345678)"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value.replace(/\D/g, "").slice(0, 10));
                    setError("");
                  }}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSendOtp(); }}
                  autoFocus
                />
              </div>

              {error && <div className="fp-error">{error}</div>}

              <Button className="fp-submit-btn" onClick={handleSendOtp} disabled={sending}>
                {sending ? "Đang gửi..." : (
                  <>
                    <Smartphone className="mc-icon mc-icon--sm" />
                    Gửi mã OTP
                  </>
                )}
              </Button>
            </div>
          )}

          {/* ── Step 2: Verify OTP ── */}
          {step === "otp" && (
            <div className="fp-form">
              <p className="fp-otp-info">
                Mã OTP đã được gửi đến số <strong>{phone}</strong>.
              </p>

              {otpCodeDev && (
                <div className="fp-otp-dev">
                  <span className="fp-otp-dev-label">Mã OTP (DEV):</span>
                  <span className="fp-otp-dev-value">{otpCodeDev}</span>
                </div>
              )}

              <div className="fp-field">
                <label className="fp-label">Mã OTP</label>
                <div className="fp-otp-wrapper">
                  <OtpDigitInput value={otpCode} onChange={(v) => { setOtpCode(v); setError(""); }} />
                </div>
              </div>

              <div className="fp-countdown">
                {countdown > 0 ? (
                  <span>Mã hết hiệu lực sau <strong>{formatCountdown(countdown)}</strong></span>
                ) : (
                  <span className="fp-expired">Mã OTP đã hết hiệu lực.</span>
                )}
              </div>

              {error && <div className="fp-error">{error}</div>}

              <button
                type="button"
                className="fp-resend"
                onClick={() => { setOtpCode(""); setOtpCodeDev(""); setCountdown(0); handleSendOtp(); }}
                disabled={sending}
              >
                <RotateCcw className="mc-icon mc-icon--xs" />
                {sending ? "Đang gửi lại..." : "Gửi lại mã OTP"}
              </button>

              <Button className="fp-submit-btn" onClick={handleVerifyOtp} disabled={verifying}>
                {verifying ? "Đang xác minh..." : (
                  <>
                    <CheckCircle className="mc-icon mc-icon--sm" />
                    Xác minh OTP
                  </>
                )}
              </Button>
            </div>
          )}

          {/* ── Step 3: New Password ── */}
          {step === "reset" && (
            <div className="fp-form">
              <div className="fp-otp-verified">
                <CheckCircle className="mc-icon mc-icon--sm" />
                <span>Mã OTP đã được xác minh. Nhập mật khẩu mới.</span>
              </div>

              <div className="fp-field">
                <label className="fp-label">Mật khẩu mới</label>
                <div className="fp-pass-row">
                  <input
                    className="fp-pass-input"
                    type={showNewPass ? "text" : "password"}
                    placeholder="Tối thiểu 6 ký tự"
                    value={newPassword}
                    onChange={(e) => { setNewPassword(e.target.value); setError(""); }}
                    autoFocus
                  />
                  <button type="button" className="fp-pass-toggle" onClick={() => setShowNewPass((v) => !v)} aria-label={showNewPass ? "Ẩn mật khẩu" : "Hiện mật khẩu"}>
                    {showNewPass ? <EyeOff className="mc-icon mc-icon--sm" /> : <Eye className="mc-icon mc-icon--sm" />}
                  </button>
                </div>
              </div>

              <div className="fp-field">
                <label className="fp-label">Xác nhận mật khẩu mới</label>
                <div className="fp-pass-row">
                  <input
                    className="fp-pass-input"
                    type={showConfirmPass ? "text" : "password"}
                    placeholder="Nhập lại mật khẩu mới"
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
                  />
                  <button type="button" className="fp-pass-toggle" onClick={() => setShowConfirmPass((v) => !v)} aria-label={showConfirmPass ? "Ẩn mật khẩu" : "Hiện mật khẩu"}>
                    {showConfirmPass ? <EyeOff className="mc-icon mc-icon--sm" /> : <Eye className="mc-icon mc-icon--sm" />}
                  </button>
                </div>
              </div>

              {error && <div className="fp-error">{error}</div>}

              <Button className="fp-submit-btn" onClick={handleResetPassword} disabled={resetting}>
                {resetting ? "Đang đặt lại..." : (
                  <>
                    <KeyRound className="mc-icon mc-icon--sm" />
                    Đặt lại mật khẩu
                  </>
                )}
              </Button>
            </div>
          )}

          {/* ── Step 3: Success ── */}
          {step === "success" && (
            <div className="fp-success">
              <div className="fp-success-icon">
                <CheckCircle className="mc-icon mc-icon--lg" />
              </div>
              <h3 className="fp-success-title">Đặt lại mật khẩu thành công!</h3>
              <p className="fp-success-msg">
                Mật khẩu của bạn đã được thay đổi. Hãy đăng nhập với mật khẩu mới.
              </p>
              <Button
                className="fp-submit-btn"
                onClick={() => {
                  onSuccess();
                  onClose();
                }}
              >
                <ArrowRight className="mc-icon mc-icon--sm" />
                Đăng nhập ngay
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
