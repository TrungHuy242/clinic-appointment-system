import React, { useEffect, useState } from "react";
import { Calendar, CalendarX, CalendarClock, KeyRound, Stethoscope, UserRound } from "lucide-react";
import { doctorApi } from "../../../services/doctorApi";
import Button from "../../../components/Button/Button";
import LoadingSpinner from "../../../components/LoadingSpinner/LoadingSpinner";
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

  // ── Schedule config ─────────────────────────────────────────────────────
  const [scheduleConfig, setScheduleConfig] = useState(null);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [scheduleMsg, setScheduleMsg] = useState({ type: "", text: "" });
  const [timeOffList, setTimeOffList] = useState([]);
  const [newTimeOff, setNewTimeOff] = useState({ offDate: "", reason: "" });
  const [timeOffError, setTimeOffError] = useState("");

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

  async function loadScheduleConfig() {
    setScheduleLoading(true);
    try {
      const data = await doctorApi.getScheduleConfig();
      setScheduleConfig(data);
      setTimeOffList(data.timeOffs || []);
    } catch (err) {
      // silênt fail
    } finally {
      setScheduleLoading(false);
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

  async function handleScheduleToggle(weekday) {
    if (!scheduleConfig) return;
    const updated = scheduleConfig.schedule.map((row) =>
      row.weekday === weekday ? { ...row, isWorking: !row.isWorking } : row
    );
    setScheduleConfig((prev) => ({ ...prev, schedule: updated }));
  }

  async function handleSaveSchedule() {
    setScheduleSaving(true);
    setScheduleMsg({ type: "", text: "" });
    try {
      const payload = { schedule: scheduleConfig.schedule.map((row) => ({ weekday: row.weekday, isWorking: row.isWorking })) };
      await doctorApi.updateScheduleConfig(payload);
      setScheduleMsg({ type: "success", text: "Lưu lịch làm việc thành công." });
      setTimeout(() => setScheduleMsg({ type: "", text: "" }), 3000);
    } catch (err) {
      setScheduleMsg({ type: "error", text: stripHtml(err.message) || "Lưu thất bại." });
    } finally {
      setScheduleSaving(false);
    }
  }

  async function handleAddTimeOff() {
    if (!newTimeOff.offDate) {
      setTimeOffError("Vui lòng chọn ngày nghỉ.");
      return;
    }
    setTimeOffError("");
    try {
      const result = await doctorApi.addTimeOff(newTimeOff);
      setTimeOffList((prev) => [...prev, result]);
      setNewTimeOff({ offDate: "", reason: "" });
      setScheduleMsg({ type: "success", text: "Đã thêm ngày nghỉ." });
      setTimeout(() => setScheduleMsg({ type: "", text: "" }), 3000);
    } catch (err) {
      setTimeOffError(stripHtml(err.message) || "Không thêm được ngày nghỉ.");
    }
  }

  async function handleDeleteTimeOff(id) {
    try {
      await doctorApi.deleteTimeOff(id);
      setTimeOffList((prev) => prev.filter((t) => t.id !== id));
    } catch {
      // silent fail
    }
  }

  const WEEKDAY_SHORT = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

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
        <button
          className={`dash-filter-tab ${activeTab === "schedule" ? "active" : ""}`}
          onClick={() => { setActiveTab("schedule"); setScheduleMsg({ type: "", text: "" }); loadScheduleConfig(); }}
          type="button"
        >
          <CalendarClock className="mc-icon mc-icon--sm" /> Lịch làm việc
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

      {/* ── Tab: Schedule ── */}
      {activeTab === "schedule" && (
        <div className="doc-profile-card">
          <h2 className="doc-profile-card-title">Lịch làm việc mặc định</h2>
          <p className="doc-profile-sub">Bật/tắt ngày làm việc trong tuần. Lịch nghỉ phép bên dưới.</p>

          {scheduleMsg.text && (
            <div className={`doc-profile-msg doc-profile-msg--${scheduleMsg.type}`}>
              {scheduleMsg.text}
            </div>
          )}

          {scheduleLoading ? (
            <LoadingSpinner />
          ) : (
            <>
              <div className="doc-profile-fields">
                {scheduleConfig?.schedule?.map((row) => (
                  <div key={row.weekday} className="doc-profile-field">
                    <label className="doc-profile-field__label">
                      {row.label}
                    </label>
                    <label className="doc-profile-toggle">
                      <input
                        type="checkbox"
                        checked={row.isWorking}
                        onChange={() => handleScheduleToggle(row.weekday)}
                      />
                      <span className="doc-profile-toggle__slider" />
                      <span className="doc-profile-toggle__label">
                        {row.isWorking ? "Làm việc" : "Nghỉ"}
                      </span>
                    </label>
                  </div>
                ))}
              </div>

              <div className="doc-profile-actions">
                <button
                  type="button"
                  className="dash-btn-primary"
                  onClick={handleSaveSchedule}
                  disabled={scheduleSaving}
                >
                  {scheduleSaving ? "Đang lưu..." : "Lưu lịch làm việc"}
                </button>
              </div>

              <div style={{ marginTop: 32 }}>
                <h2 className="doc-profile-card-title">Ngày nghỉ phép</h2>
                <p className="doc-profile-sub">Thêm ngày nghỉ không nhận lịch hẹn.</p>

                <div className="doc-profile-fields">
                  <div className="doc-profile-field">
                    <label className="doc-profile-field__label">Ngày nghỉ</label>
                    <input
                      type="date"
                      className="doc-profile-field__input"
                      value={newTimeOff.offDate}
                      onChange={(e) => setNewTimeOff((p) => ({ ...p, offDate: e.target.value }))}
                    />
                  </div>
                  <div className="doc-profile-field">
                    <label className="doc-profile-field__label">Lý do (không bắt buộc)</label>
                    <input
                      type="text"
                      className="doc-profile-field__input"
                      placeholder="VD: Nghỉ phép năm"
                      value={newTimeOff.reason}
                      onChange={(e) => setNewTimeOff((p) => ({ ...p, reason: e.target.value }))}
                    />
                  </div>
                </div>
                {timeOffError && (
                  <div className="doc-profile-msg doc-profile-msg--error" style={{ marginBottom: 12 }}>
                    {timeOffError}
                  </div>
                )}
                <Button size="sm" onClick={handleAddTimeOff}>
                  <CalendarX className="mc-icon mc-icon--xs" style={{ marginRight: 4 }} />
                  Thêm ngày nghỉ
                </Button>

                {timeOffList.length > 0 ? (
                  <table className="doc-profile-table" style={{ marginTop: 16 }}>
                    <thead>
                      <tr>
                        <th>Ngày</th>
                        <th>Lý do</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {timeOffList.map((t) => (
                        <tr key={t.id}>
                          <td>{t.offDate}</td>
                          <td>{t.reason || "—"}</td>
                          <td>
                            <button
                              type="button"
                              className="dash-btn-danger-sm"
                              onClick={() => handleDeleteTimeOff(t.id)}
                            >
                              <CalendarX className="mc-icon mc-icon--xs" />
                              Xóa
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="doc-profile-sub" style={{ marginTop: 12 }}>
                    Chưa có ngày nghỉ nào.
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
