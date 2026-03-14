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
import Badge from "../../../../shared/components/Badge/Badge";
import Button from "../../../../shared/components/Button/Button";
import Input from "../../../../shared/components/Input/Input";
import LoadingSpinner from "../../../../shared/components/LoadingSpinner/LoadingSpinner";
import {
  createDoctor,
  createSpecialty,
  listDoctors,
  listSpecialties,
  updateDoctor,
  updateSpecialty,
} from "../../services/catalogApi";
import "./CatalogPage.css";

const SPECIALTY_ICONS = {
  "Nhi khoa": Baby,
  "Da li?u": Sparkles,
  "Tai Mui H?ng": Stethoscope,
  "Khám t?ng quát": HeartPulse,
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
      setError(nextError.message || "Không t?i du?c danh m?c.");
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
    { label: "T?ng bác si", value: doctors.length, icon: Users },
    { label: "Chuyên khoa", value: specialties.length, icon: Building2 },
    {
      label: "Ðang ho?t d?ng",
      value: doctors.filter((doctor) => doctor.is_active).length,
      icon: CalendarDays,
    },
  ];

  async function handleCreateSpecialty() {
    if (!specialtyForm.name.trim()) {
      setError("Tên chuyên khoa là b?t bu?c.");
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
      setError(nextError.message || "Không t?o du?c chuyên khoa.");
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
      setError(nextError.message || "Không c?p nh?t du?c chuyên khoa.");
    } finally {
      setSaving(false);
    }
  }

  async function handleEditSpecialty(specialty) {
    const nextName = window.prompt("Tên chuyên khoa", specialty.name);
    if (!nextName || !nextName.trim()) return;
    const nextDescription = window.prompt(
      "Mô t? chuyên khoa",
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
      setError(nextError.message || "Không s?a du?c chuyên khoa.");
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateDoctor() {
    if (!doctorForm.fullName.trim() || !doctorForm.specialtyId) {
      setError("H? tên bác si và chuyên khoa là b?t bu?c.");
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
      setError(nextError.message || "Không t?o du?c bác si.");
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
      setError(nextError.message || "Không c?p nh?t du?c bác si.");
    } finally {
      setSaving(false);
    }
  }

  async function handleEditDoctor(doctor) {
    const nextName = window.prompt("H? tên bác si", doctor.full_name);
    if (!nextName || !nextName.trim()) return;
    const nextPhone = window.prompt("S? di?n tho?i", doctor.phone || "");

    setSaving(true);
    setError("");
    try {
      await updateDoctor(doctor.id, {
        full_name: nextName.trim(),
        phone: (nextPhone || "").trim(),
      });
      await loadCatalog();
    } catch (nextError) {
      setError(nextError.message || "Không s?a du?c bác si.");
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
          <h1 className="dash-page-title">Danh m?c & Co s? H?i Châu</h1>
          <p className="dash-page-sub">
            Qu?n lý chuyên khoa, bác si và thông tin v?n hành c?a Co s? H?i Châu
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
          Bác si
        </button>
        <button
          className={`dash-filter-tab ${activeTab === "facility" ? "active" : ""}`}
          onClick={() => setActiveTab("facility")}
          type="button"
        >
          Co s? H?i Châu
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
              label="Mô t?"
              value={specialtyForm.description}
              onChange={(event) =>
                setSpecialtyForm((current) => ({ ...current, description: event.target.value }))
              }
            />
            <Button onClick={handleCreateSpecialty} disabled={saving}>
              Thêm chuyên khoa
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
                    {doctorCountBySpecialty[specialty.id] || 0} bác si
                  </div>
                  <Badge variant={specialty.is_active ? "success" : "neutral"}>
                    {specialty.is_active ? "Ho?t d?ng" : "T?m ngung"}
                  </Badge>
                  <div className="catalog-card__actions">
                    <button
                      className="dash-action-btn dash-action-btn--sm"
                      type="button"
                      onClick={() => handleEditSpecialty(specialty)}
                    >
                      S?a
                    </button>
                    <button
                      className="dash-action-btn dash-action-btn--sm"
                      type="button"
                      onClick={() => handleToggleSpecialty(specialty)}
                    >
                      {specialty.is_active ? "T?t" : "B?t"}
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
              placeholder="Tìm bác si, chuyên khoa..."
              value={doctorSearch}
              onChange={(event) => setDoctorSearch(event.target.value)}
            />
          </div>

          <div className="mc-surface catalog-page__form-grid catalog-page__form-grid--doctor">
            <Input
              label="H? tên bác si"
              value={doctorForm.fullName}
              onChange={(event) =>
                setDoctorForm((current) => ({ ...current, fullName: event.target.value }))
              }
            />
            <Input
              label="S? di?n tho?i"
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
              Thêm bác si
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
                      {doctor.specialty_name} · {doctor.phone || "Chua c?p nh?t SÐT"}
                    </div>
                    <div className="catalog-page__doctor-count">
                      {doctor.is_active ? "Ðang nh?n l?ch" : "T?m d?ng nh?n l?ch"}
                    </div>
                  </div>
                  <Badge variant={doctor.is_active ? "success" : "neutral"}>
                    {doctor.is_active ? "Ho?t d?ng" : "T?m ngung"}
                  </Badge>
                  <div className="catalog-page__doctor-actions">
                    <button
                      className="dash-action-btn dash-action-btn--sm"
                      type="button"
                      onClick={() => handleEditDoctor(doctor)}
                    >
                      S?a
                    </button>
                    <button
                      className="dash-action-btn dash-action-btn--sm"
                      type="button"
                      onClick={() => handleToggleDoctor(doctor)}
                    >
                      {doctor.is_active ? "T?t" : "B?t"}
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
              <h3 className="catalog-page__facility-title">MediCare Clinic - Co s? H?i Châu</h3>
              <p className="catalog-page__facility-subtitle">
                123 Nguy?n Van Linh, H?i Châu, Ðà N?ng
              </p>
            </div>
            <Badge variant="success">Ðang ho?t d?ng</Badge>
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
              <div className="catalog-page__facility-meta-title">Gi? làm vi?c</div>
              <div className="catalog-page__facility-meta-copy">Th? 2-6: 08:00 - 11:30 · 13:30 - 17:00</div>
              <div className="catalog-page__facility-meta-copy">Th? 7: 08:00 - 11:30</div>
            </div>
            <div className="catalog-page__facility-meta-section">
              <div className="catalog-page__facility-meta-title">Liên h?</div>
              <div className="catalog-page__facility-meta-copy">Hotline: 1900 1234</div>
              <div className="catalog-page__facility-meta-copy">Email: haichau@medicare.vn</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
