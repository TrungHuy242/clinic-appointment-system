import React, { useEffect, useState } from "react";
import { KeyRound, Stethoscope, UserRound } from "lucide-react";
import { doctorApi } from "../../../services/doctorApi";
import "./ProfilePage.css";

function stripHtml(raw) {
  if (typeof raw !== "string") return "";
  return raw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() || "Đã xảy ra lỗi.";
}

export default function DoctorProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  // ── Tab navigation ─────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState("profile"); // "profile" | "password" | "schedule"

  // ── Profile editing ────────────────────────────────────────────────────────
  const [editing, setEditing] = useState(false);
  const [profileForm, setProfileForm] = useState({});
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ type: "", text: "" });

  // ── Password ─────────────────────────────────────────────────────────────
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState({ type: "", text: "" });

  // ── Load ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    setLoading(true);
    setLoadError("");
    try {
      const data = await doctorApi.getProfile();
      setProfile(data);
      setProfileForm(data);
    } catch (err) {
      setLoadError(stripHtml(err.message) || "Không tải được thông tin.");
    } finally {
      setLoading(false);
    }
  }

  // ── Profile handlers ───────────────────────────────────────────────────────
  function handleField(field, value) {
    setProfileForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleProfileSave() {
    setProfileSaving(true);
    setProfileMsg({ type: "", text: "" });
    try {
      const data = await doctorApi.updateProfile({
        fullName: profileForm.fullName,
        bio: profileForm.bio,
        phone: profileForm.phone,
        email: profileForm.email,
      });
      setProfile(data);
      setProfileForm(data);
      setEditing(false);
      setProfileMsg({ type: "success", text: "Cập nhật thông tin thành công." });
      setTimeout(() => setProfileMsg({ type: "", text: "" }), 3000);
    } catch (err) {
      setProfileMsg({ type: "error", text: stripHtml(err.message) || "Cập nhật thất bại." });
    } finally {
      setProfileSaving(false);
    }
  }

  function handleProfileCancel() {
    setEditing(false);
    setProfileForm(profile || {});
    setProfileMsg({ type: "", text: "" });
  }

  // ── Password handlers ─────────────────────────────────────────────────────
  function handlePwField(field, value) {
    setPasswordForm((prev) => ({ ...prev, [field]: value }));
    setPasswordErrors((prev) => ({ ...prev, [field]: "" }));
  }

  function validatePassword() {
    const errs = {};
    if (!passwordForm.currentPassword.trim()) errs.currentPassword = "Vui lòng nhập mật khẩu hiện tại.";
    if (passwordForm.newPassword.length < 6) errs.newPassword = "Mật khẩu mới phải từ 6 ký tự.";
    if (passwordForm.newPassword !== passwordForm.confirmPassword) errs.confirmPassword = "Mật khẩu xác nhận không khớp.";
    setPasswordErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handlePasswordChange() {
    if (!validatePassword()) return;
    setPasswordSaving(true);
    setPasswordMsg({ type: "", text: "" });
    try {
      await doctorApi.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword,
      });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setPasswordErrors({});
      setPasswordMsg({ type: "success", text: "Đổi mật khẩu thành công." });
      setTimeout(() => setPasswordMsg({ type: "", text: "" }), 3000);
    } catch (err) {
      const errData = err.data;
      if (errData && typeof errData === "object") {
        const mapped = {};
        Object.entries(errData).forEach(([k, v]) => {
          mapped[k] = Array.isArray(v) ? v[0] : v;
        });
        setPasswordErrors(mapped);
      } else {
        setPasswordMsg({ type: "error", text: stripHtml(err.message) || "Không thể đổi mật khẩu." });
      }
    } finally {
      setPasswordSaving(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="doc-profile-page">
        <div className="doc-profile-loading">Đang tải thông tin...</div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="doc-profile-page">
        <div className="doc-profile-error">{loadError}</div>
      </div>
    );
  }

  return (
    <div className="doc-profile-page">
      <div className="dash-page-header">
        <div>
          <h1 className="dash-page-title">Hồ sơ bác sĩ</h1>
          <p className="dash-page-sub">Xem và cập nhật thông tin cá nhân</p>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="doc-profile-tabs">
        <button
          className={`dash-filter-tab ${activeTab === "profile" ? "active" : ""}`}
          onClick={() => { setActiveTab("profile"); setProfileMsg({ type: "", text: "" }); }}
          type="button"
        >
          <UserRound className="mc-icon mc-icon--sm" /> Thông tin cá nhân
        </button>
        <button
          className={`dash-filter-tab ${activeTab === "password" ? "active" : ""}`}
          onClick={() => { setActiveTab("password"); setPasswordMsg({ type: "", text: "" }); }}
          type="button"
        >
          <KeyRound className="mc-icon mc-icon--sm" /> Đổi mật khẩu
        </button>
      </div>

      {/* ── Tab: Profile ── */}
      {activeTab === "profile" && (
        <div className="doc-profile-card">
          <div className="doc-profile-avatar-row">
            <div className="doc-profile-avatar">
              <Stethoscope className="mc-icon mc-icon--xl" />
            </div>
            <div className="doc-profile-avatar-info">
              <div className="doc-profile-name">
                {profile?.fullName || "—"}
                {!editing && (
                  <button
                    type="button"
                    className="doc-profile-edit-btn"
                    onClick={() => { setProfileMsg({ type: "", text: "" }); setEditing(true); }}
                  >
                    Chỉnh sửa
                  </button>
                )}
              </div>
              <div className="doc-profile-specialty">
                <Stethoscope className="mc-icon mc-icon--xs" />
                {profile?.specialty || "—"}
              </div>
            </div>
          </div>

          {profileMsg.text && (
            <div className={`doc-profile-msg doc-profile-msg--${profileMsg.type}`}>
              {profileMsg.text}
            </div>
          )}

          <div className="doc-profile-fields">
            <div className="doc-profile-field">
              <label className="doc-profile-field__label">Tên đăng nhập</label>
              <input className="doc-profile-field__input" value={profile?.username || ""} disabled />
            </div>
            <div className="doc-profile-field">
              <label className="doc-profile-field__label">Họ tên</label>
              <input
                className="doc-profile-field__input"
                value={profileForm.fullName || ""}
                disabled={!editing}
                onChange={(e) => handleField("fullName", e.target.value)}
              />
            </div>
            <div className="doc-profile-field">
              <label className="doc-profile-field__label">Chuyên khoa</label>
              <input className="doc-profile-field__input" value={profile?.specialty || ""} disabled />
            </div>
            <div className="doc-profile-field">
              <label className="doc-profile-field__label">Số điện thoại</label>
              <input
                className="doc-profile-field__input"
                type="tel"
                placeholder="Nhập số điện thoại"
                value={profileForm.phone || ""}
                disabled={!editing}
                onChange={(e) => handleField("phone", e.target.value)}
              />
            </div>
            <div className="doc-profile-field doc-profile-field--full">
              <label className="doc-profile-field__label">Email</label>
              <input
                className="doc-profile-field__input"
                type="email"
                placeholder="Nhập email"
                value={profileForm.email || ""}
                disabled={!editing}
                onChange={(e) => handleField("email", e.target.value)}
              />
            </div>
            <div className="doc-profile-field doc-profile-field--full">
              <label className="doc-profile-field__label">Giới thiệu bản thân</label>
              <textarea
                className="doc-profile-field__input doc-profile-field__textarea"
                placeholder="Mô tả kinh nghiệm, chuyên môn..."
                value={profileForm.bio || ""}
                disabled={!editing}
                rows={4}
                onChange={(e) => handleField("bio", e.target.value)}
              />
            </div>
          </div>

          {editing && (
            <div className="doc-profile-actions">
              <button
                type="button"
                className="dash-btn-primary"
                onClick={handleProfileSave}
                disabled={profileSaving}
              >
                {profileSaving ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
              <button
                type="button"
                className="dash-btn-secondary"
                onClick={handleProfileCancel}
                disabled={profileSaving}
              >
                Hủy
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Password ── */}
      {activeTab === "password" && (
        <div className="doc-profile-card">
          <h2 className="doc-profile-card-title">Đổi mật khẩu</h2>

          {passwordMsg.text && (
            <div className={`doc-profile-msg doc-profile-msg--${passwordMsg.type}`}>
              {passwordMsg.text}
            </div>
          )}

          <div className="doc-profile-fields">
            <div className="doc-profile-field">
              <label className="doc-profile-field__label">Mật khẩu hiện tại</label>
              <input
                type="password"
                className={`doc-profile-field__input ${passwordErrors.currentPassword ? "doc-profile-field__input--error" : ""}`}
                placeholder="Nhập mật khẩu hiện tại"
                value={passwordForm.currentPassword}
                onChange={(e) => handlePwField("currentPassword", e.target.value)}
                autoComplete="current-password"
              />
              {passwordErrors.currentPassword && (
                <span className="doc-profile-field__error">{passwordErrors.currentPassword}</span>
              )}
            </div>
            <div className="doc-profile-field">
              <label className="doc-profile-field__label">Mật khẩu mới</label>
              <input
                type="password"
                className={`doc-profile-field__input ${passwordErrors.newPassword ? "doc-profile-field__input--error" : ""}`}
                placeholder="Ít nhất 6 ký tự"
                value={passwordForm.newPassword}
                onChange={(e) => handlePwField("newPassword", e.target.value)}
                autoComplete="new-password"
              />
              {passwordErrors.newPassword && (
                <span className="doc-profile-field__error">{passwordErrors.newPassword}</span>
              )}
            </div>
            <div className="doc-profile-field">
              <label className="doc-profile-field__label">Xác nhận mật khẩu mới</label>
              <input
                type="password"
                className={`doc-profile-field__input ${passwordErrors.confirmPassword ? "doc-profile-field__input--error" : ""}`}
                placeholder="Nhập lại mật khẩu mới"
                value={passwordForm.confirmPassword}
                onChange={(e) => handlePwField("confirmPassword", e.target.value)}
                autoComplete="new-password"
              />
              {passwordErrors.confirmPassword && (
                <span className="doc-profile-field__error">{passwordErrors.confirmPassword}</span>
              )}
            </div>
          </div>

          <div className="doc-profile-actions">
            <button
              type="button"
              className="dash-btn-primary"
              onClick={handlePasswordChange}
              disabled={passwordSaving}
            >
              {passwordSaving ? "Đang xử lý..." : "Đổi mật khẩu"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
