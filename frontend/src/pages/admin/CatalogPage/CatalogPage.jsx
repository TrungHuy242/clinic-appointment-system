import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Baby,
  Building2,
  ClipboardList,
  HeartPulse,
  KeyRound,
  Pencil,
  Plus,
  PowerOff,
  Sparkles,
  Stethoscope,
  Timer,
  Trash2,
  UserCheck,
  UserRound,
  UsersRound,
} from "lucide-react";
import Badge from "../../../components/Badge/Badge";
import Button from "../../../components/Button/Button";
import Input from "../../../components/Input/Input";
import LoadingSpinner from "../../../components/LoadingSpinner/LoadingSpinner";
import Modal from "../../../components/Modal/Modal";
import {
  createSpecialty,
  createVisitType,
  deleteReceptionistProfile,
  deleteVisitType,
  hardDeleteDoctor,
  hardDeleteSpecialty,
  listDoctors,
  listReceptionistProfiles,
  listSpecialties,
  listVisitTypes,
  resetReceptionistPassword,
  resetUserPassword,
  updateDoctor,
  updateSpecialty,
  updateVisitType,
} from "../../../services/adminApi";
import "./CatalogPage.css";

function stripHtml(raw) {
  if (typeof raw !== "string") return "";
  return raw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() || "Đã xảy ra lỗi.";
}

const SPECIALTY_ICONS = {
  "Nhi khoa": Baby,
  "Da liễu": Sparkles,
  "Tai Mũi Họng": Stethoscope,
  "Khám tổng quát": HeartPulse,
};

function formatPrice(value) {
  if (!value && value !== 0) return "—";
  return new Intl.NumberFormat("vi-VN").format(value) + " đ";
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function IconBtn({ icon: Icon, label, onClick, variant = "default", disabled = false, className = "" }) {
  return (
    <button
      type="button"
      className={`cat-icon-btn cat-icon-btn--${variant} ${className}`}
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
    >
      <Icon className="cat-icon-btn__icon" />
    </button>
  );
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

// ── Specialty Card ───────────────────────────────────────────────────────────

function SpecialtyCard({ item, saving, onEdit, onDeactivate, onHardDelete }) {
  const SpecialtyIcon = SPECIALTY_ICONS[item.name] || Building2;
  const isActive = Boolean(item.is_active);
  return (
    <div className={`cat-card ${!isActive ? "cat-card--inactive" : ""}`}>
      <div className="cat-card__icon">
        <SpecialtyIcon className="mc-icon mc-icon--lg" />
      </div>
      <div className="cat-card__body">
        <div className="cat-card__name">{item.name}</div>
        {item.description && <div className="cat-card__desc">{item.description}</div>}
        <div className="cat-card__meta">
          {isActive
            ? `${item.doc_count || 0} bác sĩ đang hoạt động`
            : `Đã vô hiệu hóa · ${item.doc_count || 0} bác sĩ`}
        </div>
      </div>
      <Badge variant={isActive ? "success" : "neutral"}>{isActive ? "Hoạt động" : "Tạm ngưng"}</Badge>
      <div className="cat-card__actions">
        <IconBtn icon={Pencil} label="Sửa" onClick={() => onEdit(item)} disabled={saving} />
        {isActive ? (
          <IconBtn icon={PowerOff} label="Vô hiệu hóa" variant="warning" onClick={() => onDeactivate(item)} disabled={saving} />
        ) : (
          <IconBtn icon={Trash2} label="Xóa vĩnh viễn" variant="danger" onClick={() => onHardDelete(item)} disabled={saving} />
        )}
      </div>
    </div>
  );
}

// ── Doctor Card ──────────────────────────────────────────────────────────────

function DoctorCard({ item, saving, onDeactivate, onHardDelete, onResetPassword, navigate }) {
  const isActive = Boolean(item.is_active);
  return (
    <div className={`cat-card cat-card--doctor ${!isActive ? "cat-card--inactive" : ""}`}>
      <div className="cat-card__icon">
        <UserRound className="mc-icon mc-icon--lg" />
      </div>
      <div className="cat-card__body">
        <div className="cat-card__name">{item.full_name}</div>
        <div className="cat-card__meta">
          {item.specialty_name || "—"} · {item.phone || "Chưa có SĐT"}
        </div>
        {item.bio && <div className="cat-card__desc cat-card__desc--bio">{item.bio}</div>}
        <div className="cat-card__badges">
          <Badge variant={isActive ? "success" : "neutral"}>
            {isActive ? "Đang nhận lịch" : "Tạm ngưng"}
          </Badge>
          {item.has_account ? (
            <Badge variant="info"><UserCheck className="mc-icon mc-icon--xs" style={{ marginRight: 3 }} />@{item.linked_username}</Badge>
          ) : (
            <Badge variant="warning">Chưa có tài khoản</Badge>
          )}
        </div>
      </div>
      <div className="cat-card__actions">
        <IconBtn
          icon={Pencil}
          label="Sửa"
          onClick={() => { navigate(`/app/admin/catalog/doctors/${item.id}`); }}
          disabled={saving}
        />
        {item.has_account && (
          <IconBtn
            icon={KeyRound}
            label="Đặt lại mật khẩu"
            onClick={() => onResetPassword(item)}
            disabled={saving}
          />
        )}
        {isActive ? (
          <IconBtn
            icon={PowerOff}
            label="Vô hiệu hóa"
            variant="warning"
            onClick={() => onDeactivate(item)}
            disabled={saving}
          />
        ) : (
          <IconBtn
            icon={Trash2}
            label="Xóa vĩnh viễn"
            variant="danger"
            onClick={() => onHardDelete(item)}
            disabled={saving}
          />
        )}
      </div>
    </div>
  );
}

// ── VisitType Card ───────────────────────────────────────────────────────────

function VisitTypeCard({ item, saving, onEdit, onDeactivate, onHardDelete }) {
  const isActive = Boolean(item.is_active);
  return (
    <div className={`cat-card cat-card--visittype ${!isActive ? "cat-card--inactive" : ""}`}>
      <div className="cat-card__icon">
        <ClipboardList className="mc-icon mc-icon--md" />
      </div>
      <div className="cat-card__body">
        <div className="cat-card__name">{item.name}</div>
        <div className="cat-card__meta">
          <span className="cat-card__meta-item"><Timer className="mc-icon mc-icon--xs" />{item.duration_minutes} phút</span>
          <span className="cat-card__meta-item"><Building2 className="mc-icon mc-icon--xs" />{formatPrice(item.price)}</span>
        </div>
        {item.description && <div className="cat-card__desc">{item.description}</div>}
      </div>
      <Badge variant={isActive ? "success" : "neutral"}>{isActive ? "Hoạt động" : "Tạm ngưng"}</Badge>
      <div className="cat-card__actions">
        <IconBtn icon={Pencil} label="Sửa" onClick={() => onEdit(item)} disabled={saving} />
        {isActive ? (
          <IconBtn icon={PowerOff} label="Vô hiệu hóa" variant="warning" onClick={() => onDeactivate(item)} disabled={saving} />
        ) : (
          <IconBtn icon={Trash2} label="Xóa vĩnh viễn" variant="danger" onClick={() => onHardDelete(item)} disabled={saving} />
        )}
      </div>
    </div>
  );
}

// ── Receptionist Card ──────────────────────────────────────────────────────────

function ReceptionistCard({ item, saving, onDelete, onResetPassword, navigate }) {
  return (
    <div className={`cat-card cat-card--receptionist ${!item.is_active ? "cat-card--inactive" : ""}`}>
      <div className="cat-card__icon cat-card__icon--teal">
        <UsersRound className="mc-icon mc-icon--lg" />
      </div>
      <div className="cat-card__body">
        <div className="cat-card__name">{item.full_name}</div>
        <div className="cat-card__meta">
          {item.email || "—"} · {item.phone || "Chưa có SĐT"}
        </div>
        {item.notes && <div className="cat-card__desc cat-card__desc--bio">{item.notes}</div>}
        <div className="cat-card__badges">
          <Badge variant={item.is_active ? "success" : "neutral"}>{item.is_active ? "Hoạt động" : "Tạm ngưng"}</Badge>
          <Badge variant="info">@{item.username}</Badge>
        </div>
      </div>
      <div className="cat-card__actions">
        <IconBtn
          icon={Pencil}
          label="Sửa"
          onClick={() => { navigate(`/app/admin/catalog/receptionists/${item.id}`); }}
          disabled={saving}
        />
        <IconBtn
          icon={KeyRound}
          label="Đặt lại mật khẩu"
          onClick={() => onResetPassword(item)}
          disabled={saving}
        />
        <IconBtn
          icon={Trash2}
          label="Xóa"
          variant="danger"
          onClick={() => onDelete(item)}
          disabled={saving}
        />
      </div>
    </div>
  );
}

// ── Main CatalogPage ─────────────────────────────────────────────────────────

export default function CatalogPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const validTabs = ["specialties", "doctors", "visitTypes", "receptionists"];
  const initialTab = validTabs.includes(searchParams.get("tab")) ? searchParams.get("tab") : "specialties";
  const [activeTab, setActiveTab] = useState(initialTab);

  // ── Specialty ──────────────────────────────────────────────────────────────
  const [specialties, setSpecialties] = useState([]);
  const [specialtySearch, setSpecialtySearch] = useState("");
  const [specialtyModal, setSpecialtyModal] = useState({ open: false, item: null });

  // ── Doctor ─────────────────────────────────────────────────────────────────
  const [doctors, setDoctors] = useState([]);
  const [doctorSearch, setDoctorSearch] = useState("");
  const [resetPwModal, setResetPwModal] = useState({ open: false, item: null, type: null });
  const [resetPwForm, setResetPwForm] = useState({ new_password: "", confirm_password: "" });
  const [resetPwError, setResetPwError] = useState("");

  // ── VisitType ──────────────────────────────────────────────────────────────
  const [visitTypes, setVisitTypes] = useState([]);
  const [visitTypeSearch, setVisitTypeSearch] = useState("");
  const [visitTypeModal, setVisitTypeModal] = useState({ open: false, item: null });

  // ── Receptionist ────────────────────────────────────────────────────────────
  const [receptionists, setReceptionists] = useState([]);
  const [receptionistSearch, setReceptionistSearch] = useState("");

  // ── Shared ─────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ open: false, onConfirm: null });

  // ── Load ───────────────────────────────────────────────────────────────────
  async function loadCatalog() {
    setLoading(true);
    setError("");
    try {
      const [nextSpecialties, nextDoctors, nextVisitTypes, nextReceptionists] = await Promise.all([
        listSpecialties(),
        listDoctors(),
        listVisitTypes(),
        listReceptionistProfiles(),
      ]);
      setSpecialties(nextSpecialties);
      setDoctors(nextDoctors);
      setVisitTypes(nextVisitTypes);
      setReceptionists(nextReceptionists);
    } catch (err) {
      setError(stripHtml(err.message) || "Không tải được danh mục.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCatalog();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived ────────────────────────────────────────────────────────────────
  const filteredSpecialties = specialties.filter((s) =>
    s.name.toLowerCase().includes(specialtySearch.toLowerCase())
  );
  const filteredDoctors = doctors.filter(
    (d) =>
      d.full_name.toLowerCase().includes(doctorSearch.toLowerCase()) ||
      (d.specialty_name || "").toLowerCase().includes(doctorSearch.toLowerCase())
  );
  const filteredVisitTypes = visitTypes.filter((v) =>
    v.name.toLowerCase().includes(visitTypeSearch.toLowerCase())
  );
  const filteredReceptionists = receptionists.filter(
    (r) =>
      r.full_name.toLowerCase().includes(receptionistSearch.toLowerCase()) ||
      (r.username || "").toLowerCase().includes(receptionistSearch.toLowerCase())
  );

  const specialtiesWithCount = filteredSpecialties.map((s) => ({
    ...s,
    doc_count: doctors.filter((d) => d.specialty === s.id || d.specialty_name === s.name).length,
  }));

  // ── Specialty handlers ────────────────────────────────────────────────────
  async function handleSaveSpecialty() {
    const { id, name, description, is_active } = specialtyModal.item;
    if (!name?.trim()) { setError("Tên khoa là bắt buộc."); return; }
    setSaving(true);
    setError("");
    try {
      const payload = {
        name: name.trim(),
        description: (description || "").trim(),
        is_active: Boolean(is_active),
      };
      if (id) {
        await updateSpecialty(id, payload);
      } else {
        await createSpecialty(payload);
      }
      setSpecialtyModal({ open: false, item: null });
      await loadCatalog();
    } catch (err) {
      setError(stripHtml(err.message) || (id ? "Không sửa được khoa." : "Không tạo được khoa."));
    } finally {
      setSaving(false);
    }
  }

  // Vô hiệu hóa khoa (PATCH is_active=false)
  function handleDeactivateSpecialty(item) {
    setConfirmModal({
      open: true,
      title: "Vô hiệu hóa khoa?",
      body: `Khoa "${item.name}" sẽ bị tạm ngưng. Khoa sẽ không xuất hiện trong danh sách đặt lịch nhưng dữ liệu cũ vẫn được giữ. Bạn có thể kích hoạt lại sau.`,
      confirmLabel: "Vô hiệu hóa",
      confirmVariant: "danger",
      onConfirm: async () => {
        setConfirmModal({ open: false });
        setSaving(true);
        setError("");
        try {
          await updateSpecialty(item.id, { is_active: false });
          await loadCatalog();
        } catch (err) {
          setError(stripHtml(err.message) || "Không vô hiệu hóa được khoa.");
        } finally {
          setSaving(false);
        }
      },
    });
  }

  // Xóa vĩnh viễn khoa
  function handleHardDeleteSpecialty(item) {
    setConfirmModal({
      open: true,
      title: "Xóa vĩnh viễn khoa?",
      body: `Khoa "${item.name}" sẽ bị xóa vĩnh viễn khỏi hệ thống. Hành động này không thể hoàn tác. Bạn chắc chắn muốn xóa?`,
      confirmLabel: "Xóa vĩnh viễn",
      confirmVariant: "danger",
      onConfirm: async () => {
        setConfirmModal({ open: false });
        setSaving(true);
        setError("");
        try {
          await hardDeleteSpecialty(item.id);
          await loadCatalog();
        } catch (err) {
          setError(stripHtml(err.message) || "Không xóa được khoa.");
        } finally {
          setSaving(false);
        }
      },
    });
  }

  // ── Doctor handlers ───────────────────────────────────────────────────────
  // Vô hiệu hóa bác sĩ (PATCH is_active=false)
  function handleDeactivateDoctor(item) {
    setConfirmModal({
      open: true,
      title: "Vô hiệu hóa bác sĩ?",
      body: `Bác sĩ "${item.full_name}" sẽ bị tạm ngưng. Bác sĩ sẽ không nhận lịch hẹn mới nhưng dữ liệu cũ (lịch hẹn, hồ sơ khám) vẫn được giữ nguyên. Bạn có thể kích hoạt lại sau.`,
      confirmLabel: "Vô hiệu hóa",
      confirmVariant: "danger",
      onConfirm: async () => {
        setConfirmModal({ open: false });
        setSaving(true);
        setError("");
        try {
          await updateDoctor(item.id, { is_active: false });
          await loadCatalog();
        } catch (err) {
          setError(stripHtml(err.message) || "Không vô hiệu hóa được bác sĩ.");
        } finally {
          setSaving(false);
        }
      },
    });
  }

  // Xóa vĩnh viễn bác sĩ
  function handleHardDeleteDoctor(item) {
    setConfirmModal({
      open: true,
      title: "Xóa vĩnh viễn bác sĩ?",
      body: `Bác sĩ "${item.full_name}" sẽ bị xóa vĩnh viễn khỏi hệ thống. Hành động này không thể hoàn tác. Bạn chắc chắn muốn xóa?`,
      confirmLabel: "Xóa vĩnh viễn",
      confirmVariant: "danger",
      onConfirm: async () => {
        setConfirmModal({ open: false });
        setSaving(true);
        setError("");
        try {
          await hardDeleteDoctor(item.id);
          await loadCatalog();
        } catch (err) {
          setError(stripHtml(err.message) || "Không xóa được bác sĩ.");
        } finally {
          setSaving(false);
        }
      },
    });
  }

  // ── VisitType handlers ────────────────────────────────────────────────────
  async function handleSaveVisitType() {
    const { id, name, duration_minutes, price, description, is_active } = visitTypeModal.item;
    if (!name?.trim()) { setError("Tên loại khám là bắt buộc."); return; }
    setSaving(true);
    setError("");
    try {
      const payload = {
        name: name.trim(),
        duration_minutes: Number(duration_minutes) || 25,
        price: Number(price) || 0,
        description: (description || "").trim(),
        is_active: Boolean(is_active),
      };
      if (id) {
        await updateVisitType(id, payload);
      } else {
        await createVisitType(payload);
      }
      setVisitTypeModal({ open: false, item: null });
      await loadCatalog();
    } catch (err) {
      setError(stripHtml(err.message) || (id ? "Không sửa được loại khám." : "Không tạo được loại khám."));
    } finally {
      setSaving(false);
    }
  }

  function handleDeactivateVisitType(item) {
    setConfirmModal({
      open: true,
      title: "Vô hiệu hóa loại khám?",
      body: `Loại khám "${item.name}" sẽ bị tạm ngưng. Bạn có thể kích hoạt lại sau.`,
      confirmLabel: "Vô hiệu hóa",
      confirmVariant: "danger",
      onConfirm: async () => {
        setConfirmModal({ open: false });
        setSaving(true);
        setError("");
        try {
          await updateVisitType(item.id, { is_active: false });
          await loadCatalog();
        } catch (err) {
          setError(stripHtml(err.message) || "Không vô hiệu hóa được loại khám.");
        } finally {
          setSaving(false);
        }
      },
    });
  }

  function handleHardDeleteVisitType(item) {
    setConfirmModal({
      open: true,
      title: "Xóa vĩnh viễn loại khám?",
      body: `Loại khám "${item.name}" sẽ bị xóa vĩnh viễn. Hành động này không thể hoàn tác. Bạn chắc chắn muốn xóa?`,
      confirmLabel: "Xóa vĩnh viễn",
      confirmVariant: "danger",
      onConfirm: async () => {
        setConfirmModal({ open: false });
        setSaving(true);
        setError("");
        try {
          await deleteVisitType(item.id);
          await loadCatalog();
        } catch (err) {
          setError(stripHtml(err.message) || "Không xóa được loại khám.");
        } finally {
          setSaving(false);
        }
      },
    });
  }

  // ── Receptionist handlers ─────────────────────────────────────────────────
  function handleDeleteReceptionist(item) {
    setConfirmModal({
      open: true,
      title: "Xóa lễ tân?",
      body: `Lễ tân "${item.full_name}" (@${item.username}) sẽ bị xóa vĩnh viễn. Hành động này không thể hoàn tác. Bạn chắc chắn?`,
      confirmLabel: "Xóa",
      confirmVariant: "danger",
      onConfirm: async () => {
        setConfirmModal({ open: false });
        setSaving(true);
        setError("");
        try {
          await deleteReceptionistProfile(item.id);
          await loadCatalog();
        } catch (err) {
          setError(stripHtml(err.message) || "Không xóa được lễ tân.");
        } finally {
          setSaving(false);
        }
      },
    });
  }

  // ── Reset password (shared) ───────────────────────────────────────────────
  function openResetPw(item, type) {
    setResetPwForm({ new_password: "", confirm_password: "" });
    setResetPwError("");
    setResetPwModal({ open: true, item, type });
  }

  function closeResetPw() {
    setResetPwModal({ open: false, item: null, type: null });
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
      const { item, type } = resetPwModal;
      if (type === "doctor") {
        await resetUserPassword(item.linked_user_id, { new_password });
      } else if (type === "receptionist") {
        await resetReceptionistPassword(item.id, { new_password });
      }
      closeResetPw();
    } catch (err) {
      setResetPwError(err.message || "Không đặt lại được mật khẩu.");
    } finally {
      setSaving(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="dash-page catalog-page">
        <LoadingSpinner />
      </div>
    );
  }

  const TABS = [
    { key: "specialties", label: "Khoa", count: specialties.length },
    { key: "doctors", label: "Bác sĩ", count: doctors.length },
    { key: "visitTypes", label: "Loại khám", count: visitTypes.length },
    { key: "receptionists", label: "Lễ tân", count: receptionists.length },
  ];

  return (
    <div className="dash-page catalog-page">
      <div className="dash-page-header">
        <div>
          <h1 className="dash-page-title">Danh mục hệ thống</h1>
          <p className="dash-page-sub">Quản lý khoa, bác sĩ, loại khám và lễ tân</p>
        </div>
      </div>

      {error && (
        <div className="cat-error" role="alert">
          {error}
          <button type="button" className="cat-error__close" onClick={() => setError("")}>×</button>
        </div>
      )}

      <div className="dash-filter-tabs catalog-page__tabs">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`dash-filter-tab ${activeTab === tab.key ? "active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
            type="button"
          >
            {tab.label}
            <span className="catalog-page__tab-count">{tab.count}</span>
          </button>
        ))}
      </div>

      {/* ─── SPECIALTY TAB ─── */}
      {activeTab === "specialties" && (
        <div>
          <div className="dash-filter-bar">
            <input
              className="dash-search-input"
              placeholder="Tìm khoa..."
              value={specialtySearch}
              onChange={(e) => setSpecialtySearch(e.target.value)}
            />
            <Button size="sm" onClick={() => setSpecialtyModal({ open: true, item: { name: "", description: "", is_active: true } })}>
              <Plus className="mc-icon mc-icon--xs" style={{ marginRight: 4 }} />
              Thêm khoa
            </Button>
          </div>
          {specialtiesWithCount.length === 0 ? (
            <div className="cat-empty">Không có khoa nào.</div>
          ) : (
            <div className="cat-list">
              {specialtiesWithCount.map((s) => (
                <SpecialtyCard
                  key={s.id}
                  item={s}
                  saving={saving}
                  onEdit={(item) => setSpecialtyModal({ open: true, item: { ...item } })}
                  onDeactivate={handleDeactivateSpecialty}
                  onHardDelete={handleHardDeleteSpecialty}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── DOCTOR TAB ─── */}
      {activeTab === "doctors" && (
        <div>
          <div className="dash-filter-bar">
            <input
              className="dash-search-input"
              placeholder="Tìm bác sĩ, khoa..."
              value={doctorSearch}
              onChange={(e) => setDoctorSearch(e.target.value)}
            />
            <Button size="sm" onClick={() => { navigate("/app/admin/catalog/doctors/create"); }}>
              <Plus className="mc-icon mc-icon--xs" style={{ marginRight: 4 }} />
              Thêm bác sĩ
            </Button>
          </div>
          {filteredDoctors.length === 0 ? (
            <div className="cat-empty">Không có bác sĩ nào.</div>
          ) : (
            <div className="cat-list">
              {filteredDoctors.map((d) => (
                <DoctorCard
                  key={d.id}
                  item={d}
                  saving={saving}
                  onDeactivate={handleDeactivateDoctor}
                  onHardDelete={handleHardDeleteDoctor}
                  onResetPassword={(item) => openResetPw(item, "doctor")}
                  navigate={navigate}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── VISIT TYPE TAB ─── */}
      {activeTab === "visitTypes" && (
        <div>
          <div className="dash-filter-bar">
            <input
              className="dash-search-input"
              placeholder="Tìm loại khám..."
              value={visitTypeSearch}
              onChange={(e) => setVisitTypeSearch(e.target.value)}
            />
            <Button size="sm" onClick={() => setVisitTypeModal({ open: true, item: { name: "", duration_minutes: 20, price: 0, description: "", is_active: true } })}>
              <Plus className="mc-icon mc-icon--xs" style={{ marginRight: 4 }} />
              Thêm loại khám
            </Button>
          </div>
          {filteredVisitTypes.length === 0 ? (
            <div className="cat-empty">Không có loại khám nào.</div>
          ) : (
            <div className="cat-list">
              {filteredVisitTypes.map((v) => (
                <VisitTypeCard
                  key={v.id}
                  item={v}
                  saving={saving}
                  onEdit={(item) => setVisitTypeModal({ open: true, item: { ...item } })}
                  onDeactivate={handleDeactivateVisitType}
                  onHardDelete={handleHardDeleteVisitType}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── RECEPTIONIST TAB ─── */}
      {activeTab === "receptionists" && (
        <div>
          <div className="dash-filter-bar">
            <input
              className="dash-search-input"
              placeholder="Tìm lễ tân, tên đăng nhập..."
              value={receptionistSearch}
              onChange={(e) => setReceptionistSearch(e.target.value)}
            />
            <Button size="sm" onClick={() => { navigate("/app/admin/catalog/receptionists/create"); }}>
              <Plus className="mc-icon mc-icon--xs" style={{ marginRight: 4 }} />
              Thêm lễ tân
            </Button>
          </div>
          {filteredReceptionists.length === 0 ? (
            <div className="cat-empty">Không có lễ tân nào.</div>
          ) : (
            <div className="cat-list">
              {filteredReceptionists.map((r) => (
                <ReceptionistCard
                  key={r.id}
                  item={r}
                  saving={saving}
                  onDelete={handleDeleteReceptionist}
                  onResetPassword={(item) => openResetPw(item, "receptionist")}
                  navigate={navigate}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── MODALS ─── */}

      {/* Specialty Edit/Create Modal */}
      <Modal
        open={specialtyModal.open}
        title={specialtyModal.item?.id ? "Sửa khoa" : "Thêm khoa mới"}
        onClose={() => setSpecialtyModal({ open: false, item: null })}
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setSpecialtyModal({ open: false, item: null })} disabled={saving}>Hủy</Button>
            <Button size="sm" onClick={handleSaveSpecialty} disabled={saving}>
              {specialtyModal.item?.id ? "Lưu" : "Tạo mới"}
            </Button>
          </>
        }
      >
        {specialtyModal.item && (
          <div className="cat-modal-form">
            <Input
              label="Tên khoa"
              value={specialtyModal.item.name || ""}
              onChange={(e) => setSpecialtyModal((m) => ({ ...m, item: { ...m.item, name: e.target.value } }))}
              placeholder="VD: Nhi khoa, Da liễu..."
            />
            <Input
              label="Mô tả"
              value={specialtyModal.item.description || ""}
              onChange={(e) => setSpecialtyModal((m) => ({ ...m, item: { ...m.item, description: e.target.value } }))}
              placeholder="Mô tả ngắn về chuyên khoa..."
            />
            <label className="cat-modal-form__checkbox">
              <input
                type="checkbox"
                checked={Boolean(specialtyModal.item.is_active)}
                onChange={(e) => setSpecialtyModal((m) => ({ ...m, item: { ...m.item, is_active: e.target.checked } }))}
              />
              <span>Hoạt động</span>
            </label>
          </div>
        )}
      </Modal>

      {/* VisitType Edit Modal */}
      <Modal
        open={visitTypeModal.open}
        title="Sửa loại khám"
        onClose={() => setVisitTypeModal({ open: false, item: null })}
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setVisitTypeModal({ open: false, item: null })} disabled={saving}>Hủy</Button>
            <Button size="sm" onClick={handleSaveVisitType} disabled={saving}>
              {visitTypeModal.item?.id ? "Lưu" : "Tạo mới"}
            </Button>
          </>
        }
      >
        {visitTypeModal.item && (
          <div className="cat-modal-form">
            <Input
              label="Tên loại khám"
              value={visitTypeModal.item.name || ""}
              onChange={(e) => setVisitTypeModal((m) => ({ ...m, item: { ...m.item, name: e.target.value } }))}
            />
            <div className="cat-modal-form__row">
              <Input
                label="Thời lượng (phút)"
                type="number"
                value={visitTypeModal.item.duration_minutes || ""}
                onChange={(e) => setVisitTypeModal((m) => ({ ...m, item: { ...m.item, duration_minutes: e.target.value } }))}
              />
              <Input
                label="Giá (VNĐ)"
                type="number"
                value={visitTypeModal.item.price || ""}
                onChange={(e) => setVisitTypeModal((m) => ({ ...m, item: { ...m.item, price: e.target.value } }))}
              />
            </div>
            <Input
              label="Mô tả"
              value={visitTypeModal.item.description || ""}
              onChange={(e) => setVisitTypeModal((m) => ({ ...m, item: { ...m.item, description: e.target.value } }))}
            />
            <label className="cat-modal-form__checkbox">
              <input
                type="checkbox"
                checked={Boolean(visitTypeModal.item.is_active)}
                onChange={(e) => setVisitTypeModal((m) => ({ ...m, item: { ...m.item, is_active: e.target.checked } }))}
              />
              <span>Hoạt động</span>
            </label>
          </div>
        )}
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        open={resetPwModal.open}
        title="Đặt lại mật khẩu"
        description={
          resetPwModal.item
            ? resetPwModal.type === "doctor"
              ? `${resetPwModal.item.full_name} (@${resetPwModal.item.linked_username})`
              : `${resetPwModal.item.full_name} (@${resetPwModal.item.username})`
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
        <div className="cat-modal-form">
          {resetPwError && (
            <div className="cat-modal-error">{resetPwError}</div>
          )}
          <Input
            label="Mật khẩu mới"
            type="password"
            value={resetPwForm.new_password}
            onChange={(e) => setResetPwForm((f) => ({ ...f, new_password: e.target.value }))}
            placeholder="Ít nhất 6 ký tự"
          />
          <Input
            label="Xác nhận mật khẩu mới"
            type="password"
            value={resetPwForm.confirm_password}
            onChange={(e) => setResetPwForm((f) => ({ ...f, confirm_password: e.target.value }))}
            placeholder="Nhập lại mật khẩu mới"
          />
        </div>
      </Modal>

      {/* Confirm Modal */}
      <ConfirmModal
        open={confirmModal.open}
        title={confirmModal.title}
        body={confirmModal.body}
        confirmLabel={confirmModal.confirmLabel}
        confirmVariant={confirmModal.confirmVariant}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ open: false })}
        saving={saving}
      />
    </div>
  );
}
