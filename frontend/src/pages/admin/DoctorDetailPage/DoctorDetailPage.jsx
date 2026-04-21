import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  KeyRound,
  Pencil,
  Stethoscope,
  Trash2,
  UserCheck,
  UserRound,
} from "lucide-react";
import Badge from "../../../components/Badge/Badge";
import Button from "../../../components/Button/Button";
import Input from "../../../components/Input/Input";
import LoadingSpinner from "../../../components/LoadingSpinner/LoadingSpinner";
import Modal from "../../../components/Modal/Modal";
import {
  createDoctor,
  createDoctorAccount,
  getDoctorDetail,
  listSpecialties,
  updateDoctor,
} from "../../../services/adminApi";
import "./DoctorDetailPage.css";

function stripHtml(raw) {
  if (typeof raw !== "string") return "";
  return raw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() || "Đã xảy ra lỗi.";
}

function ConfirmModal({ open, title, body, confirmLabel, confirmVariant, onConfirm, onCancel, saving }) {
  if (!open) return null;
  return (
    <Modal
      open={open}
      title={title}
      onClose={onCancel}
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onCancel} disabled={saving}>Hủy</Button>
          <Button variant={confirmVariant || "primary"} size="sm" onClick={onConfirm} disabled={saving}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p style={{ margin: 0, color: "var(--color-text-main)", fontSize: 14 }}>{body}</p>
    </Modal>
  );
}

function goBack(navigate) {
  if (window.history.length > 1) {
    window.history.back();
  } else {
    navigate("/app/admin/catalog");
  }
}

export default function DoctorDetailPage() {
  const pathParts = window.location.pathname.split("/").filter(Boolean);
  const lastSegment = pathParts[pathParts.length - 1];
  const isCreateMode = lastSegment === "create";
  const doctorId = isCreateMode ? null : Number(lastSegment);

  const navigate = useNavigate();

  // ── State ──────────────────────────────────────────────────────────────
  const [profile, setProfile] = useState(null);       // doctor detail data
  const [specialties, setSpecialties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Create mode form
  const [form, setForm] = useState({
    full_name: "", phone: "", email: "", specialty_id: "", bio: "", is_active: true,
  });

  // View/edit state
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [saving, setSaving] = useState(false);

  // Delete confirm
  const [deleteModal, setDeleteModal] = useState({ open: false });

  // Account creation
  const [accountModal, setAccountModal] = useState(false);
  const [accountForm, setAccountForm] = useState({ username: "", password: "" });
  const [accountError, setAccountError] = useState("");

  // ── Load specialties (needed for create + edit) ───────────────────────
  async function loadSpecialties() {
    try {
      const data = await listSpecialties();
      setSpecialties(Array.isArray(data) ? data : []);
    } catch {
      // non-critical
    }
  }

  // ── Load doctor profile ───────────────────────────────────────────────
  async function loadProfile() {
    setLoading(true);
    setError("");
    try {
      const data = await getDoctorDetail(doctorId);
      setProfile(data);
    } catch (err) {
      setError(stripHtml(err.message) || "Không tải được thông tin bác sĩ.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function init() {
      await loadSpecialties();
      if (!isCreateMode) {
        await loadProfile();
      } else {
        setLoading(false);
      }
    }
    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Create ─────────────────────────────────────────────────────────────
  async function handleCreate() {
    const { full_name, specialty_id } = form;
    if (!full_name.trim()) { setError("Họ tên là bắt buộc."); return; }
    if (!specialty_id) { setError("Chuyên khoa là bắt buộc."); return; }
    setSaving(true);
    setError("");
    try {
      const payload = {
        full_name: full_name.trim(),
        phone: (form.phone || "").trim(),
        email: (form.email || "").trim(),
        specialty: Number(specialty_id),
        bio: (form.bio || "").trim(),
        is_active: Boolean(form.is_active),
      };
      const created = await createDoctor(payload);
      navigate(`/app/admin/catalog/doctors/${created.id}`);
    } catch (err) {
      setError(stripHtml(err.message) || "Không tạo được bác sĩ.");
      setSaving(false);
    }
  }

  // ── Start edit ─────────────────────────────────────────────────────────
  function startEdit() {
    if (!profile) return;
    setEditForm({
      full_name: profile.full_name || "",
      phone: profile.phone || "",
      email: profile.email || "",
      specialty_id: profile.specialty ? String(profile.specialty) : "",
      bio: profile.bio || "",
      is_active: profile.is_active ?? true,
    });
    setEditMode(true);
  }

  function cancelEdit() {
    setEditMode(false);
    setEditForm(null);
  }

  async function handleSaveEdit() {
    if (!editForm || !profile) return;
    const { full_name, specialty_id } = editForm;
    if (!full_name.trim()) { setError("Họ tên là bắt buộc."); return; }
    setSaving(true);
    setError("");
    try {
      await updateDoctor(profile.id, {
        full_name: full_name.trim(),
        phone: (editForm.phone || "").trim(),
        email: (editForm.email || "").trim(),
        specialty: specialty_id ? Number(specialty_id) : undefined,
        bio: (editForm.bio || "").trim(),
        is_active: Boolean(editForm.is_active),
      });
      setEditMode(false);
      setEditForm(null);
      await loadProfile();
    } catch (err) {
      setError(stripHtml(err.message) || "Không lưu được thông tin bác sĩ.");
      setSaving(false);
    }
  }

  // ── Delete ─────────────────────────────────────────────────────────────
  async function handleDelete() {
    if (!profile) return;
    setSaving(true);
    setError("");
    try {
      await updateDoctor(profile.id, { is_active: false });
      navigate("/app/admin/catalog");
    } catch (err) {
      setError(stripHtml(err.message) || "Không xóa được bác sĩ.");
      setSaving(false);
    }
  }

  // ── Account creation ──────────────────────────────────────────────────
  function openAccountModal() {
    setAccountForm({ username: "", password: "" });
    setAccountError("");
    setAccountModal(true);
  }

  async function handleCreateAccount() {
    const { username, password } = accountForm;
    if (!username.trim()) { setAccountError("Tên đăng nhập là bắt buộc."); return; }
    if (!password || password.length < 6) { setAccountError("Mật khẩu phải ít nhất 6 ký tự."); return; }
    setSaving(true);
    setAccountError("");
    try {
      await createDoctorAccount(profile.id, {
        username: username.trim(),
        password,
      });
      setAccountModal(false);
      await loadProfile();
    } catch (err) {
      setAccountError(err.message || "Không tạo được tài khoản.");
      setSaving(false);
    }
  }

  // ── Render: Create Mode ─────────────────────────────────────────────────
  if (isCreateMode) {
    if (loading) {
      return (
        <div className="dash-page doctor-detail-page">
          <LoadingSpinner />
        </div>
      );
    }

    return (
      <div className="dash-page doctor-detail-page">
        <div className="doctor-detail-page__back">
          <button className="doctor-detail-page__back-btn" type="button" onClick={() => goBack(navigate)}>
            <ArrowLeft className="mc-icon mc-icon--sm" />
            Quay lại danh mục
          </button>
        </div>

        <div className="doctor-detail-page__header">
          <div className="doctor-detail-page__avatar">
            <UserRound className="mc-icon mc-icon--lg" />
          </div>
          <div>
            <h1 className="doctor-detail-page__name">Thêm bác sĩ mới</h1>
            <p className="doctor-detail-page__specialty-sub">Điền thông tin bác sĩ vào biểu mẫu bên dưới</p>
          </div>
        </div>

        {error && (
          <div className="doctor-detail-page__error-banner" role="alert">
            {error}
            <button type="button" className="doctor-detail-page__error-close" onClick={() => setError("")}>×</button>
          </div>
        )}

        <div className="mc-surface doctor-detail-page__card">
          <div className="doctor-detail-page__section-title">Thông tin bác sĩ</div>
          <div className="doctor-detail-page__form-grid">
            <Input
              label="Họ tên bác sĩ"
              value={form.full_name}
              onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
              placeholder="VD: BS. Nguyễn Văn X"
            />
            <Input
              label="Số điện thoại"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="0912 345 678"
            />
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="VD: bs.nguyen@clinic.com"
            />
            <div className="doctor-detail-page__select-wrap">
              <span className="doctor-detail-page__select-label">Chuyên khoa *</span>
              <select
                className="dash-filter-select"
                value={form.specialty_id}
                onChange={(e) => setForm((f) => ({ ...f, specialty_id: e.target.value }))}
              >
                <option value="">— Chọn khoa —</option>
                {specialties.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <Input
              label="Giới thiệu"
              value={form.bio}
              onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
              placeholder="Mô tả ngắn về bác sĩ"
            />
            <label className="doctor-detail-page__checkbox-label">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
              />
              Đang hoạt động
            </label>
          </div>
          <div className="doctor-detail-page__form-actions">
            <Button variant="secondary" onClick={() => goBack(navigate)} disabled={saving}>Hủy</Button>
            <Button onClick={handleCreate} disabled={saving}>Tạo bác sĩ</Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Render: Loading ────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="dash-page doctor-detail-page">
        <LoadingSpinner />
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="dash-page doctor-detail-page">
        <div className="doctor-detail-page__back">
          <button className="doctor-detail-page__back-btn" type="button" onClick={() => goBack(navigate)}>
            <ArrowLeft className="mc-icon mc-icon--sm" />
            Quay lại danh mục
          </button>
        </div>
        <div className="doctor-detail-page__error">{error || "Không tìm thấy bác sĩ."}</div>
      </div>
    );
  }

  // ── Render: View mode ──────────────────────────────────────────────────
  if (!editMode) {
    const { full_name, phone, email, specialty_name, bio, is_active, linked_user, stats } = profile;

    return (
      <div className="dash-page doctor-detail-page">
        <div className="doctor-detail-page__back">
          <button className="doctor-detail-page__back-btn" type="button" onClick={() => goBack(navigate)}>
            <ArrowLeft className="mc-icon mc-icon--sm" />
            Quay lại danh mục
          </button>
        </div>

        {error && (
          <div className="doctor-detail-page__error-banner" role="alert">
            {error}
            <button type="button" className="doctor-detail-page__error-close" onClick={() => setError("")}>×</button>
          </div>
        )}

        <div className="doctor-detail-page__header">
          <div className="doctor-detail-page__avatar">
            <Stethoscope className="mc-icon mc-icon--lg" />
          </div>
          <div className="doctor-detail-page__header-info">
            <div className="doctor-detail-page__name-row">
              <h1 className="doctor-detail-page__name">{full_name}</h1>
              <Badge variant={is_active ? "success" : "neutral"}>
                {is_active ? "Hoạt động" : "Tạm ngưng"}
              </Badge>
            </div>
            <div className="doctor-detail-page__specialty">
              <UserRound className="mc-icon mc-icon--xs" />
              Chuyên khoa: {specialty_name || "—"}
            </div>
          </div>
          <div className="doctor-detail-page__header-actions">
            <TooltipIconBtn icon={Pencil} label="Sửa thông tin" onClick={startEdit} />
            <TooltipIconBtn
              icon={Trash2}
              label="Vô hiệu hóa"
              variant="danger"
              onClick={() => setDeleteModal({ open: true })}
            />
          </div>
        </div>

        <div className="dash-stats-row doctor-detail-page__stats">
          <div className="dash-stat-card">
            <div className="dash-stat-val">{stats.total_appointments}</div>
            <div className="dash-stat-label">Tổng lịch hẹn</div>
          </div>
          <div className="dash-stat-card">
            <div className="dash-stat-val">{stats.completed_appointments}</div>
            <div className="dash-stat-label">Đã hoàn thành</div>
          </div>
        </div>

        <div className="mc-surface doctor-detail-page__card">
          <div className="doctor-detail-page__section-title">Thông tin bác sĩ</div>
          <div className="doctor-detail-page__info-grid">
            <div className="doctor-detail-page__info-item">
              <span className="doctor-detail-page__info-label">Họ tên</span>
              <span className="doctor-detail-page__info-value">{full_name}</span>
            </div>
            <div className="doctor-detail-page__info-item">
              <span className="doctor-detail-page__info-label">Chuyên khoa</span>
              <span className="doctor-detail-page__info-value">{specialty_name || "—"}</span>
            </div>
            <div className="doctor-detail-page__info-item">
              <span className="doctor-detail-page__info-label">Số điện thoại</span>
              <span className="doctor-detail-page__info-value">{phone || "—"}</span>
            </div>
            <div className="doctor-detail-page__info-item">
              <span className="doctor-detail-page__info-label">Email</span>
              <span className="doctor-detail-page__info-value">{email || "—"}</span>
            </div>
            <div className="doctor-detail-page__info-item">
              <span className="doctor-detail-page__info-label">Giới thiệu</span>
              <span className="doctor-detail-page__info-value">{bio || "—"}</span>
            </div>
            <div className="doctor-detail-page__info-item doctor-detail-page__info-item--full">
              <span className="doctor-detail-page__info-label">Tài khoản đăng nhập</span>
              <span className="doctor-detail-page__info-value">
                {linked_user ? (
                  <Badge variant="success"><UserCheck className="mc-icon mc-icon--xs" style={{ marginRight: 4 }} />@{linked_user.username}</Badge>
                ) : (
                  <div className="doctor-detail-page__no-account">
                    <Badge variant="warning">Chưa có tài khoản</Badge>
                    <Button size="sm" variant="secondary" onClick={openAccountModal}>
                      <KeyRound className="mc-icon mc-icon--xs" style={{ marginRight: 4 }} />
                      Tạo tài khoản
                    </Button>
                  </div>
                )}
              </span>
            </div>
          </div>
        </div>

        <Modal
          open={accountModal}
          title="Tạo tài khoản cho bác sĩ"
          onClose={() => setAccountModal(false)}
          footer={
            <>
              <Button variant="secondary" size="sm" onClick={() => setAccountModal(false)} disabled={saving}>Hủy</Button>
              <Button size="sm" onClick={handleCreateAccount} disabled={saving}>Tạo tài khoản</Button>
            </>
          }
        >
          <div className="doctor-detail-page__account-form">
            <p className="doctor-detail-page__account-hint">
              Tạo tài khoản đăng nhập cho bác sĩ "{profile?.full_name}".
            </p>
            {accountError && (
              <div className="doctor-detail-page__account-error">{accountError}</div>
            )}
            <Input
              label="Tên đăng nhập"
              value={accountForm.username}
              onChange={(e) => setAccountForm((f) => ({ ...f, username: e.target.value }))}
              placeholder="VD: bs.nguyenx"
            />
            <Input
              label="Mật khẩu"
              type="password"
              value={accountForm.password}
              onChange={(e) => setAccountForm((f) => ({ ...f, password: e.target.value }))}
              placeholder="Ít nhất 6 ký tự"
            />
          </div>
        </Modal>

        <ConfirmModal
          open={deleteModal.open}
          title="Vô hiệu hóa bác sĩ?"
          body={`Bác sĩ "${full_name}" sẽ bị tạm ngưng. Bác sĩ sẽ không nhận lịch hẹn mới. Bạn có thể kích hoạt lại sau.`}
          confirmLabel="Vô hiệu hóa"
          confirmVariant="danger"
          saving={saving}
          onConfirm={handleDelete}
          onCancel={() => setDeleteModal({ open: false })}
        />
      </div>
    );
  }

  // ── Render: Edit mode ──────────────────────────────────────────────────
  return (
    <div className="dash-page doctor-detail-page">
      <div className="doctor-detail-page__back">
        <button className="doctor-detail-page__back-btn" type="button" onClick={cancelEdit}>
          <ArrowLeft className="mc-icon mc-icon--sm" />
          Quay lại hồ sơ
        </button>
      </div>

      {error && (
        <div className="doctor-detail-page__error-banner" role="alert">
          {error}
          <button type="button" className="doctor-detail-page__error-close" onClick={() => setError("")}>×</button>
        </div>
      )}

      <div className="doctor-detail-page__header">
        <div className="doctor-detail-page__avatar">
          <Pencil className="mc-icon mc-icon--lg" />
        </div>
        <div>
          <h1 className="doctor-detail-page__name">Sửa thông tin bác sĩ</h1>
          <p className="doctor-detail-page__specialty-sub">Cập nhật thông tin bác sĩ "{profile?.full_name}"</p>
        </div>
      </div>

      <div className="mc-surface doctor-detail-page__card">
        <div className="doctor-detail-page__section-title">Thông tin bác sĩ</div>
        <div className="doctor-detail-page__form-grid">
          <Input
            label="Họ tên bác sĩ"
            value={editForm.full_name}
            onChange={(e) => setEditForm((f) => ({ ...f, full_name: e.target.value }))}
          />
          <Input
            label="Số điện thoại"
            value={editForm.phone}
            onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
          />
          <Input
            label="Email"
            type="email"
            value={editForm.email}
            onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
          />
          <div className="doctor-detail-page__select-wrap">
            <span className="doctor-detail-page__select-label">Chuyên khoa *</span>
            <select
              className="dash-filter-select"
              value={editForm.specialty_id}
              onChange={(e) => setEditForm((f) => ({ ...f, specialty_id: e.target.value }))}
            >
              <option value="">— Chọn khoa —</option>
              {specialties.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <Input
            label="Giới thiệu"
            value={editForm.bio}
            onChange={(e) => setEditForm((f) => ({ ...f, bio: e.target.value }))}
          />
          <label className="doctor-detail-page__checkbox-label">
            <input
              type="checkbox"
              checked={editForm.is_active}
              onChange={(e) => setEditForm((f) => ({ ...f, is_active: e.target.checked }))}
            />
            Đang hoạt động
          </label>
        </div>
        <div className="doctor-detail-page__form-actions">
          <Button variant="secondary" onClick={cancelEdit} disabled={saving}>Hủy</Button>
          <Button onClick={handleSaveEdit} disabled={saving}>Lưu thay đổi</Button>
        </div>
      </div>
    </div>
  );
}

// ── Tiny icon button component ──────────────────────────────────────────────
function TooltipIconBtn({ icon: Icon, label, onClick, variant = "default" }) {
  return (
    <button
      type="button"
      className={`doctor-detail-page__icon-btn doctor-detail-page__icon-btn--${variant}`}
      onClick={onClick}
      title={label}
      aria-label={label}
    >
      <Icon className="doctor-detail-page__icon-btn-icon" />
    </button>
  );
}
