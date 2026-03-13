import React, { useState } from "react";
import { Baby, Building2, CalendarDays, HeartPulse, ShieldCheck, Smile, Sparkles, Stethoscope, UserRound, Users } from "lucide-react";
import Badge from "../../../../shared/components/Badge/Badge";
import "./CatalogPage.css";

const MOCK_SPECIALTIES = [
  { id: 1, name: "Nhi khoa", icon: Baby, doctors: 3, active: true },
  { id: 2, name: "Da liễu", icon: Sparkles, doctors: 4, active: true },
  { id: 3, name: "Tai Mũi Họng", icon: Stethoscope, doctors: 2, active: true },
  { id: 4, name: "Nha khoa", icon: Smile, doctors: 2, active: true },
  { id: 5, name: "Tim mạch", icon: HeartPulse, doctors: 1, active: false },
  { id: 6, name: "Khám tổng quát", icon: ShieldCheck, doctors: 5, active: true },
];

const MOCK_DOCTORS = [
  { id: 1, name: "BS. Nguyễn Thị Sarah", specialty: "Da liễu", phone: "0901234567", active: true, appointments: 120 },
  { id: 2, name: "BS. Nguyễn Văn A", specialty: "Nhi khoa", phone: "0912345678", active: true, appointments: 95 },
  { id: 3, name: "BS. Trần Thị C", specialty: "Khám tổng quát", phone: "0934567890", active: false, appointments: 44 },
];

const FACILITY_STATS = [
  { label: "Tổng bác sĩ", value: "11", icon: Users },
  { label: "Chuyên khoa", value: "6", icon: Building2 },
  { label: "Phòng khám", value: "8", icon: CalendarDays },
];

export default function CatalogPage() {
  const [activeTab, setActiveTab] = useState("specialties");
  const [specialtySearch, setSpecialtySearch] = useState("");
  const [doctorSearch, setDoctorSearch] = useState("");

  const filteredSpecialties = MOCK_SPECIALTIES.filter((item) =>
    item.name.toLowerCase().includes(specialtySearch.toLowerCase())
  );
  const filteredDoctors = MOCK_DOCTORS.filter(
    (item) =>
      item.name.toLowerCase().includes(doctorSearch.toLowerCase()) ||
      item.specialty.toLowerCase().includes(doctorSearch.toLowerCase())
  );

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

      <div className="dash-filter-tabs catalog-page__tabs">
        <button className={`dash-filter-tab ${activeTab === "specialties" ? "active" : ""}`} onClick={() => setActiveTab("specialties")} type="button">Chuyên khoa</button>
        <button className={`dash-filter-tab ${activeTab === "doctors" ? "active" : ""}`} onClick={() => setActiveTab("doctors")} type="button">Bác sĩ</button>
        <button className={`dash-filter-tab ${activeTab === "facility" ? "active" : ""}`} onClick={() => setActiveTab("facility")} type="button">Cơ sở Hải Châu</button>
      </div>

      {activeTab === "specialties" && (
        <div>
          <div className="dash-filter-bar">
            <input className="dash-search-input" placeholder="Tìm chuyên khoa..." value={specialtySearch} onChange={(event) => setSpecialtySearch(event.target.value)} />
            <button className="dash-btn-primary" type="button">+ Thêm chuyên khoa</button>
          </div>
          <div className="catalog-grid">
            {filteredSpecialties.map((specialty) => (
              <div key={specialty.id} className={`catalog-card ${!specialty.active ? "catalog-card--inactive" : ""}`}>
                <div className="catalog-card__icon">{React.createElement(specialty.icon, { className: "mc-icon mc-icon--lg" })}</div>
                <div className="catalog-card__name">{specialty.name}</div>
                <div className="catalog-card__meta">{specialty.doctors} bác sĩ</div>
                <Badge variant={specialty.active ? "success" : "neutral"}>{specialty.active ? "Hoạt động" : "Tạm ngừng"}</Badge>
                <div className="catalog-card__actions">
                  <button className="dash-action-btn dash-action-btn--sm" type="button">Sửa</button>
                  <button className="dash-action-btn dash-action-btn--sm" type="button">{specialty.active ? "Tắt" : "Bật"}</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "doctors" && (
        <div>
          <div className="dash-filter-bar">
            <input className="dash-search-input" placeholder="Tìm bác sĩ, chuyên khoa..." value={doctorSearch} onChange={(event) => setDoctorSearch(event.target.value)} />
            <button className="dash-btn-primary" type="button">+ Thêm bác sĩ</button>
          </div>
          <div className="catalog-page__doctor-list">
            {filteredDoctors.map((doctor) => (
              <div key={doctor.id} className="dr-catalog-card catalog-page__doctor-card">
                <div className="catalog-page__doctor-main">
                  <div className="catalog-page__doctor-avatar"><UserRound className="mc-icon mc-icon--lg" /></div>
                  <div className="catalog-page__doctor-copy">
                    <div className="catalog-page__doctor-name">{doctor.name}</div>
                    <div className="catalog-page__doctor-meta">{doctor.specialty} · {doctor.phone}</div>
                    <div className="catalog-page__doctor-count">{doctor.appointments} lượt khám</div>
                  </div>
                  <Badge variant={doctor.active ? "success" : "neutral"}>{doctor.active ? "Hoạt động" : "Tạm ngừng"}</Badge>
                  <div className="catalog-page__doctor-actions">
                    <button className="dash-action-btn dash-action-btn--sm" type="button">Sửa</button>
                    <button className="dash-action-btn dash-action-btn--sm" type="button">Lịch</button>
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
            <div className="catalog-page__facility-icon"><Building2 className="mc-icon mc-icon--lg" /></div>
            <div className="catalog-page__facility-copy">
              <h3 className="catalog-page__facility-title">MediCare Clinic – Cơ sở Hải Châu</h3>
              <p className="catalog-page__facility-subtitle">123 Nguyễn Văn Linh, Hải Châu, Đà Nẵng</p>
            </div>
            <Badge variant="success">Đang hoạt động</Badge>
          </div>

          <div className="catalog-page__facility-stats">
            {FACILITY_STATS.map((item) => (
              <div key={item.label} className="catalog-page__facility-stat">
                <div className="catalog-page__facility-stat-icon">{React.createElement(item.icon, { className: "mc-icon mc-icon--md" })}</div>
                <div className="catalog-page__facility-stat-value">{item.value}</div>
                <div className="catalog-page__facility-stat-label">{item.label}</div>
              </div>
            ))}
          </div>

          <div className="catalog-page__facility-meta">
            <div className="catalog-page__facility-meta-section">
              <div className="catalog-page__facility-meta-title">Giờ làm việc</div>
              <div className="catalog-page__facility-meta-copy">Thứ 2–6: 08:00 – 11:30 · 13:30 – 17:00</div>
              <div className="catalog-page__facility-meta-copy">Thứ 7: 08:00 – 11:30</div>
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
