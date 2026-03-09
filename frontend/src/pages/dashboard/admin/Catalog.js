import React, { useState } from "react";
import Badge from "../../../components/common/Badge";
import "../../../styles/pages/dashboard.css";

const MOCK_SPECIALTIES = [
    { id: 1, name: "Nhi khoa", icon: "👶", doctors: 3, active: true },
    { id: 2, name: "Da liễu", icon: "🔬", doctors: 4, active: true },
    { id: 3, name: "Tai Mũi Họng", icon: "👂", doctors: 2, active: true },
    { id: 4, name: "Nha khoa", icon: "🦷", doctors: 2, active: true },
    { id: 5, name: "Tim mạch", icon: "🫀", doctors: 1, active: false },
    { id: 6, name: "Khám tổng quát", icon: "🩺", doctors: 5, active: true },
];

const MOCK_DOCTORS = [
    { id: 1, name: "BS. Nguyễn Thị Sarah", specialty: "Da liễu", phone: "0901234567", active: true, appointments: 120 },
    { id: 2, name: "BS. Nguyễn Văn A", specialty: "Nhi khoa", phone: "0912345678", active: true, appointments: 95 },
    { id: 3, name: "BS. Trần Thị C", specialty: "Khám tổng quát", phone: "0934567890", active: false, appointments: 44 },
];

export default function Catalog() {
    const [activeTab, setActiveTab] = useState("specialties");
    const [spSearch, setSpSearch] = useState("");
    const [drSearch, setDrSearch] = useState("");

    const filteredSp = MOCK_SPECIALTIES.filter(s =>
        s.name.toLowerCase().includes(spSearch.toLowerCase())
    );
    const filteredDr = MOCK_DOCTORS.filter(d =>
        d.name.toLowerCase().includes(drSearch.toLowerCase()) ||
        d.specialty.toLowerCase().includes(drSearch.toLowerCase())
    );

    return (
        <div className="dash-page">
            <div className="dash-page-header">
                <div>
                    <h1 className="dash-page-title">Danh mục & Cơ sở</h1>
                    <p className="dash-page-sub">Quản lý chuyên khoa, bác sĩ và cơ sở khám</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="dash-filter-tabs" style={{ marginBottom: 20 }}>
                <button className={`dash-filter-tab ${activeTab === "specialties" ? "active" : ""}`} onClick={() => setActiveTab("specialties")}>🏥 Chuyên khoa</button>
                <button className={`dash-filter-tab ${activeTab === "doctors" ? "active" : ""}`} onClick={() => setActiveTab("doctors")}>👨‍⚕️ Bác sĩ</button>
                <button className={`dash-filter-tab ${activeTab === "branches" ? "active" : ""}`} onClick={() => setActiveTab("branches")}>📍 Cơ sở</button>
            </div>

            {activeTab === "specialties" && (
                <div>
                    <div className="dash-filter-bar">
                        <input className="dash-search-input" placeholder="🔍 Tìm chuyên khoa..."
                            value={spSearch} onChange={e => setSpSearch(e.target.value)} />
                        <button className="dash-btn-primary">+ Thêm chuyên khoa</button>
                    </div>
                    <div className="catalog-grid">
                        {filteredSp.map(sp => (
                            <div key={sp.id} className={`catalog-card ${!sp.active ? "catalog-card--inactive" : ""}`}>
                                <div className="catalog-card__icon">{sp.icon}</div>
                                <div className="catalog-card__name">{sp.name}</div>
                                <div className="catalog-card__meta">{sp.doctors} bác sĩ</div>
                                <Badge variant={sp.active ? "success" : "neutral"}>{sp.active ? "Hoạt động" : "Tạm ngừng"}</Badge>
                                <div className="catalog-card__actions">
                                    <button className="dash-action-btn dash-action-btn--sm">✏️ Sửa</button>
                                    <button className="dash-action-btn dash-action-btn--sm">{sp.active ? "🔒 Tắt" : "✅ Bật"}</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === "doctors" && (
                <div>
                    <div className="dash-filter-bar">
                        <input className="dash-search-input" placeholder="🔍 Tìm bác sĩ, chuyên khoa..."
                            value={drSearch} onChange={e => setDrSearch(e.target.value)} />
                        <button className="dash-btn-primary">+ Thêm bác sĩ</button>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {filteredDr.map(dr => (
                            <div key={dr.id} className="dr-catalog-card">
                                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                                    <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--color-primary-light)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>
                                        👨‍⚕️
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 800, fontSize: 15 }}>{dr.name}</div>
                                        <div style={{ fontSize: 13, color: "var(--color-text-muted)" }}>{dr.specialty} · {dr.phone}</div>
                                        <div style={{ fontSize: 12, color: "var(--color-primary)", marginTop: 2 }}>{dr.appointments} lượt khám</div>
                                    </div>
                                    <Badge variant={dr.active ? "success" : "neutral"}>{dr.active ? "Hoạt động" : "Tạm ngừng"}</Badge>
                                    <div style={{ display: "flex", gap: 8 }}>
                                        <button className="dash-action-btn dash-action-btn--sm">✏️ Sửa</button>
                                        <button className="dash-action-btn dash-action-btn--sm">📅 Lịch</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === "branches" && (
                <div className="branch-card">
                    <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 12 }}>
                        <div style={{ fontSize: 36 }}>🏥</div>
                        <div>
                            <h3 style={{ margin: 0, fontWeight: 800 }}>MediCare Clinic – Chi nhánh Hải Châu</h3>
                            <p style={{ margin: "4px 0 0", color: "var(--color-text-muted)", fontSize: 13 }}>123 Nguyễn Văn Linh, Hải Châu, Đà Nẵng</p>
                        </div>
                        <Badge variant="success">Đang hoạt động</Badge>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginTop: 16 }}>
                        {[
                            { label: "Tổng bác sĩ", value: "11", icon: "👨‍⚕️" },
                            { label: "Chuyên khoa", value: "6", icon: "🏥" },
                            { label: "Phòng khám", value: "8", icon: "🚪" },
                        ].map(s => (
                            <div key={s.label} style={{ background: "var(--color-bg-soft)", borderRadius: 12, padding: "16px 20px", textAlign: "center" }}>
                                <div style={{ fontSize: 24, marginBottom: 4 }}>{s.icon}</div>
                                <div style={{ fontSize: 22, fontWeight: 800 }}>{s.value}</div>
                                <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>{s.label}</div>
                            </div>
                        ))}
                    </div>
                    <div style={{ marginTop: 20, padding: "16px 0", borderTop: "1px solid var(--color-border-subtle)", display: "flex", gap: 16 }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", marginBottom: 6 }}>Giờ làm việc</div>
                            <div style={{ fontSize: 14 }}>Thứ 2–6: 08:00 – 11:30 · 13:30 – 17:00</div>
                            <div style={{ fontSize: 14 }}>Thứ 7: 08:00 – 11:30</div>
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", marginBottom: 6 }}>Liên hệ</div>
                            <div style={{ fontSize: 14 }}>Hotline: 1900 1234</div>
                            <div style={{ fontSize: 14 }}>Email: haichau@medicare.vn</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
