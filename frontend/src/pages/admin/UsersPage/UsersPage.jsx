import React, { useEffect, useState } from "react";
import { KeyRound, Mail, Phone, Trash2, UserRound } from "lucide-react";
import Button from "../../../components/Button/Button";
import LoadingSpinner from "../../../components/LoadingSpinner/LoadingSpinner";
import Modal from "../../../components/Modal/Modal";
import {
  deletePatientProfile,
  listPatientProfiles,
  resetPatientPassword,
} from "../../../services/adminApi";
import "./UsersPage.css";

function stripHtml(raw) {
  if (typeof raw !== "string") return "";
  return raw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() || "Đã xảy ra lỗi.";
}

// ── Icon button ──────────────────────────────────────────────────────────────
function IconBtn({ icon: Icon, label, onClick, variant = "default", disabled = false }) {
  return (
    <button
      type="button"
      className={`users-page__icon-btn users-page__icon-btn--${variant}`}
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
    >
      <Icon className="users-page__icon-btn-icon" />
    </button>
  );
}

// ── Confirm modal ────────────────────────────────────────────────────────────
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

// ── Patient row ─────────────────────────────────────────────────────────────
function PatientRow({ item, saving, onDelete, onResetPassword }) {
  return (
    <div className="users-page__row">
      <div className="users-page__row-avatar">
        <UserRound className="mc-icon mc-icon--md" />
      </div>
      <div className="users-page__row-info">
        <div className="users-page__row-name">
          {item.full_name || "—"}
          {item.is_guest && (
            <span className="users-page__guest-badge">Khách vãng lai</span>
          )}
        </div>
        <div className="users-page__row-meta">
          {item.phone && (
            <span className="users-page__meta-item">
              <Phone size={12} />
              {item.phone}
            </span>
          )}
          {item.account_email && (
            <span className="users-page__meta-item">
              <Mail size={12} />
              {item.account_email}
            </span>
          )}
        </div>
        <div className="users-page__row-meta users-page__row-meta--account">
          Tài khoản: @{item.account_username}
        </div>
        {item.appointment_count > 0 && (
          <div className="users-page__row-meta users-page__row-meta--stats">
            <span className="users-page__stat-pill">
              {item.appointment_count} lịch hẹn
            </span>
            {item.completed_count > 0 && (
              <span className="users-page__stat-pill users-page__stat-pill--success">
                {item.completed_count} đã khám
              </span>
            )}
          </div>
        )}
      </div>
      <div className="users-page__row-actions">
        <IconBtn
          icon={KeyRound}
          label="Đặt lại mật khẩu"
          onClick={() => onResetPassword(item)}
          disabled={saving}
        />
        <IconBtn
          icon={Trash2}
          label="Xóa tài khoản"
          variant="danger"
          onClick={() => onDelete(item)}
          disabled={saving}
        />
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function UsersPage() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  // Delete confirm modal
  const [deleteModal, setDeleteModal] = useState({ open: false, item: null });

  // Reset password modal
  const [resetPwModal, setResetPwModal] = useState({ open: false, item: null });
  const [resetPwForm, setResetPwForm] = useState({ new_password: "", confirm_password: "" });
  const [resetPwError, setResetPwError] = useState("");

  // ── Load ─────────────────────────────────────────────────────────────────
  async function loadPatients() {
    setLoading(true);
    setError("");
    try {
      const data = await listPatientProfiles();
      setPatients(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(stripHtml(err.message) || "Không tải được danh sách bệnh nhân.");
      setPatients([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPatients();
  }, []);

  // ── Derived ──────────────────────────────────────────────────────────────
  const filteredPatients = patients.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (p.full_name || "").toLowerCase().includes(q) ||
      (p.phone || "").toLowerCase().includes(q) ||
      (p.account_email || "").toLowerCase().includes(q) ||
      (p.account_username || "").toLowerCase().includes(q)
    );
  });

  // ── Delete ───────────────────────────────────────────────────────────────
  async function handleDelete() {
    if (!deleteModal.item) return;
    setSaving(true);
    setError("");
    try {
      await deletePatientProfile(deleteModal.item.id);
      setDeleteModal({ open: false, item: null });
      await loadPatients();
    } catch (err) {
      setError(stripHtml(err.message) || "Không xóa được bệnh nhân.");
    } finally {
      setSaving(false);
    }
  }

  // ── Reset password ───────────────────────────────────────────────────────
  function openResetPw(item) {
    setResetPwForm({ new_password: "", confirm_password: "" });
    setResetPwError("");
    setResetPwModal({ open: true, item });
  }

  function closeResetPw() {
    setResetPwModal({ open: false, item: null });
    setResetPwForm({ new_password: "", confirm_password: "" });
    setResetPwError("");
  }

  async function handleResetPassword() {
    const { new_password, confirm_password } = resetPwForm;
    if (!new_password || new_password.length < 6) {
      setResetPwError("Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }
    if (new_password !== confirm_password) {
      setResetPwError("Mật khẩu mới và xác nhận không khớp.");
      return;
    }
    setSaving(true);
    setResetPwError("");
    try {
      await resetPatientPassword(resetPwModal.item.id, { new_password });
      closeResetPw();
    } catch (err) {
      setResetPwError(err.message || "Không đặt lại được mật khẩu.");
    } finally {
      setSaving(false);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="dash-page users-page">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="dash-page users-page">
      <div className="dash-page-header">
        <div>
          <h1 className="dash-page-title">Quản lý tài khoản bệnh nhân</h1>
          <p className="dash-page-sub">Xem, xóa và đặt lại mật khẩu tài khoản đăng nhập của bệnh nhân.</p>
        </div>
      </div>

      {error && (
        <div className="users-page__error" role="alert">
          {error}
          <button type="button" className="users-page__error-close" onClick={() => setError("")}>
            ×
          </button>
        </div>
      )}

      {/* ─── Filter bar ─── */}
      <div className="dash-filter-bar">
        <input
          className="dash-search-input"
          placeholder="Tìm tên, SĐT, email, tài khoản..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <span className="users-page__count-badge">
          {filteredPatients.length} bệnh nhân
        </span>
      </div>

      {/* ─── Patient list ─── */}
      {filteredPatients.length === 0 ? (
        <div className="users-page__empty">Không có bệnh nhân nào.</div>
      ) : (
        <div className="users-page__list">
          {filteredPatients.map((p) => (
            <PatientRow
              key={p.id}
              item={p}
              saving={saving}
              onDelete={(item) => setDeleteModal({ open: true, item })}
              onResetPassword={openResetPw}
            />
          ))}
        </div>
      )}

      {/* ─── Delete confirm modal ─── */}
      <ConfirmModal
        open={deleteModal.open}
        title="Xóa tài khoản bệnh nhân?"
        body={
          deleteModal.item
            ? `Tài khoản của "${deleteModal.item.full_name}" (@${deleteModal.item.account_username}) sẽ bị xóa vĩnh viễn. Hành động này không thể hoàn tác. Bạn chắc chắn?`
            : ""
        }
        confirmLabel="Xóa"
        confirmVariant="danger"
        saving={saving}
        onConfirm={handleDelete}
        onCancel={() => setDeleteModal({ open: false, item: null })}
      />

      {/* ─── Reset password modal ─── */}
      <Modal
        open={resetPwModal.open}
        title="Đặt lại mật khẩu"
        description={
          resetPwModal.item
            ? `${resetPwModal.item.full_name} (@${resetPwModal.item.account_username})`
            : ""
        }
        onClose={closeResetPw}
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={closeResetPw} disabled={saving}>Hủy</Button>
            <Button size="sm" onClick={handleResetPassword} disabled={saving}>Xác nhận</Button>
          </>
        }
      >
        <div className="users-page__modal-form">
          {resetPwError && (
            <div className="users-page__modal-error">{resetPwError}</div>
          )}
          <label className="users-page__field">
            <span className="users-page__field-label">Mật khẩu mới</span>
            <input
              type="password"
              className="users-page__input"
              value={resetPwForm.new_password}
              onChange={(e) => setResetPwForm((f) => ({ ...f, new_password: e.target.value }))}
              placeholder="Ít nhất 6 ký tự"
              autoComplete="new-password"
            />
          </label>
          <label className="users-page__field">
            <span className="users-page__field-label">Xác nhận mật khẩu mới</span>
            <input
              type="password"
              className="users-page__input"
              value={resetPwForm.confirm_password}
              onChange={(e) => setResetPwForm((f) => ({ ...f, confirm_password: e.target.value }))}
              placeholder="Nhập lại mật khẩu mới"
              autoComplete="new-password"
            />
          </label>
        </div>
      </Modal>
    </div>
  );
}
