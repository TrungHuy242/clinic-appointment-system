import React, { useState } from "react";
import Badge from "../../../components/common/Badge";
import Table from "../../../components/common/Table";
import "../../../styles/pages/dashboard.css";

const MOCK_PATIENTS = [
    { id: 1, code: "BN-0001", name: "Nguyễn Văn An", phone: "0901234567", dob: "01/01/1990", gender: "Nam", lastVisit: "09/03/2026", totalVisits: 5, status: "active" },
    { id: 2, code: "BN-0002", name: "Trần Thị Bình", phone: "0912345678", dob: "15/06/1985", gender: "Nữ", lastVisit: "05/03/2026", totalVisits: 3, status: "active" },
    { id: 3, code: "BN-0003", name: "Lê Văn Cường", phone: "0934567890", dob: "22/11/1978", gender: "Nam", lastVisit: "01/02/2026", totalVisits: 12, status: "inactive" },
    { id: 4, code: "BN-0004", name: "Phạm Thị Dung", phone: "0945678901", dob: "08/03/1995", gender: "Nữ", lastVisit: "08/03/2026", totalVisits: 1, status: "active" },
    { id: 5, code: "BN-0005", name: "Hoàng Văn Em", phone: "0956789012", dob: "14/07/1970", gender: "Nam", lastVisit: "28/01/2026", totalVisits: 8, status: "active" },
];

const COLS = [
    {
        key: "code", title: "Mã BN", render: r => (
            <span style={{ fontFamily: "monospace", fontWeight: 700, color: "var(--color-primary)", fontSize: 13 }}>{r.code}</span>
        )
    },
    {
        key: "name", title: "Bệnh nhân", render: r => (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--color-primary-light)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>
                    {r.gender === "Nữ" ? "👩" : "👨"}
                </div>
                <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{r.name}</div>
                    <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>{r.phone}</div>
                </div>
            </div>
        )
    },
    { key: "dob", title: "Ngày sinh", dataIndex: "dob" },
    { key: "gender", title: "Giới tính", dataIndex: "gender" },
    { key: "lastVisit", title: "Khám gần nhất", dataIndex: "lastVisit" },
    {
        key: "totalVisits", title: "Tổng lượt khám", render: r => (
            <span style={{ fontWeight: 700, color: "var(--color-primary)" }}>{r.totalVisits}</span>
        )
    },
    {
        key: "status", title: "Trạng thái", render: r => (
            <Badge variant={r.status === "active" ? "success" : "neutral"}>
                {r.status === "active" ? "Hoạt động" : "Ngừng"}
            </Badge>
        )
    },
    {
        key: "actions", title: "", render: () => (
            <div style={{ display: "flex", gap: 6 }}>
                <button className="dash-action-btn dash-action-btn--sm" title="Xem hồ sơ">📄</button>
                <button className="dash-action-btn dash-action-btn--sm" title="Đặt lịch nhanh">📅</button>
            </div>
        )
    },
];

export default function Patients() {
    const [search, setSearch] = useState("");
    const [genderFilter, setGenderFilter] = useState("all");

    const filtered = MOCK_PATIENTS.filter(p => {
        const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.phone.includes(search) || p.code.includes(search);
        const matchGender = genderFilter === "all" || p.gender === genderFilter;
        return matchSearch && matchGender;
    });

    return (
        <div className="dash-page">
            <div className="dash-page-header">
                <div>
                    <h1 className="dash-page-title">Quản lý bệnh nhân</h1>
                    <p className="dash-page-sub">Danh sách hồ sơ bệnh nhân tại MediCare Hải Châu</p>
                </div>
                <button className="dash-btn-primary">+ Thêm bệnh nhân</button>
            </div>

            {/* Stats */}
            <div className="dash-stats-row">
                {[
                    { label: "Tổng bệnh nhân", value: MOCK_PATIENTS.length, icon: "👥", color: "#e0f2fe" },
                    { label: "Đang hoạt động", value: MOCK_PATIENTS.filter(p => p.status === "active").length, icon: "✅", color: "#dcfce7" },
                    { label: "Mới trong tháng", value: 2, icon: "🆕", color: "#fef3c7" },
                    { label: "Tổng lượt khám", value: MOCK_PATIENTS.reduce((s, p) => s + p.totalVisits, 0), icon: "🏥", color: "#ede9fe" },
                ].map(s => (
                    <div key={s.label} className="dash-stat-card" style={{ background: s.color }}>
                        <div className="dash-stat-icon">{s.icon}</div>
                        <div className="dash-stat-val">{s.value}</div>
                        <div className="dash-stat-label">{s.label}</div>
                    </div>
                ))}
            </div>

            <div className="dash-filter-bar">
                <input className="dash-search-input"
                    placeholder="🔍 Tìm theo tên, SĐT, mã bệnh nhân..."
                    value={search}
                    onChange={e => setSearch(e.target.value)} />
                <select className="dash-filter-select" value={genderFilter} onChange={e => setGenderFilter(e.target.value)}>
                    <option value="all">Tất cả giới tính</option>
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                </select>
            </div>

            <div className="mc-table-wrapper">
                <Table columns={COLS} data={filtered} emptyMessage="Không tìm thấy bệnh nhân." />
            </div>
        </div>
    );
}
