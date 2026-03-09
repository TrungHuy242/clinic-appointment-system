import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function ClaimProfile() {
    const navigate = useNavigate();
    const [step, setStep] = useState("search"); // search | verify | notfound
    const [phone, setPhone] = useState("");
    const [otp, setOtp] = useState("");
    const [phoneErr, setPhoneErr] = useState("");
    const [profile, setProfile] = useState(null);

    const handleSearch = (e) => {
        e.preventDefault();
        if (!/^0\d{9}$/.test(phone.trim())) {
            setPhoneErr("Số điện thoại không hợp lệ (10 số)");
            return;
        }
        setPhoneErr("");
        // Mock: tìm thấy hồ sơ
        setProfile({ name: "Nguyễn Văn An", phone: phone.trim(), dob: "01/01/1990" });
        setStep("verify");
    };

    const handleVerify = (e) => {
        e.preventDefault();
        if (otp === "123456") {
            alert("Xác nhận thành công! Tài khoản đã được liên kết với hồ sơ.");
            navigate("/patient/appointments");
        } else {
            alert("Mã OTP không đúng. Thử lại: 123456 (mock).");
        }
    };

    return (
        <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, margin: "0 0 6px 0" }}>Liên kết hồ sơ bệnh nhân</h1>
            <p style={{ fontSize: 14, color: "var(--color-text-muted)", margin: "0 0 24px 0" }}>
                Tìm hồ sơ bệnh nhân hiện có và liên kết với tài khoản của bạn.
            </p>

            {step === "search" && (
                <form onSubmit={handleSearch} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10, padding: "14px 16px", fontSize: 13, color: "#1e40af" }}>
                        📋 Nhập số điện thoại bạn đã đăng ký khám tại MediCare Clinic để tìm hồ sơ.
                    </div>
                    <div className="auth-field-group">
                        <label className="auth-field-label">Số điện thoại bệnh nhân *</label>
                        <input className={`auth-field-input ${phoneErr ? "auth-field-input--err" : ""}`}
                            placeholder="0901 234 567" type="tel"
                            value={phone}
                            onChange={e => setPhone(e.target.value)} />
                        {phoneErr && <span className="auth-field-error">{phoneErr}</span>}
                    </div>
                    <button type="submit"
                        style={{ padding: "12px 0", borderRadius: "var(--radius-lg)", border: "none", background: "var(--color-primary)", color: "#0d191b", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
                        🔍 Tìm hồ sơ
                    </button>
                </form>
            )}

            {step === "verify" && profile && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 12, padding: "16px 20px" }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#16a34a", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>Hồ sơ tìm thấy</div>
                        <div style={{ fontSize: 16, fontWeight: 800 }}>{profile.name}</div>
                        <div style={{ fontSize: 13, color: "var(--color-text-muted)", marginTop: 4 }}>{profile.phone} · {profile.dob}</div>
                    </div>

                    <form onSubmit={handleVerify} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                        <div style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
                            Mã OTP đã được gửi đến SĐT <strong>{profile.phone}</strong>. Vui lòng nhập để xác nhận.
                        </div>
                        <div className="auth-field-group">
                            <label className="auth-field-label">Mã OTP (6 chữ số)</label>
                            <input className="auth-field-input"
                                placeholder="_ _ _ _ _ _"
                                style={{ fontSize: 22, fontWeight: 800, letterSpacing: "0.4em", textAlign: "center" }}
                                maxLength={6}
                                value={otp}
                                onChange={e => setOtp(e.target.value.replace(/\D/g, ""))} />
                            <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 4 }}>Mock: nhập 123456</div>
                        </div>
                        <button type="submit"
                            style={{ padding: "12px 0", borderRadius: "var(--radius-lg)", border: "none", background: "var(--color-primary)", color: "#0d191b", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
                            ✅ Xác nhận liên kết
                        </button>
                        <button type="button" onClick={() => setStep("search")}
                            style={{ padding: "10px 0", borderRadius: "var(--radius-lg)", border: "1.5px solid var(--color-border-subtle)", background: "transparent", fontWeight: 600, cursor: "pointer", color: "var(--color-text-muted)" }}>
                            ← Tìm lại
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}
