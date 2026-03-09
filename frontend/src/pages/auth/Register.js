import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Register() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [form, setForm] = useState({ name: "", phone: "", dob: "", gender: "", password: "", confirm: "" });
    const [errors, setErrors] = useState({});

    const handleChange = (field, val) => setForm(f => ({ ...f, [field]: val }));

    const validate = () => {
        const e = {};
        if (!form.name.trim()) e.name = "Vui lòng nhập họ tên";
        if (!/^0\d{9}$/.test(form.phone)) e.phone = "Số điện thoại 10 số, bắt đầu bằng 0";
        if (!form.dob) e.dob = "Vui lòng nhập ngày sinh";
        if (step === 2) {
            if (form.password.length < 6) e.password = "Mật khẩu tối thiểu 6 ký tự";
            if (form.password !== form.confirm) e.confirm = "Mật khẩu không khớp";
        }
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleNext = (e) => {
        e.preventDefault();
        if (!validate()) return;
        if (step === 1) { setStep(2); return; }
        alert("Đăng ký thành công (mock). Vui lòng đăng nhập.");
        navigate("/patient/login");
    };

    return (
        <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, margin: "0 0 6px 0" }}>Tạo tài khoản</h1>
            <p style={{ fontSize: 14, color: "var(--color-text-muted)", margin: "0 0 20px 0" }}>
                {step === 1 ? "Bước 1/2 – Thông tin cá nhân" : "Bước 2/2 – Tạo mật khẩu"}
            </p>

            {/* Step progress */}
            <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
                {[1, 2].map(s => (
                    <div key={s} style={{
                        flex: 1, height: 4, borderRadius: 99,
                        background: s <= step ? "var(--color-primary)" : "var(--color-border-subtle)",
                        transition: "background 0.3s"
                    }} />
                ))}
            </div>

            <form onSubmit={handleNext} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {step === 1 && (<>
                    <div className="auth-field-group">
                        <label className="auth-field-label">Họ và tên *</label>
                        <input className={`auth-field-input ${errors.name ? "auth-field-input--err" : ""}`}
                            placeholder="Nguyễn Văn An"
                            value={form.name}
                            onChange={e => handleChange("name", e.target.value)} />
                        {errors.name && <span className="auth-field-error">{errors.name}</span>}
                    </div>
                    <div className="auth-field-group">
                        <label className="auth-field-label">Số điện thoại *</label>
                        <input className={`auth-field-input ${errors.phone ? "auth-field-input--err" : ""}`}
                            placeholder="0901 234 567" type="tel"
                            value={form.phone}
                            onChange={e => handleChange("phone", e.target.value)} />
                        {errors.phone && <span className="auth-field-error">{errors.phone}</span>}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <div className="auth-field-group">
                            <label className="auth-field-label">Ngày sinh *</label>
                            <input className={`auth-field-input ${errors.dob ? "auth-field-input--err" : ""}`}
                                type="date" value={form.dob}
                                onChange={e => handleChange("dob", e.target.value)} />
                            {errors.dob && <span className="auth-field-error">{errors.dob}</span>}
                        </div>
                        <div className="auth-field-group">
                            <label className="auth-field-label">Giới tính</label>
                            <select className="auth-field-input" value={form.gender}
                                onChange={e => handleChange("gender", e.target.value)}>
                                <option value="">-- Chọn --</option>
                                <option value="male">Nam</option>
                                <option value="female">Nữ</option>
                                <option value="other">Khác</option>
                            </select>
                        </div>
                    </div>
                </>)}

                {step === 2 && (<>
                    <div className="auth-field-group">
                        <label className="auth-field-label">Mật khẩu *</label>
                        <input className={`auth-field-input ${errors.password ? "auth-field-input--err" : ""}`}
                            type="password" placeholder="Tối thiểu 6 ký tự"
                            value={form.password}
                            onChange={e => handleChange("password", e.target.value)} />
                        {errors.password && <span className="auth-field-error">{errors.password}</span>}
                    </div>
                    <div className="auth-field-group">
                        <label className="auth-field-label">Xác nhận mật khẩu *</label>
                        <input className={`auth-field-input ${errors.confirm ? "auth-field-input--err" : ""}`}
                            type="password" placeholder="Nhập lại mật khẩu"
                            value={form.confirm}
                            onChange={e => handleChange("confirm", e.target.value)} />
                        {errors.confirm && <span className="auth-field-error">{errors.confirm}</span>}
                    </div>
                    <p style={{ fontSize: 12, color: "var(--color-text-muted)", background: "#f0f9ff", padding: "10px 14px", borderRadius: 8, border: "1px solid #bfdbfe" }}>
                        🔒 Bằng cách đăng ký, bạn đồng ý với <strong>Điều khoản sử dụng</strong> và <strong>Chính sách bảo mật</strong> của MediCare Clinic.
                    </p>
                </>)}

                <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                    {step === 2 && (
                        <button type="button" onClick={() => setStep(1)}
                            style={{ flex: 1, padding: "12px 0", borderRadius: "var(--radius-lg)", border: "1.5px solid var(--color-border-subtle)", background: "transparent", fontWeight: 600, cursor: "pointer" }}>
                            ← Quay lại
                        </button>
                    )}
                    <button type="submit"
                        style={{ flex: 2, padding: "12px 0", borderRadius: "var(--radius-lg)", border: "none", background: "var(--color-primary)", color: "#0d191b", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
                        {step === 1 ? "Tiếp theo →" : "Hoàn tất đăng ký"}
                    </button>
                </div>
            </form>

            <p className="auth-switch" style={{ marginTop: 20 }}>
                Đã có tài khoản?{" "}
                <button type="button" className="auth-forgot-link" onClick={() => navigate("/patient/login")}>
                    Đăng nhập ngay
                </button>
            </p>
        </div>
    );
}
