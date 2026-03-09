import React, { useState, useEffect } from "react";
import { appointmentApi } from "../../services/patientApi";
// styles defined in patient-portal.css (global for all patient pages)

export default function HealthProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({});

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    const data = await appointmentApi.getHealthProfile();
    setProfile(data);
    setForm(data || {});
    setLoading(false);
  };

  const handleChange = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
  };

  const handleEmergencyChange = (field, value) => {
    setForm((f) => ({
      ...f,
      emergency: {
        ...(f.emergency || {}),
        [field]: value,
      },
    }));
  };

  const save = async () => {
    await appointmentApi.updateHealthProfile(form);
    alert("Lưu thay đổi thành công");
    setProfile(form);
    setEditMode(false);
  };

  if (loading) {
    return (
      <div className="ehealth-page">
        <div className="ehealth-loading">Đang tải...</div>
      </div>
    );
  }

  if (!profile && !editMode) {
    return (
      <div className="ehealth-page">
        <div className="ehealth-empty">
          <h3>Chưa có hồ sơ sức khỏe</h3>
          <button className="btn-primary" onClick={() => setEditMode(true)}>
            Thêm thông tin
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="ehealth-page">
      <div className="ehealth-header">
        <div className="ehealth-header-top">
          <div>
            <h1 className="ehealth-title">Hồ sơ sức khỏe</h1>
            <p className="ehealth-subtitle">
              Quản lý thông tin cá nhân và tiền sử dị ứng của bạn.
            </p>
          </div>
          <span className="ehealth-branch-badge">MediCare Hải Châu</span>
        </div>
      </div>
      <main className="ehealth-main">
        <div className="ehealth-container">
          <div className="ehealth-card profile-card">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                save();
              }}
            >
              <div className="form-row">
                <label className="field-label">Họ tên</label>
                <input
                  className="field-input"
                  value={form.name || ""}
                  disabled={!editMode}
                  onChange={(e) => handleChange("name", e.target.value)}
                />
              </div>
              <div className="form-row">
                <label className="field-label">Số điện thoại</label>
                <input
                  className="field-input"
                  value={form.phone || ""}
                  disabled={!editMode}
                  onChange={(e) => handleChange("phone", e.target.value)}
                />
              </div>
              <div className="form-row">
                <label className="field-label">Ngày sinh</label>
                <input
                  type="date"
                  className="field-input"
                  value={form.dob || ""}
                  disabled={!editMode}
                  onChange={(e) => handleChange("dob", e.target.value)}
                />
              </div>
              <div className="form-row">
                <label className="field-label">Giới tính</label>
                <select
                  className="field-input"
                  value={form.gender || ""}
                  disabled={!editMode}
                  onChange={(e) => handleChange("gender", e.target.value)}
                >
                  <option value="">-- Chọn --</option>
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                  <option value="other">Khác</option>
                </select>
              </div>
              <div className="form-row">
                <label className="field-label">Tiền sử dị ứng</label>
                <textarea
                  className="field-input"
                  rows={3}
                  value={form.allergies || ""}
                  disabled={!editMode}
                  onChange={(e) => handleChange("allergies", e.target.value)}
                />
              </div>
              <div className="form-row">
                <label className="field-label">Ghi chú</label>
                <textarea
                  className="field-input"
                  rows={3}
                  value={form.notes || ""}
                  disabled={!editMode}
                  onChange={(e) => handleChange("notes", e.target.value)}
                />
              </div>
              <div className="section-sep"></div>
              <h3>Liên hệ khẩn cấp</h3>
              <div className="form-row">
                <label className="field-label">Họ tên</label>
                <input
                  className="field-input"
                  value={(form.emergency && form.emergency.name) || ""}
                  disabled={!editMode}
                  onChange={(e) =>
                    handleEmergencyChange("name", e.target.value)
                  }
                />
              </div>
              <div className="form-row">
                <label className="field-label">Số điện thoại</label>
                <input
                  className="field-input"
                  value={(form.emergency && form.emergency.phone) || ""}
                  disabled={!editMode}
                  onChange={(e) =>
                    handleEmergencyChange("phone", e.target.value)
                  }
                />
              </div>
              <div className="form-actions">
                {editMode ? (
                  <>
                    <button className="btn-primary btn-small" type="submit">
                      Lưu thay đổi
                    </button>
                    <button
                      type="button"
                      className="btn-secondary btn-small"
                      onClick={() => {
                        setEditMode(false);
                        setForm(profile || {});
                      }}
                    >
                      Hủy
                    </button>
                  </>
                ) : (
                  <button
                    className="btn-primary btn-small"
                    type="button"
                    onClick={() => setEditMode(true)}
                  >
                    Chỉnh sửa
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
