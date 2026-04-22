import React, { useState, useEffect } from "react";
import { Edit3, Heart, Phone, Save, User, X } from "lucide-react";
import { appointmentApi } from "../../../services/patientApi";
import "./HealthProfilePage.css";

function stripHtml(raw) {
  if (typeof raw !== "string") return "";
  return raw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() || "Đã xảy ra lỗi.";
}

const GENDER_LABELS = {
  male: "Nam",
  female: "Nữ",
  other: "Khác",
};

export default function HealthProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const data = await appointmentApi.getHealthProfile();
      setProfile(data);
      setForm(data || {});
    } catch { /* keep profile = null */ }
    finally { setLoading(false); }
  };

  const handleChange = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const handleEmergencyChange = (field, value) => {
    setForm((current) => ({
      ...current,
      emergency: { ...(current.emergency || {}), [field]: value },
    }));
  };

  const handleCancel = () => {
    setEditMode(false);
    setForm(profile || {});
    setSaveError("");
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError("");
    setSaveSuccess(false);
    try {
      const updated = await appointmentApi.updateHealthProfile(form);
      setProfile(updated);
      setForm(updated);
      setEditMode(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      setSaveError(stripHtml(error.message) || "Lưu thất bại, vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="ehealth-page">
        <div className="ehealth-loading">Đang tải hồ sơ...</div>
      </div>
    );
  }

  if (!profile && !editMode) {
    return (
      <div className="ehealth-page">
        <div className="ehealth-empty">
          <div className="ehealth-empty-icon">
            <Heart size={36} />
          </div>
          <h3>Chưa có hồ sơ sức khỏe</h3>
          <p>Hãy thêm thông tin sức khỏe để bác sĩ nắm được tiền sử bệnh của bạn.</p>
          <button className="btn-primary" onClick={() => setEditMode(true)}>
            <Edit3 size={16} />
            Thêm thông tin
          </button>
        </div>
      </div>
    );
  }

  const renderGender = () => {
    if (editMode) {
      return (
        <select
          className="field-input"
          value={form.gender || ""}
          onChange={(e) => handleChange("gender", e.target.value)}
        >
          <option value="">-- Chọn --</option>
          <option value="male">Nam</option>
          <option value="female">Nữ</option>
          <option value="other">Khác</option>
        </select>
      );
    }
    return (
      <span className="field-value">
        {GENDER_LABELS[form.gender] || "—"}
      </span>
    );
  };

  return (
    <div className="ehealth-page">
      {/* Header */}
      <div className="ehealth-header">
        <div className="ehealth-header-top">
          <div>
            <h1 className="ehealth-title">Hồ sơ sức khỏe</h1>
            <p className="ehealth-subtitle">Thông tin cá nhân và tiền sử dị ứng giúp bác sĩ chăm sóc bạn tốt hơn.</p>
          </div>
          <span className="ehealth-branch-badge">Cơ sở Hải Châu</span>
        </div>
      </div>

      <main className="ehealth-main">
        <div className="ehealth-container">
          <div className="ehealth-card profile-card">

            {saveSuccess && (
              <div className="claim-submit-success" style={{ marginBottom: 16 }}>
                Lưu thay đổi thành công!
              </div>
            )}
            {saveError && (
              <div className="claim-submit-error" style={{ marginBottom: 16 }}>
                {saveError}
              </div>
            )}

            {/* Personal Info */}
            <div className="hp-section">
              <div className="hp-section-header">
                <User size={16} />
                <span>Thông tin cá nhân</span>
              </div>

              <div className="hp-fields">
                <div className="form-row">
                  <label className="field-label">Họ tên</label>
                  {editMode ? (
                    <input
                      className="field-input"
                      value={form.name || ""}
                      onChange={(e) => handleChange("name", e.target.value)}
                    />
                  ) : (
                    <span className="field-value">{form.name || "—"}</span>
                  )}
                </div>

                <div className="form-row">
                  <label className="field-label">Số điện thoại</label>
                  {editMode ? (
                    <input
                      className="field-input"
                      value={form.phone || ""}
                      onChange={(e) => handleChange("phone", e.target.value)}
                    />
                  ) : (
                    <span className="field-value">{form.phone || "—"}</span>
                  )}
                </div>

                <div className="form-row">
                  <label className="field-label">Ngày sinh</label>
                  {editMode ? (
                    <input
                      type="date"
                      className="field-input"
                      value={form.dob || ""}
                      onChange={(e) => handleChange("dob", e.target.value)}
                    />
                  ) : (
                    <span className="field-value">{form.dob || "—"}</span>
                  )}
                </div>

                <div className="form-row">
                  <label className="field-label">Giới tính</label>
                  {renderGender()}
                </div>
              </div>
            </div>

            {/* Health Info */}
            <div className="section-sep" />
            <div className="hp-section">
              <div className="hp-section-header">
                <Heart size={16} />
                <span>Thông tin sức khỏe</span>
              </div>

              <div className="hp-fields">
                <div className="form-row">
                  <label className="field-label">Tiền sử dị ứng</label>
                  {editMode ? (
                    <textarea
                      className="field-input"
                      rows={3}
                      value={form.allergies || ""}
                      onChange={(e) => handleChange("allergies", e.target.value)}
                      placeholder="VD: Dị ứng penicillin, hải sản..."
                    />
                  ) : (
                    <span className="field-value hp-textarea-value">{form.allergies || "—"}</span>
                  )}
                </div>

                <div className="form-row">
                  <label className="field-label">Ghi chú sức khỏe</label>
                  {editMode ? (
                    <textarea
                      className="field-input"
                      rows={3}
                      value={form.notes || ""}
                      onChange={(e) => handleChange("notes", e.target.value)}
                      placeholder="Các thông tin sức khỏe khác..."
                    />
                  ) : (
                    <span className="field-value hp-textarea-value">{form.notes || "—"}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="section-sep" />
            <div className="hp-section">
              <div className="hp-section-header">
                <Phone size={16} />
                <span>Liên hệ khẩn cấp</span>
              </div>

              <div className="hp-fields">
                <div className="form-row">
                  <label className="field-label">Họ tên</label>
                  {editMode ? (
                    <input
                      className="field-input"
                      value={(form.emergency && form.emergency.name) || ""}
                      onChange={(e) => handleEmergencyChange("name", e.target.value)}
                    />
                  ) : (
                    <span className="field-value">{(form.emergency && form.emergency.name) || "—"}</span>
                  )}
                </div>

                <div className="form-row">
                  <label className="field-label">Số điện thoại</label>
                  {editMode ? (
                    <input
                      className="field-input"
                      value={(form.emergency && form.emergency.phone) || ""}
                      onChange={(e) => handleEmergencyChange("phone", e.target.value)}
                    />
                  ) : (
                    <span className="field-value">{(form.emergency && form.emergency.phone) || "—"}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="form-actions">
              {editMode ? (
                <>
                  <button
                    type="button"
                    className="btn-primary btn-small"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    <Save size={14} />
                    {saving ? "Đang lưu..." : "Lưu thay đổi"}
                  </button>
                  <button
                    type="button"
                    className="btn-secondary btn-small"
                    onClick={handleCancel}
                    disabled={saving}
                  >
                    <X size={14} />
                    Hủy
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="btn-primary btn-small"
                  onClick={() => { setSaveSuccess(false); setEditMode(true); }}
                >
                  <Edit3 size={14} />
                  Chỉnh sửa
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
