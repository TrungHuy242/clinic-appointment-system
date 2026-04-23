import React, { useEffect, useState } from "react";
import { KeyRound, Users, UserRound } from "lucide-react";
import { receptionApi } from "../../../services/receptionApi";
import "./ProfilePage.css";

function stripHtml(raw) {
  if (typeof raw !== "string") return "";
  return raw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() || "Đã xảy ra lỗi.";
}

export default function ReceptionistProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  // ── Profile editing ────────────────────────────────────────────────────────
  const [editing, setEditing] = useState(false);
  const [profileForm, setProfileForm] = useState({});
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ type: "", text: "" });

  // ── Password ───────────────────────────────────────────────────────────────
  const [passwordTab, setPasswordTab] = useState(false);
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
      const data = await receptionApi.getProfile();
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
      const data = await receptionApi.updateProfile({
        fullName: profileForm.fullName,
        phone: profileForm.phone,
        email: profileForm.email,
        notes: profileForm.notes,
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
      await receptionApi.changePassword({
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
      <div className="rc-profile-page">
        <div className="rc-profile-loading">Đang tải thông tin...</div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="rc-profile-page">
        <div className="rc-profile-error">{loadError}</div>
      </div>
    );
  }

  return (
    <div className="rc-profile-page">
      <div className="dash-page-header">
        <div>
          <h1 className="dash-page-title">Hồ sơ nhân viên</h1>
          <p className="dash-page-sub">Xem và cập nhật thông tin cá nhân</p>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="rc-profile-tabs">
        <button
          className={`dash-filter-tab ${!passwordTab ? "active" : ""}`}
          onClick={() => { setPasswordTab(false); setProfileMsg({ type: "", text: "" }); }}
          type="button"
        >
          <UserRound className="mc-icon mc-icon--sm" /> Thông tin cá nhân
        </button>
        <button
          className={`dash-filter-tab ${passwordTab ? "active" : ""}`}
          onClick={() => { setPasswordTab(true); setPasswordMsg({ type: "", text: "" }); }}
          type="button"
        >
          <KeyRound className="mc-icon mc-icon--sm" /> Đổi mật khẩu
        </button>
      </div>

      {/* ── Tab: Profile ── */}
      {!passwordTab && (
        <div className="rc-profile-card">
          <div className="rc-profile-avatar-row">
            <div className="rc-profile-avatar">
              <Users className="mc-icon mc-icon--xl" />
            </div>
            <div className="rc-profile-avatar-info">
              <div className="rc-profile-name">
                {profile?.fullName || "—"}
                {!editing && (
                  <button
                    type="button"
                    className="rc-profile-edit-btn"
                    onClick={() => { setProfileMsg({ type: "", text: "" }); setEditing(true); }}
                  >
                    Chỉnh sửa
                  </button>
                )}
              </div>
              <div className="rc-profile-role">Nhân viên lễ tân</div>
            </div>
          </div>

          {profileMsg.text && (
            <div className={`rc-profile-msg rc-profile-msg--${profileMsg.type}`}>
              {profileMsg.text}
            </div>
          )}

          <div className="rc-profile-fields">
            <div className="rc-profile-field">
              <label className="rc-profile-field__label">Tên đăng nhập</label>
              <input className="rc-profile-field__input" value={profile?.username || ""} disabled />
            </div>
            <div className="rc-profile-field">
              <label className="rc-profile-field__label">Họ tên</label>
              <input
                className="rc-profile-field__input"
                value={profileForm.fullName || ""}
                disabled={!editing}
                onChange={(e) => handleField("fullName", e.target.value)}
              />
            </div>
            <div className="rc-profile-field">
              <label className="rc-profile-field__label">Số điện thoại</label>
              <input
                className="rc-profile-field__input"
                type="tel"
                placeholder="Nhập số điện thoại"
                value={profileForm.phone || ""}
                disabled={!editing}
                onChange={(e) => handleField("phone", e.target.value)}
              />
            </div>
            <div className="rc-profile-field">
              <label className="rc-profile-field__label">Email</label>
              <input
                className="rc-profile-field__input"
                type="email"
                placeholder="Nhập email"
                value={profileForm.email || ""}
                disabled={!editing}
                onChange={(e) => handleField("email", e.target.value)}
              />
            </div>
            <div className="rc-profile-field rc-profile-field--full">
              <label className="rc-profile-field__label">Ghi chú</label>
              <textarea
                className="rc-profile-field__input rc-profile-field__textarea"
                placeholder="Ghi chú nội bộ..."
                value={profileForm.notes || ""}
                disabled={!editing}
                rows={3}
                onChange={(e) => handleField("notes", e.target.value)}
              />
            </div>
          </div>

          {editing && (
            <div className="rc-profile-actions">
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
      {passwordTab && (
        <div className="rc-profile-card">
          <h2 className="rc-profile-card-title">Đổi mật khẩu</h2>

          {passwordMsg.text && (
            <div className={`rc-profile-msg rc-profile-msg--${passwordMsg.type}`}>
              {passwordMsg.text}
            </div>
          )}

          <div className="rc-profile-fields">
            <div className="rc-profile-field">
              <label className="rc-profile-field__label">Mật khẩu hiện tại</label>
              <input
                type="password"
                className={`rc-profile-field__input ${passwordErrors.currentPassword ? "rc-profile-field__input--error" : ""}`}
                placeholder="Nhập mật khẩu hiện tại"
                value={passwordForm.currentPassword}
                onChange={(e) => handlePwField("currentPassword", e.target.value)}
                autoComplete="current-password"
              />
              {passwordErrors.currentPassword && (
                <span className="rc-profile-field__error">{passwordErrors.currentPassword}</span>
              )}
            </div>
            <div className="rc-profile-field">
              <label className="rc-profile-field__label">Mật khẩu mới</label>
              <input
                type="password"
                className={`rc-profile-field__input ${passwordErrors.newPassword ? "rc-profile-field__input--error" : ""}`}
                placeholder="Ít nhất 6 ký tự"
                value={passwordForm.newPassword}
                onChange={(e) => handlePwField("newPassword", e.target.value)}
                autoComplete="new-password"
              />
              {passwordErrors.newPassword && (
                <span className="rc-profile-field__error">{passwordErrors.newPassword}</span>
              )}
            </div>
            <div className="rc-profile-field">
              <label className="rc-profile-field__label">Xác nhận mật khẩu mới</label>
              <input
                type="password"
                className={`rc-profile-field__input ${passwordErrors.confirmPassword ? "rc-profile-field__input--error" : ""}`}
                placeholder="Nhập lại mật khẩu mới"
                value={passwordForm.confirmPassword}
                onChange={(e) => handlePwField("confirmPassword", e.target.value)}
                autoComplete="new-password"
              />
              {passwordErrors.confirmPassword && (
                <span className="rc-profile-field__error">{passwordErrors.confirmPassword}</span>
              )}
            </div>
          </div>

          <div className="rc-profile-actions">
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
