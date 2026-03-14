import React, { useState } from "react";
import { ArrowLeft, ArrowRight, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Button from "../../../../shared/components/Button/Button";
import { appointmentApi } from "../../../patients/services/patientApi";
import "./RegisterPage.css";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: "", phone: "", dob: "", gender: "", password: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const handleChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const validate = () => {
    const nextErrors = {};
    if (!form.name.trim()) nextErrors.name = "Vui lòng nhập họ tên";
    if (!/^0\d{9}$/.test(form.phone)) nextErrors.phone = "Số điện thoại 10 số, bắt đầu bằng 0";
    if (!form.dob) nextErrors.dob = "Vui lòng nhập ngày sinh";
    if (step === 2) {
      if (form.password.length < 6) nextErrors.password = "Mật khẩu tối thiểu 6 ký tự";
      if (form.password !== form.confirm) nextErrors.confirm = "Mật khẩu không khớp";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleNext = async (event) => {
    event.preventDefault();
    if (!validate()) return;
    if (step === 1) {
      setStep(2);
      return;
    }

    setSubmitting(true);
    setSubmitError("");
    try {
      await appointmentApi.register({
        name: form.name,
        phone: form.phone,
        dob: form.dob,
        gender: form.gender,
        password: form.password,
        confirmPassword: form.confirm,
      });
      navigate("/patient/appointments");
    } catch (error) {
      setSubmitError(error.message || "Không thể đăng ký tài khoản.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
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
        {[1, 2].map((progressStep) => (
          <div key={progressStep} className={`register-progress__bar ${progressStep <= step ? "active" : ""}`} />
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
                onChange={(event) => handleChange("name", event.target.value)}
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
                onChange={(event) => handleChange("phone", event.target.value)}
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
                  onChange={(event) => handleChange("dob", event.target.value)}
                />
                {errors.dob && <span className="auth-field-error">{errors.dob}</span>}
              </div>
              <div className="auth-field-group">
                <label className="auth-field-label">Giới tính</label>
                <select className="auth-field-input" value={form.gender} onChange={(event) => handleChange("gender", event.target.value)}>
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
                onChange={(event) => handleChange("password", event.target.value)}
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
                onChange={(event) => handleChange("confirm", event.target.value)}
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
            {submitting ? "Đang xử lý" : step === 1 ? "Tiếp theo" : "Hoàn tất đăng ký"}
            <ArrowRight className="mc-icon mc-icon--sm" />
          </Button>
        </div>
      </form>

      <p className="auth-switch register-switch">
        Đã có tài khoản?{" "}
        <button type="button" className="auth-forgot-link" onClick={() => navigate("/patient/login") }>
          Đăng nhập ngay
        </button>
      </p>
    </div>
  );
}
