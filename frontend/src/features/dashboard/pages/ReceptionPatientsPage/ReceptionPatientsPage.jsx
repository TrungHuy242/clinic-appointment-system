import React, { useState } from "react";
import { CalendarDays, FileText, ShieldCheck, Stethoscope, UserRound, Users } from "lucide-react";
import Badge from "../../../../shared/components/Badge/Badge";
import Table from "../../../../shared/components/Table/Table";
import "./ReceptionPatientsPage.css";

const MOCK_PATIENTS = [
  {
    id: 1,
    code: "BN-0001",
    name: "Nguyễn Văn An",
    phone: "0901234567",
    dob: "01/01/1990",
    gender: "Nam",
    lastVisit: "09/03/2026",
    totalVisits: 5,
    status: "active",
  },
  {
    id: 2,
    code: "BN-0002",
    name: "Trần Thị Bình",
    phone: "0912345678",
    dob: "15/06/1985",
    gender: "Nữ",
    lastVisit: "05/03/2026",
    totalVisits: 3,
    status: "active",
  },
  {
    id: 3,
    code: "BN-0003",
    name: "Lê Văn Cường",
    phone: "0934567890",
    dob: "22/11/1978",
    gender: "Nam",
    lastVisit: "01/02/2026",
    totalVisits: 12,
    status: "inactive",
  },
  {
    id: 4,
    code: "BN-0004",
    name: "Phạm Thị Dung",
    phone: "0945678901",
    dob: "08/03/1995",
    gender: "Nữ",
    lastVisit: "08/03/2026",
    totalVisits: 1,
    status: "active",
  },
  {
    id: 5,
    code: "BN-0005",
    name: "Hoàng Văn Em",
    phone: "0956789012",
    dob: "14/07/1970",
    gender: "Nam",
    lastVisit: "28/01/2026",
    totalVisits: 8,
    status: "active",
  },
];

const STAT_CARDS = [
  { key: "totalPatients", label: "Tổng bệnh nhân", icon: Users, tone: "sky" },
  { key: "activePatients", label: "Đang hoạt động", icon: ShieldCheck, tone: "green" },
  { key: "newPatients", label: "Mới trong tháng", icon: CalendarDays, tone: "yellow" },
  { key: "totalVisits", label: "Tổng lượt khám", icon: Stethoscope, tone: "violet" },
];

const COLUMNS = [
  {
    key: "code",
    title: "Mã BN",
    render: (row) => <span className="reception-patients__code">{row.code}</span>,
  },
  {
    key: "name",
    title: "Bệnh nhân",
    render: (row) => (
      <div className="reception-patients__person">
        <div className="reception-patients__avatar"><UserRound className="mc-icon mc-icon--md" /></div>
        <div>
          <div className="reception-patients__name">{row.name}</div>
          <div className="reception-patients__phone">{row.phone}</div>
        </div>
      </div>
    ),
  },
  { key: "dob", title: "Ngày sinh", dataIndex: "dob" },
  { key: "gender", title: "Giới tính", dataIndex: "gender" },
  { key: "lastVisit", title: "Khám gần nhất", dataIndex: "lastVisit" },
  {
    key: "totalVisits",
    title: "Tổng lượt khám",
    render: (row) => <span className="reception-patients__visits">{row.totalVisits}</span>,
  },
  {
    key: "status",
    title: "Trạng thái",
    render: (row) => (
      <Badge variant={row.status === "active" ? "success" : "neutral"}>
        {row.status === "active" ? "Hoạt động" : "Ngừng"}
      </Badge>
    ),
  },
  {
    key: "actions",
    title: "",
    render: () => (
      <div className="reception-patients__actions">
        <button className="dash-action-btn dash-action-btn--sm" title="Xem hồ sơ" type="button">
          <FileText className="mc-icon mc-icon--sm" />
        </button>
        <button className="dash-action-btn dash-action-btn--sm" title="Đặt lịch nhanh" type="button">
          <CalendarDays className="mc-icon mc-icon--sm" />
        </button>
      </div>
    ),
  },
];

export default function ReceptionPatientsPage() {
  const [search, setSearch] = useState("");
  const [genderFilter, setGenderFilter] = useState("all");

  const filtered = MOCK_PATIENTS.filter((patient) => {
    const matchSearch =
      !search ||
      patient.name.toLowerCase().includes(search.toLowerCase()) ||
      patient.phone.includes(search) ||
      patient.code.includes(search);
    const matchGender = genderFilter === "all" || patient.gender === genderFilter;
    return matchSearch && matchGender;
  });

  const stats = {
    totalPatients: MOCK_PATIENTS.length,
    activePatients: MOCK_PATIENTS.filter((item) => item.status === "active").length,
    newPatients: 2,
    totalVisits: MOCK_PATIENTS.reduce((sum, item) => sum + item.totalVisits, 0),
  };

  return (
    <div className="dash-page reception-patients">
      <div className="dash-page-header">
        <div>
          <h1 className="dash-page-title">Quản lý bệnh nhân</h1>
          <p className="dash-page-sub">Danh sách hồ sơ bệnh nhân tại Cơ sở Hải Châu</p>
        </div>
        <button className="dash-btn-primary" type="button">
          + Thêm bệnh nhân
        </button>
      </div>

      <div className="dash-stats-row">
        {STAT_CARDS.map((card) => (
          <div
            key={card.key}
            className={`dash-stat-card reception-patients__stat-card reception-patients__stat-card--${card.tone}`}
          >
            <div className="dash-stat-icon">{React.createElement(card.icon, { className: "mc-icon mc-icon--md" })}</div>
            <div className="dash-stat-val">{stats[card.key]}</div>
            <div className="dash-stat-label">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="dash-filter-bar">
        <input
          className="dash-search-input"
          placeholder="Tìm theo tên, SĐT, mã bệnh nhân..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <select
          className="dash-filter-select"
          value={genderFilter}
          onChange={(event) => setGenderFilter(event.target.value)}
        >
          <option value="all">Tất cả giới tính</option>
          <option value="Nam">Nam</option>
          <option value="Nữ">Nữ</option>
        </select>
      </div>

      <Table columns={COLUMNS} data={filtered} emptyMessage="Không tìm thấy bệnh nhân." />
    </div>
  );
}
