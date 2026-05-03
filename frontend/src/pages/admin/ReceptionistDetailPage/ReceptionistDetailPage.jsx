import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  KeyRound,
  Pencil,
  Trash2,
  UsersRound,
} from "lucide-react";
import Badge from "../../../components/Badge/Badge";
import Button from "../../../components/Button/Button";
import Input from "../../../components/Input/Input";
import LoadingSpinner from "../../../components/LoadingSpinner/LoadingSpinner";
import Modal from "../../../components/Modal/Modal";
import Toast from "../../../components/Toast/Toast";
import {
  createReceptionistProfile,
  deleteReceptionistProfile,
  getReceptionistProfile,
  resetReceptionistPassword,
  updateReceptionistProfile,
} from "../../../services/adminApi";
import "./ReceptionistDetailPage.css";

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

function TooltipIconBtn({ icon: Icon, label, onClick, variant = "default" }) {
  return (
    <button
      type="button"
      className={`receptionist-detail-page__icon-btn receptionist-detail-page__icon-btn--${variant}`}
      onClick={onClick}
      title={label}
      aria-label={label}
    >
      <Icon className="receptionist-detail-page__icon-btn-icon" />
    </button>
  );
}

function goBack(navigate) {
  if (window.history.length > 1) {
    window.history.back();
  } else {
    navigate("/app/admin/catalog");
  }
}

export default function ReceptionistDetailPage() {
  const pathParts = window.location.pathname.split("/").filter(Boolean);
  const lastSegment = pathParts[pathParts.length - 1];
  const isCreateMode = lastSegment === "create";
  const receptionistId = isCreateMode ? null : Number(lastSegment);

  const navigate = useNavigate();

  // ── State ──────────────────────────────────────────────────────────────
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Create mode form
  const [form, setForm] = useState({
    full_name: "", username: "", password: "", email: "", phone: "", notes: "", is_active: true,
  });

  // View/edit state
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [saving, setSaving] = useState(false);

  // Delete confirm
  const [deleteModal, setDeleteModal] = useState({ open: false });

  // Reset password
  const [resetPwModal, setResetPwModal] = useState(false);
  const [resetPwForm, setResetPwForm] = useState({ password: "" });
  const [resetPwError, setResetPwError] = useState("");

  // Toast
  const [toast, setToast] = useState(null);
  function showToast(message, variant = "success") {
    setToast({ message, variant });
    setTimeout(() => setToast(null), 2500);
  }

  // ── Load profile ───────────────────────────────────────────────────────
  async function loadProfile() {
    setLoading(true);
    setError("");
    try {
      const data = await getReceptionistProfile(receptionistId);
      setProfile(data);
    } catch (err) {
      setError(stripHtml(err.message) || "Không tải được thông tin lễ tân.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!isCreateMode) {
      loadProfile();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Create ─────────────────────────────────────────────────────────────
  async function handleCreate() {
    const { full_name, username, password } = form;
    if (!full_name.trim()) { setError("Họ tên là bắt buộc."); return; }
    if (!username.trim()) { setError("Tên đăng nhập là bắt buộc."); return; }
    if (!password || password.length < 6) { setError("Mật khẩu phải ít nhất 6 ký tự."); return; }
    setSaving(true);
    setError("");
    try {
      await createReceptionistProfile({
        username: username.trim(),
        password,
        full_name: full_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        notes: form.notes.trim(),
        is_active: form.is_active,
      });
      showToast(`Đã thêm lễ tân "${full_name.trim()}" thành công.`);
      setTimeout(() => navigate("/app/admin/catalog?tab=receptionists"), 1200);
    } catch (err) {
      setError(stripHtml(err.message) || "Không tạo được lễ tân.");
      setSaving(false);
    }
  }

  // ── Start edit ─────────────────────────────────────────────────────────
  function startEdit() {
    if (!profile) return;
    setEditForm({
      full_name: profile.full_name || "",
      email: profile.email || "",
      phone: profile.phone || "",
      notes: profile.notes || "",
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
    if (!editForm.full_name?.trim()) { setError("Họ tên là bắt buộc."); return; }
    setSaving(true);
    setError("");
    try {
      await updateReceptionistProfile(profile.id, {
        full_name: editForm.full_name.trim(),
        email: (editForm.email || "").trim(),
        phone: (editForm.phone || "").trim(),
        notes: (editForm.notes || "").trim(),
        is_active: Boolean(editForm.is_active),
      });
      setEditMode(false);
      setEditForm(null);
      await loadProfile();
    } catch (err) {
      setError(stripHtml(err.message) || "Không lưu được thông tin lễ tân.");
      setSaving(false);
    }
  }

  // ── Delete ─────────────────────────────────────────────────────────────
  async function handleDelete() {
    if (!profile) return;
    setSaving(true);
    setError("");
    try {
      await deleteReceptionistProfile(profile.id);
      navigate("/app/admin/catalog");
    } catch (err) {
      setError(stripHtml(err.message) || "Không xóa được lễ tân.");
      setSaving(false);
    }
  }

  // ── Reset password ─────────────────────────────────────────────────────
  async function handleResetPassword() {
    const { password } = resetPwForm;
    if (!password || password.length < 6) { setResetPwError("Mật khẩu mới phải ít nhất 6 ký tự."); return; }
    setSaving(true);
    setResetPwError("");
    try {
      await resetReceptionistPassword(profile.id, { new_password: password });
      setResetPwModal(false);
      setResetPwForm({ password: "" });
    } catch (err) {
      setResetPwError(err.message || "Không đặt lại được mật khẩu.");
    } finally {
      setSaving(false);
    }
  }

  // ── Render: Create Mode ─────────────────────────────────────────────────
  if (isCreateMode) {
    if (loading) {
      return (
        <div className="dash-page receptionist-detail-page">
          <LoadingSpinner />
        </div>
      );
    }

    return (
      <div className="dash-page receptionist-detail-page">
        <Toast message={toast?.message} variant={toast?.variant} />
        <div className="receptionist-detail-page__back">
          <button className="receptionist-detail-page__back-btn" type="button" onClick={() => goBack(navigate)}>
            <ArrowLeft className="mc-icon mc-icon--sm" />
            Quay lại danh mục
          </button>
        </div>

        <div className="receptionist-detail-page__header">
          <div className="receptionist-detail-page__avatar">
            <UsersRound className="mc-icon mc-icon--lg" />
          </div>
          <div>
            <h1 className="receptionist-detail-page__name">Thêm lễ tân mới</h1>
            <p className="receptionist-detail-page__subtitle">Điền thông tin lễ tân vào biểu mẫu bên dưới</p>
          </div>
        </div>

        {error && (
          <div className="receptionist-detail-page__error-banner" role="alert">
            {error}
            <button type="button" className="receptionist-detail-page__error-close" onClick={() => setError("")}>×</button>
          </div>
        )}

        <div className="mc-surface receptionist-detail-page__card">
          <div className="receptionist-detail-page__section-title">Thông tin lễ tân</div>
          <div className="receptionist-detail-page__form-grid">
            <Input
              label="Họ tên"
              value={form.full_name}
              onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
              placeholder="VD: Nguyễn Thị A"
            />
            <Input
              label="Tên đăng nhập"
              value={form.username}
              onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
              placeholder="VD: lethi_a"
            />
            <Input
              label="Mật khẩu"
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              placeholder="Ít nhất 6 ký tự"
            />
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="VD: letan@clinic.com"
            />
            <Input
              label="Số điện thoại"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="0912 345 678"
            />
            <Input
              label="Ghi chú"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Ghi chú (không bắt buộc)"
            />
            <label className="receptionist-detail-page__checkbox-label">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
              />
              Đang hoạt động
            </label>
          </div>
          <div className="receptionist-detail-page__form-actions">
            <Button variant="secondary" onClick={() => goBack(navigate)} disabled={saving}>Hủy</Button>
            <Button onClick={handleCreate} disabled={saving}>Tạo lễ tân</Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Render: Loading ────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="dash-page receptionist-detail-page">
        <LoadingSpinner />
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="dash-page receptionist-detail-page">
        <div className="receptionist-detail-page__back">
          <button className="receptionist-detail-page__back-btn" type="button" onClick={() => goBack(navigate)}>
            <ArrowLeft className="mc-icon mc-icon--sm" />
            Quay lại danh mục
          </button>
        </div>
        <div className="receptionist-detail-page__error">{error || "Không tìm thấy lễ tân."}</div>
      </div>
    );
  }

  // ── Render: View mode ──────────────────────────────────────────────────
  if (!editMode) {
    if (!profile) {
      return (
        <div className="dash-page receptionist-detail-page">
          <div className="receptionist-detail-page__back">
            <button className="receptionist-detail-page__back-btn" type="button" onClick={() => goBack(navigate)}>
              <ArrowLeft className="mc-icon mc-icon--sm" />
              Quay lại danh mục
            </button>
          </div>
          <div className="receptionist-detail-page__error">
            {error || "Không tìm thấy lễ tân."}
          </div>
        </div>
      );
    }
    const { full_name, username, email, phone, notes, is_active } = profile;

    return (
      <div className="dash-page receptionist-detail-page">
        <div className="receptionist-detail-page__back">
          <button className="receptionist-detail-page__back-btn" type="button" onClick={() => goBack(navigate)}>
            <ArrowLeft className="mc-icon mc-icon--sm" />
            Quay lại danh mục
          </button>
        </div>

        {error && (
          <div className="receptionist-detail-page__error-banner" role="alert">
            {error}
            <button type="button" className="receptionist-detail-page__error-close" onClick={() => setError("")}>×</button>
          </div>
        )}

        <div className="receptionist-detail-page__header">
          <div className="receptionist-detail-page__avatar">
            <UsersRound className="mc-icon mc-icon--lg" />
          </div>
          <div className="receptionist-detail-page__header-info">
            <div className="receptionist-detail-page__name-row">
              <h1 className="receptionist-detail-page__name">{full_name}</h1>
              <Badge variant={is_active ? "success" : "neutral"}>
                {is_active ? "Hoạt động" : "Tạm ngưng"}
              </Badge>
            </div>
            <div className="receptionist-detail-page__account-label">
              <KeyRound className="mc-icon mc-icon--xs" style={{ marginRight: 4 }} />
              @{username}
            </div>
          </div>
          <div className="receptionist-detail-page__header-actions">
            <TooltipIconBtn icon={Pencil} label="Sửa thông tin" onClick={startEdit} />
            <TooltipIconBtn
              icon={Trash2}
              label="Xóa lễ tân"
              variant="danger"
              onClick={() => setDeleteModal({ open: true })}
            />
          </div>
        </div>

        <div className="mc-surface receptionist-detail-page__card">
          <div className="receptionist-detail-page__section-title">Thông tin lễ tân</div>
          <div className="receptionist-detail-page__info-grid">
            <div className="receptionist-detail-page__info-item">
              <span className="receptionist-detail-page__info-label">Họ tên</span>
              <span className="receptionist-detail-page__info-value">{full_name}</span>
            </div>
            <div className="receptionist-detail-page__info-item">
              <span className="receptionist-detail-page__info-label">Tài khoản</span>
              <span className="receptionist-detail-page__info-value">@{username}</span>
            </div>
            <div className="receptionist-detail-page__info-item">
              <span className="receptionist-detail-page__info-label">Email</span>
              <span className="receptionist-detail-page__info-value">{email || "—"}</span>
            </div>
            <div className="receptionist-detail-page__info-item">
              <span className="receptionist-detail-page__info-label">Số điện thoại</span>
              <span className="receptionist-detail-page__info-value">{phone || "—"}</span>
            </div>
            <div className="receptionist-detail-page__info-item receptionist-detail-page__info-item--full">
              <span className="receptionist-detail-page__info-label">Ghi chú</span>
              <span className="receptionist-detail-page__info-value">{notes || "—"}</span>
            </div>
          </div>
        </div>

        <div className="receptionist-detail-page__action-footer">
          <Button size="sm" variant="secondary" onClick={() => setResetPwModal(true)}>
            <KeyRound className="mc-icon mc-icon--xs" style={{ marginRight: 4 }} />
            Đặt lại mật khẩu
          </Button>
        </div>

        {/* Reset Password Modal */}
        <Modal
          open={resetPwModal}
          title="Đặt lại mật khẩu"
          onClose={() => { setResetPwModal(false); setResetPwError(""); }}
          footer={
            <>
              <Button variant="secondary" size="sm" onClick={() => { setResetPwModal(false); setResetPwError(""); }} disabled={saving}>Hủy</Button>
              <Button size="sm" onClick={handleResetPassword} disabled={saving}>Đặt lại</Button>
            </>
          }
        >
          <div className="receptionist-detail-page__reset-form">
            <p className="receptionist-detail-page__reset-hint">
              Đặt lại mật khẩu cho @{username}.
            </p>
            {resetPwError && (
              <div className="receptionist-detail-page__reset-error">{resetPwError}</div>
            )}
            <Input
              label="Mật khẩu mới"
              type="password"
              value={resetPwForm.password}
              onChange={(e) => setResetPwForm({ password: e.target.value })}
              placeholder="Ít nhất 6 ký tự"
            />
          </div>
        </Modal>

        <ConfirmModal
          open={deleteModal.open}
          title="Xóa lễ tân?"
          body={`Lễ tân "${full_name}" sẽ bị xóa vĩnh viễn. Hành động này không thể hoàn tác. Bạn chắc chắn?`}
          confirmLabel="Xóa"
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
    <div className="dash-page receptionist-detail-page">
      <div className="receptionist-detail-page__back">
        <button className="receptionist-detail-page__back-btn" type="button" onClick={cancelEdit}>
          <ArrowLeft className="mc-icon mc-icon--sm" />
          Quay lại hồ sơ
        </button>
      </div>

      {error && (
        <div className="receptionist-detail-page__error-banner" role="alert">
          {error}
          <button type="button" className="receptionist-detail-page__error-close" onClick={() => setError("")}>×</button>
        </div>
      )}

      <div className="receptionist-detail-page__header">
        <div className="receptionist-detail-page__avatar">
          <Pencil className="mc-icon mc-icon--lg" />
        </div>
        <div>
          <h1 className="receptionist-detail-page__name">Sửa thông tin lễ tân</h1>
          <p className="receptionist-detail-page__subtitle">Cập nhật thông tin "{profile?.full_name}"</p>
        </div>
      </div>

      <div className="mc-surface receptionist-detail-page__card">
        <div className="receptionist-detail-page__section-title">Thông tin lễ tân</div>
        <div className="receptionist-detail-page__form-grid">
          <Input
            label="Họ tên"
            value={editForm.full_name}
            onChange={(e) => setEditForm((f) => ({ ...f, full_name: e.target.value }))}
          />
          <Input
            label="Email"
            type="email"
            value={editForm.email}
            onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
          />
          <Input
            label="Số điện thoại"
            value={editForm.phone}
            onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
          />
          <Input
            label="Ghi chú"
            value={editForm.notes}
            onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
          />
          <label className="receptionist-detail-page__checkbox-label">
            <input
              type="checkbox"
              checked={editForm.is_active}
              onChange={(e) => setEditForm((f) => ({ ...f, is_active: e.target.checked }))}
            />
            Đang hoạt động
          </label>
        </div>
        <div className="receptionist-detail-page__form-actions">
          <Button variant="secondary" onClick={cancelEdit} disabled={saving}>Hủy</Button>
          <Button onClick={handleSaveEdit} disabled={saving}>Lưu thay đổi</Button>
        </div>
      </div>
    </div>
  );
}
