import React, { useEffect, useState } from "react";
import { KeyRound, LogOut, ShieldCheck, UserRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { appointmentApi } from "../../../services/patientApi";
import { useAuth } from "../../../services/authService";
import "./AccountPage.css";

function StatusMessage({ type, message }) {
  if (!message) return null;
  return (
    <div className={type === "success" ? "claim-submit-success" : "claim-submit-error"}>
      {message}
    </div>
  );
}

export default function AccountPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");

  // ── Profile tab ─────────────────────────────────────────────────────────
  const [profileEditing, setProfileEditing] = useState(false);
  const [profileForm, setProfileForm] = useState({});
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ type: "", text: "" });

  // ── Password tab ─────────────────────────────────────────────────────────
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState({ type: "", text: "" });

  // ── Load ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    loadAccount();
  }, []);

  async function loadAccount() {
    setLoading(true);
    try {
      const data = await appointmentApi.getAccountInfo();
      setAccount(data);
      setProfileForm(data || {});
    } catch (error) {
      setProfileMsg({ type: "error", text: error.message || "Không tải được thông tin tài khoản." });
    } finally {
      setLoading(false);
    }
  }

  // ── Profile ───────────────────────────────────────────────────────────────
  function handleProfileChange(field, value) {
    setProfileForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleProfileSave() {
    setProfileSaving(true);
    setProfileMsg({ type: "", text: "" });
    try {
      const data = await appointmentApi.updateAccountInfo(profileForm);
      setAccount(data);
      setProfileForm(data);
      setProfileEditing(false);
      setProfileMsg({ type: "success", text: "Cập nhật thông tin thành công." });
      setTimeout(() => setProfileMsg({ type: "", text: "" }), 3000);
    } catch (error) {
      setProfileMsg({ type: "error", text: error.message || "Không thể cập nhật thông tin." });
    } finally {
      setProfileSaving(false);
    }
  }

  function handleProfileCancel() {
    setProfileEditing(false);
    setProfileForm(account || {});
    setProfileMsg({ type: "", text: "" });
  }

  // ── Password ──────────────────────────────────────────────────────────────
  function handlePasswordField(field, value) {
    setPasswordForm((prev) => ({ ...prev, [field]: value }));
    setPasswordErrors((prev) => ({ ...prev, [field]: "" }));
  }

  function validatePassword() {
    const errs = {};
    if (!passwordForm.currentPassword.trim()) errs.currentPassword = "Vui lòng nhập mật khẩu hiện tại";
    if (passwordForm.newPassword.length < 6) errs.newPassword = "Mật khẩu mới phải từ 6 ký tự trở lên";
    if (passwordForm.newPassword !== passwordForm.confirmPassword) errs.confirmPassword = "Mật khẩu không khớp";
    setPasswordErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handlePasswordChange() {
    if (!validatePassword()) return;
    setPasswordSaving(true);
    setPasswordMsg({ type: "", text: "" });
    try {
      await appointmentApi.changePassword(passwordForm);
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setPasswordErrors({});
      setPasswordMsg({ type: "success", text: "Đổi mật khẩu thành công." });
      setTimeout(() => setPasswordMsg({ type: "", text: "" }), 3000);
    } catch (error) {
      const errData = error.data;
      if (errData && typeof errData === "object") {
        const mapped = {};
        Object.entries(errData).forEach(([k, v]) => {
          mapped[k] = Array.isArray(v) ? v[0] : v;
        });
        setPasswordErrors(mapped);
      } else {
        setPasswordMsg({ type: "error", text: error.message || "Không thể đổi mật khẩu." });
      }
    } finally {
      setPasswordSaving(false);
    }
  }

  // ── Logout ────────────────────────────────────────────────────────────────
  function handleLogout() {
    logout();
    navigate("/login");
  }

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="ehealth-page">
        <div className="ehealth-loading">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="ehealth-page">
      <div className="ehealth-header">
        <div className="ehealth-header-top">
          <div>
            <h1 className="ehealth-title">Tài khoản của tôi</h1>
            <p className="ehealth-subtitle">Quản lý thông tin cá nhân và bảo mật tài khoản.</p>
          </div>
          <span className="ehealth-branch-badge">Cơ sở Hải Châu</span>
        </div>
      </div>

      <main className="ehealth-main">
        <div className="ehealth-container">

          {/* Tabs */}
          <div className="ehealth-tabs">
            <button
              className={`ehealth-tab ${activeTab === "profile" ? "active" : ""}`}
              onClick={() => setActiveTab("profile")}
            >
              <UserRound size={16} /> Thông tin cá nhân
            </button>
            <button
              className={`ehealth-tab ${activeTab === "password" ? "active" : ""}`}
              onClick={() => setActiveTab("password")}
            >
              <KeyRound size={16} /> Đổi mật khẩu
            </button>
            <button
              className={`ehealth-tab ${activeTab === "security" ? "active" : ""}`}
              onClick={() => setActiveTab("security")}
            >
              <ShieldCheck size={16} /> Bảo mật
            </button>
          </div>

          {/* ── Tab: Profile ── */}
          {activeTab === "profile" && (
            <div className="ehealth-card profile-card">
              <h2 className="ehealth-card-title">Thông tin tài khoản</h2>

              <StatusMessage type={profileMsg.type} message={profileMsg.text} />

              <div className="account-section">
                <div className="form-row">
                  <label className="field-label">Tên đăng nhập</label>
                  <input className="field-input" value={profileForm.username || ""} disabled />
                </div>
                <div className="form-row">
                  <label className="field-label">Email</label>
                  <input
                    className="field-input"
                    type="email"
                    value={profileForm.email || ""}
                    disabled={!profileEditing}
                    onChange={(e) => handleProfileChange("email", e.target.value)}
                  />
                </div>
                <div className="form-row">
                  <label className="field-label">Họ tên</label>
                  <input
                    className="field-input"
                    value={profileForm.name || ""}
                    disabled={!profileEditing}
                    onChange={(e) => handleProfileChange("name", e.target.value)}
                  />
                </div>
              </div>

              <div className="form-actions">
                {profileEditing ? (
                  <>
                    <button
                      className="btn-primary btn-small"
                      onClick={handleProfileSave}
                      disabled={profileSaving}
                      type="button"
                    >
                      {profileSaving ? "Đang lưu..." : "Lưu thay đổi"}
                    </button>
                    <button
                      className="btn-secondary btn-small"
                      onClick={handleProfileCancel}
                      disabled={profileSaving}
                      type="button"
                    >
                      Hủy
                    </button>
                  </>
                ) : (
                  <button
                    className="btn-primary btn-small"
                    onClick={() => { setProfileMsg({ type: "", text: "" }); setProfileEditing(true); }}
                    type="button"
                  >
                    Chỉnh sửa
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── Tab: Password ── */}
          {activeTab === "password" && (
            <div className="ehealth-card profile-card">
              <h2 className="ehealth-card-title">Đổi mật khẩu</h2>

              <StatusMessage type={passwordMsg.type} message={passwordMsg.text} />

              <div className="account-section">
                <p className="account-hint">Vui lòng nhập mật khẩu hiện tại và mật khẩu mới để cập nhật.</p>

                {[
                  { field: "currentPassword", label: "Mật khẩu hiện tại" },
                  { field: "newPassword",     label: "Mật khẩu mới" },
                  { field: "confirmPassword", label: "Xác nhận mật khẩu" },
                ].map(({ field, label }) => (
                  <div className="form-row" key={field}>
                    <label className="field-label">{label}</label>
                    <input
                      type="password"
                      className={`field-input ${passwordErrors[field] ? "error" : ""}`}
                      value={passwordForm[field]}
                      onChange={(e) => handlePasswordField(field, e.target.value)}
                    />
                    {passwordErrors[field] && (
                      <span className="field-error">{passwordErrors[field]}</span>
                    )}
                  </div>
                ))}
              </div>

              <div className="form-actions">
                <button
                  className="btn-primary btn-small"
                  onClick={handlePasswordChange}
                  disabled={passwordSaving}
                  type="button"
                >
                  {passwordSaving ? "Đang xử lý..." : "Đổi mật khẩu"}
                </button>
              </div>
            </div>
          )}

          {/* ── Tab: Security ── */}
          {activeTab === "security" && (
            <div className="ehealth-card profile-card">
              <h2 className="ehealth-card-title">Bảo mật tài khoản</h2>
              <div className="account-section">
                {[
                  {
                    title: "Xác thực hai lớp",
                    desc: "Bảo vệ tài khoản bằng mã xác thực qua SMS",
                    label: "Cài đặt",
                  },
                  {
                    title: "Thiết bị đăng nhập",
                    desc: "Quản lý các thiết bị có quyền truy cập tài khoản",
                    label: "Quản lý",
                  },
                  {
                    title: "Hoạt động tài khoản",
                    desc: "Xem lịch sử đăng nhập và hoạt động gần đây",
                    label: "Xem",
                  },
                ].map(({ title, desc, label }, index, arr) => (
                  <React.Fragment key={title}>
                    <div className="security-item">
                      <div className="security-item-content">
                        <h3 className="security-item-title">{title}</h3>
                        <p className="security-item-desc">{desc}</p>
                      </div>
                      <button className="btn-secondary btn-small" type="button">{label}</button>
                    </div>
                    {index < arr.length - 1 && <div className="section-sep" />}
                  </React.Fragment>
                ))}
              </div>

              <div className="form-actions account-logout">
                <button
                  className="btn-secondary btn-small account-logout-button"
                  onClick={handleLogout}
                  type="button"
                >
                  <LogOut size={16} />
                  Đăng xuất
                </button>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}