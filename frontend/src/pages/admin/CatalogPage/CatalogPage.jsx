import React, { useEffect, useState } from "react";
import {
  Baby,
  Building2,
  CalendarDays,
  HeartPulse,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UserRound,
  Users,
} from "lucide-react";
import Badge from "../../../components/Badge/Badge";
import Button from "../../../components/Button/Button";
import Input from "../../../components/Input/Input";
import LoadingSpinner from "../../../components/LoadingSpinner/LoadingSpinner";
import {
  createDoctor,
  createSpecialty,
  listDoctors,
  listSpecialties,
  updateDoctor,
  updateSpecialty,
} from "../../../services/adminApi";
import "./CatalogPage.css";

const SPECIALTY_ICONS = {
  "Nhi khoa": Baby,
  "Da liểu": Sparkles,
  "Tai Mui Họng": Stethoscope,
  "Khám tổng quát": HeartPulse,
};

export default function CatalogPage() {
  const [activeTab, setActiveTab] = useState("specialties");
  const [specialtySearch, setSpecialtySearch] = useState("");
  const [doctorSearch, setDoctorSearch] = useState("");
  const [specialties, setSpecialties] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [specialtyForm, setSpecialtyForm] = useState({ name: "", description: "" });
  const [doctorForm, setDoctorForm] = useState({ fullName: "", phone: "", specialtyId: "" });

  async function loadCatalog() {
    setLoading(true);
    setError("");
    try {
      const [nextSpecialties, nextDoctors] = await Promise.all([
        listSpecialties(),
        listDoctors(),
      ]);
      setSpecialties(nextSpecialties);
      setDoctors(nextDoctors);
      setDoctorForm((current) => ({
        ...current,
        specialtyId: current.specialtyId || String(nextSpecialties[0]?.id || ""),
      }));
    } catch (nextError) {
      setError(nextError.message || "Không tải được danh mục.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCatalog();
  }, []);

  const filteredSpecialties = specialties.filter((item) =>
    item.name.toLowerCase().includes(specialtySearch.toLowerCase())
  );
  const filteredDoctors = doctors.filter(
    (item) =>
      item.full_name.toLowerCase().includes(doctorSearch.toLowerCase()) ||
      item.specialty_name.toLowerCase().includes(doctorSearch.toLowerCase())
  );
  const doctorCountBySpecialty = doctors.reduce((accumulator, doctor) => {
    accumulator[doctor.specialty] = (accumulator[doctor.specialty] || 0) + 1;
    return accumulator;
  }, {});
  const facilityStats = [
    { label: "Tổng bác sĩ", value: doctors.length, icon: Users },
    { label: "Chuyên khoa", value: specialties.length, icon: Building2 },
    {
      label: "Đang hoạt động",
      value: doctors.filter((doctor) => doctor.is_active).length,
      icon: CalendarDays,
    },
  ];

  async function handleCreateSpecialty() {
    if (!specialtyForm.name.trim()) {
      setError("Tên chuyên khoa là bắt buộc.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await createSpecialty({
        name: specialtyForm.name.trim(),
        description: specialtyForm.description.trim(),
        is_active: true,
      });
      setSpecialtyForm({ name: "", description: "" });
      await loadCatalog();
    } catch (nextError) {
      setError(nextError.message || "Không tạo được chuyên khoa.");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleSpecialty(specialty) {
    setSaving(true);
    setError("");
    try {
      await updateSpecialty(specialty.id, { is_active: !specialty.is_active });
      await loadCatalog();
    } catch (nextError) {
      setError(nextError.message || "Không cập nhật được chuyên khoa.");
    } finally {
      setSaving(false);
    }
  }

  async function handleEditSpecialty(specialty) {
    const nextName = window.prompt("Tên chuyên khoa", specialty.name);
    if (!nextName || !nextName.trim()) return;
    const nextDescription = window.prompt(
      "Mô tả chuyên khoa",
      specialty.description || ""
    );

    setSaving(true);
    setError("");
    try {
      await updateSpecialty(specialty.id, {
        name: nextName.trim(),
        description: (nextDescription || "").trim(),
      });
      await loadCatalog();
    } catch (nextError) {
      setError(nextError.message || "Không sửa được chuyên khoa.");
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateDoctor() {
    if (!doctorForm.fullName.trim() || !doctorForm.specialtyId) {
      setError("Họ tên bác sĩ và chuyên khoa là bắt buộc.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await createDoctor({
        full_name: doctorForm.fullName.trim(),
        phone: doctorForm.phone.trim(),
        specialty: Number(doctorForm.specialtyId),
        bio: "",
        is_active: true,
      });
      setDoctorForm((current) => ({
        ...current,
        fullName: "",
        phone: "",
      }));
      await loadCatalog();
    } catch (nextError) {
      setError(nextError.message || "Không tạo được bác sĩ.");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleDoctor(doctor) {
    setSaving(true);
    setError("");
    try {
      await updateDoctor(doctor.id, { is_active: !doctor.is_active });
      await loadCatalog();
    } catch (nextError) {
      setError(nextError.message || "Không cập nhật được bác sĩ.");
    } finally {
      setSaving(false);
    }
  }

  async function handleEditDoctor(doctor) {
    const nextName = window.prompt("Họ tên bác sĩ", doctor.full_name);
    if (!nextName || !nextName.trim()) return;
    const nextPhone = window.prompt("Số điện thoại", doctor.phone || "");

    setSaving(true);
    setError("");
    try {
      await updateDoctor(doctor.id, {
        full_name: nextName.trim(),
        phone: (nextPhone || "").trim(),
      });
      await loadCatalog();
    } catch (nextError) {
      setError(nextError.message || "Không sửa được bác sĩ.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="dash-page catalog-page">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="dash-page catalog-page">
      <div className="dash-page-header">
        <div>
          <h1 className="dash-page-title">Danh mục & Cơ sở Hải Châu</h1>
          <p className="dash-page-sub">
            Quản lý chuyên khoa, bác sĩ và thông tin vận hành của Cơ sở Hải Châu
          </p>
        </div>
      </div>

      {error && <div className="mc-surface catalog-page__error">{error}</div>}

      <div className="dash-filter-tabs catalog-page__tabs">
        <button
          className={`dash-filter-tab ${activeTab === "specialties" ? "active" : ""}`}
          onClick={() => setActiveTab("specialties")}
          type="button"
        >
          Chuyên khoa
        </button>
        <button
          className={`dash-filter-tab ${activeTab === "doctors" ? "active" : ""}`}
          onClick={() => setActiveTab("doctors")}
          type="button"
        >
          Bác sĩ
        </button>
        <button
          className={`dash-filter-tab ${activeTab === "facility" ? "active" : ""}`}
          onClick={() => setActiveTab("facility")}
          type="button"
        >
          Cơ sở Hải Châu
        </button>
      </div>

      {activeTab === "specialties" && (
        <div>
          <div className="dash-filter-bar">
            <input
              className="dash-search-input"
              placeholder="Tìm chuyên khoa..."
              value={specialtySearch}
              onChange={(event) => setSpecialtySearch(event.target.value)}
            />
          </div>

          <div className="mc-surface catalog-page__form-grid">
            <Input
              label="Tên chuyên khoa"
              value={specialtyForm.name}
              onChange={(event) =>
                setSpecialtyForm((current) => ({ ...current, name: event.target.value }))
              }
            />
            <Input
              label="Mô tả"
              value={specialtyForm.description}
              onChange={(event) =>
                setSpecialtyForm((current) => ({ ...current, description: event.target.value }))
              }
            />
            <Button onClick={handleCreateSpecialty} disabled={saving}>
              {"Thêm chuyên khoa"}
            </Button>
          </div>

          <div className="catalog-grid">
            {filteredSpecialties.map((specialty) => {
              const SpecialtyIcon = SPECIALTY_ICONS[specialty.name] || ShieldCheck;
              return (
                <div
                  key={specialty.id}
                  className={`catalog-card ${!specialty.is_active ? "catalog-card--inactive" : ""}`}
                >
                  <div className="catalog-card__icon">
                    <SpecialtyIcon className="mc-icon mc-icon--lg" />
                  </div>
                  <div className="catalog-card__name">{specialty.name}</div>
                  <div className="catalog-card__meta">
                    {doctorCountBySpecialty[specialty.id] || 0} {"bác sĩ"}
                  </div>
                  <Badge variant={specialty.is_active ? "success" : "neutral"}>
                    {specialty.is_active ? "Hoạt động" : "Tạm ngưng"}
                  </Badge>
                  <div className="catalog-card__actions">
                    <button
                      className="dash-action-btn dash-action-btn--sm"
                      type="button"
                      onClick={() => handleEditSpecialty(specialty)}
                    >
                      {"Sửa"}
                    </button>
                    <button
                      className="dash-action-btn dash-action-btn--sm"
                      type="button"
                      onClick={() => handleToggleSpecialty(specialty)}
                    >
                      {specialty.is_active ? "Tắt" : "Bật"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === "doctors" && (
        <div>
          <div className="dash-filter-bar">
            <input
              className="dash-search-input"
              placeholder="Tìm bác sĩ, chuyên khoa..."
              value={doctorSearch}
              onChange={(event) => setDoctorSearch(event.target.value)}
            />
          </div>

          <div className="mc-surface catalog-page__form-grid catalog-page__form-grid--doctor">
            <Input
              label="Họ tên bác sĩ"
              value={doctorForm.fullName}
              onChange={(event) =>
                setDoctorForm((current) => ({ ...current, fullName: event.target.value }))
              }
            />
            <Input
              label="Số điện thoại"
              value={doctorForm.phone}
              onChange={(event) =>
                setDoctorForm((current) => ({ ...current, phone: event.target.value }))
              }
            />
            <label className="catalog-page__select-wrap">
              <span>Chuyên khoa</span>
              <select
                className="dash-filter-select"
                value={doctorForm.specialtyId}
                onChange={(event) =>
                  setDoctorForm((current) => ({ ...current, specialtyId: event.target.value }))
                }
              >
                {specialties.map((specialty) => (
                  <option key={specialty.id} value={specialty.id}>
                    {specialty.name}
                  </option>
                ))}
              </select>
            </label>
            <Button onClick={handleCreateDoctor} disabled={saving}>
              {"Thêm bác sĩ"}
            </Button>
          </div>

          <div className="catalog-page__doctor-list">
            {filteredDoctors.map((doctor) => (
              <div key={doctor.id} className="dr-catalog-card catalog-page__doctor-card">
                <div className="catalog-page__doctor-main">
                  <div className="catalog-page__doctor-avatar">
                    <UserRound className="mc-icon mc-icon--lg" />
                  </div>
                  <div className="catalog-page__doctor-copy">
                    <div className="catalog-page__doctor-name">{doctor.full_name}</div>
                    <div className="catalog-page__doctor-meta">
                      {doctor.specialty_name} · {doctor.phone || "Chưa cập nhật SĐT"}
                    </div>
                    <div className="catalog-page__doctor-count">
                      {doctor.is_active ? "Đang nhận lịch" : "Tạm dừng nhận lịch"}
                    </div>
                  </div>
                  <Badge variant={doctor.is_active ? "success" : "neutral"}>
                    {doctor.is_active ? "Hoạt động" : "Tạm ngưng"}
                  </Badge>
                  <div className="catalog-page__doctor-actions">
                    <button
                      className="dash-action-btn dash-action-btn--sm"
                      type="button"
                      onClick={() => handleEditDoctor(doctor)}
                    >
                      Sửa
                    </button>
                    <button
                      className="dash-action-btn dash-action-btn--sm"
                      type="button"
                      onClick={() => handleToggleDoctor(doctor)}
                    >
                      {doctor.is_active ? "Tắt" : "Bật"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "facility" && (
        <div className="branch-card catalog-page__facility-card">
          <div className="catalog-page__facility-header">
            <div className="catalog-page__facility-icon">
              <Building2 className="mc-icon mc-icon--lg" />
            </div>
            <div className="catalog-page__facility-copy">
              <h3 className="catalog-page__facility-title">MediCare Clinic - Cơ sở Hải Châu</h3>
              <p className="catalog-page__facility-subtitle">
                123 Nguyễn Văn Linh, Hải Châu, Đà Nẵng
              </p>
            </div>
            <Badge variant="success">Đang hoạt động</Badge>
          </div>

          <div className="catalog-page__facility-stats">
            {facilityStats.map((item) => (
              <div key={item.label} className="catalog-page__facility-stat">
                <div className="catalog-page__facility-stat-icon">
                  {React.createElement(item.icon, { className: "mc-icon mc-icon--md" })}
                </div>
                <div className="catalog-page__facility-stat-value">{item.value}</div>
                <div className="catalog-page__facility-stat-label">{item.label}</div>
              </div>
            ))}
          </div>

          <div className="catalog-page__facility-meta">
            <div className="catalog-page__facility-meta-section">
              <div className="catalog-page__facility-meta-title">Giờ làm việc</div>
              <div className="catalog-page__facility-meta-copy">Thứ 2-6: 08:00 - 11:30 & 13:30 - 17:00</div>
              <div className="catalog-page__facility-meta-copy">Thứ 7: 08:00 - 11:30</div>
            </div>
            <div className="catalog-page__facility-meta-section">
              <div className="catalog-page__facility-meta-title">Liên hệ</div>
              <div className="catalog-page__facility-meta-copy">Hotline: 1900 1234</div>
              <div className="catalog-page__facility-meta-copy">Email: haichau@medicare.vn</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

