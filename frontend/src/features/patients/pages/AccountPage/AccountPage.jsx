import React, { useState, useEffect } from "react";
import { KeyRound, LogOut, ShieldCheck, UserRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { appointmentApi } from "../../services/patientApi";
import "./AccountPage.css";

export default function AccountPage() {
  const navigate = useNavigate();
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");
  const [profileEditing, setProfileEditing] = useState(false);
  const [profileForm, setProfileForm] = useState({});
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordErrors, setPasswordErrors] = useState({});

  useEffect(() => {
    loadAccount();
  }, []);

  const loadAccount = async () => {
    setLoading(true);
    const data = await appointmentApi.getAccountInfo();
    setAccount(data);
    setProfileForm(data || {});
    setLoading(false);
  };

  const handleProfileChange = (field, value) => {
    setProfileForm((formState) => ({ ...formState, [field]: value }));
  };

  const handleProfileSave = async () => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    setAccount(profileForm);
    setProfileEditing(false);
    alert("Cập nhật thông tin thành công");
  };

  const validatePassword = () => {
    const nextErrors = {};
    if (!passwordForm.currentPassword.trim()) {
      nextErrors.currentPassword = "Vui lòng nhập mật khẩu hiện tại";
    }
    if (passwordForm.newPassword.length < 6) {
      nextErrors.newPassword = "Mật khẩu mới phải từ 6 ký tự trở lên";
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      nextErrors.confirmPassword = "Mật khẩu không khớp";
    }
    setPasswordErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handlePasswordChange = async () => {
    if (!validatePassword()) return;
    await appointmentApi.changePassword(passwordForm);
    alert("Đổi mật khẩu thành công");
    setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
  };

  const handleLogout = () => {
    alert("Đã đăng xuất");
    navigate("/patient/login");
  };

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
          <div className="ehealth-tabs">
            <button className={`ehealth-tab ${activeTab === "profile" ? "active" : ""}`} onClick={() => setActiveTab("profile")}>
              <UserRound size={16} />
              Thông tin cá nhân
            </button>
            <button className={`ehealth-tab ${activeTab === "password" ? "active" : ""}`} onClick={() => setActiveTab("password")}>
              <KeyRound size={16} />
              Đổi mật khẩu
            </button>
            <button className={`ehealth-tab ${activeTab === "security" ? "active" : ""}`} onClick={() => setActiveTab("security")}>
              <ShieldCheck size={16} />
              Bảo mật
            </button>
          </div>

          {activeTab === "profile" && (
            <div className="ehealth-card profile-card">
              <h2 className="ehealth-card-title">Thông tin tài khoản</h2>
              <div className="account-section">
                <div className="form-row">
                  <label className="field-label">Tên đăng nhập</label>
                  <input className="field-input" value={profileForm.username || ""} disabled />
                </div>
                <div className="form-row">
                  <label className="field-label">Email</label>
                  <input
                    className="field-input"
                    value={profileForm.email || ""}
                    disabled={!profileEditing}
                    onChange={(event) => handleProfileChange("email", event.target.value)}
                  />
                </div>
                <div className="form-row">
                  <label className="field-label">Họ tên</label>
                  <input
                    className="field-input"
                    value={profileForm.name || ""}
                    disabled={!profileEditing}
                    onChange={(event) => handleProfileChange("name", event.target.value)}
                  />
                </div>
              </div>

              <div className="form-actions">
                {profileEditing ? (
                  <>
                    <button className="btn-primary btn-small" onClick={handleProfileSave}>
                      Lưu thay đổi
                    </button>
                    <button
                      className="btn-secondary btn-small"
                      onClick={() => {
                        setProfileEditing(false);
                        setProfileForm(account || {});
                      }}
                    >
                      Hủy
                    </button>
                  </>
                ) : (
                  <button className="btn-primary btn-small" onClick={() => setProfileEditing(true)}>
                    Chỉnh sửa
                  </button>
                )}
              </div>
            </div>
          )}

          {activeTab === "password" && (
            <div className="ehealth-card profile-card">
              <h2 className="ehealth-card-title">Đổi mật khẩu</h2>
              <div className="account-section">
                <p className="account-hint">Vui lòng nhập mật khẩu hiện tại và mật khẩu mới để cập nhật.</p>
                <div className="form-row">
                  <label className="field-label">Mật khẩu hiện tại</label>
                  <input
                    type="password"
                    className={`field-input ${passwordErrors.currentPassword ? "error" : ""}`}
                    value={passwordForm.currentPassword}
                    onChange={(event) => setPasswordForm({ ...passwordForm, currentPassword: event.target.value })}
                  />
                  {passwordErrors.currentPassword && <span className="field-error">{passwordErrors.currentPassword}</span>}
                </div>
                <div className="form-row">
                  <label className="field-label">Mật khẩu mới</label>
                  <input
                    type="password"
                    className={`field-input ${passwordErrors.newPassword ? "error" : ""}`}
                    value={passwordForm.newPassword}
                    onChange={(event) => setPasswordForm({ ...passwordForm, newPassword: event.target.value })}
                  />
                  {passwordErrors.newPassword && <span className="field-error">{passwordErrors.newPassword}</span>}
                </div>
                <div className="form-row">
                  <label className="field-label">Xác nhận mật khẩu</label>
                  <input
                    type="password"
                    className={`field-input ${passwordErrors.confirmPassword ? "error" : ""}`}
                    value={passwordForm.confirmPassword}
                    onChange={(event) => setPasswordForm({ ...passwordForm, confirmPassword: event.target.value })}
                  />
                  {passwordErrors.confirmPassword && <span className="field-error">{passwordErrors.confirmPassword}</span>}
                </div>
              </div>

              <div className="form-actions">
                <button className="btn-primary btn-small" onClick={handlePasswordChange}>
                  Đổi mật khẩu
                </button>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="ehealth-card profile-card">
              <h2 className="ehealth-card-title">Bảo mật tài khoản</h2>
              <div className="account-section">
                <div className="security-item">
                  <div className="security-item-content">
                    <h3 className="security-item-title">Xác thực hai lớp</h3>
                    <p className="security-item-desc">Bảo vệ tài khoản bằng mã xác thực qua SMS</p>
                  </div>
                  <button className="btn-secondary btn-small">Cài đặt</button>
                </div>

                <div className="section-sep"></div>

                <div className="security-item">
                  <div className="security-item-content">
                    <h3 className="security-item-title">Thiết bị đăng nhập</h3>
                    <p className="security-item-desc">Quản lý các thiết bị có quyền truy cập tài khoản</p>
                  </div>
                  <button className="btn-secondary btn-small">Quản lý</button>
                </div>

                <div className="section-sep"></div>

                <div className="security-item">
                  <div className="security-item-content">
                    <h3 className="security-item-title">Hoạt động tài khoản</h3>
                    <p className="security-item-desc">Xem lịch sử đăng nhập và hoạt động gần đây</p>
                  </div>
                  <button className="btn-secondary btn-small">Xem</button>
                </div>
              </div>

              <div className="form-actions account-logout">
                <button className="btn-secondary btn-small account-logout-button" onClick={handleLogout}>
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