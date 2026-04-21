import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CalendarDays, FileText, ShieldCheck, Stethoscope, UserRound, Users } from "lucide-react";
import Badge from "../../../components/Badge/Badge";
import Table from "../../../components/Table/Table";
import { getReceptionPatients } from "../../../services/receptionApi";
import "./PatientsPage.css";

function stripHtml(raw) {
  if (typeof raw !== "string") return "";
  return raw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() || "Đã xảy ra lỗi.";
}

const STAT_CARDS = [
  { key: "totalPatients", label: "Tổng bệnh nhân", icon: Users, tone: "sky" },
  { key: "activePatients", label: "Đang hoạt động", icon: ShieldCheck, tone: "green" },
  { key: "newPatients", label: "Mới trong tháng", icon: CalendarDays, tone: "yellow" },
  { key: "totalVisits", label: "Tổng lượt khám", icon: Stethoscope, tone: "violet" },
];

export default function ReceptionPatientsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [genderFilter, setGenderFilter] = useState("all");
  const [payload, setPayload] = useState({ items: [], stats: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
          {row.status === "active" ? "Hoạt động" : "Ngưng"}
        </Badge>
      ),
    },
    {
      key: "actions",
      title: "",
      render: (row) => (
        <div className="reception-patients__actions">
          <button
            className="dash-action-btn dash-action-btn--sm"
            title="Xem hồ sơ"
            type="button"
            onClick={() => navigate(`/app/reception/patients?code=${row.code}`)}
          >
            <FileText className="mc-icon mc-icon--sm" />
          </button>
          <button
            className="dash-action-btn dash-action-btn--sm"
            title="Tạo lịch hẹn"
            type="button"
            onClick={() => navigate("/book")}
          >
            <CalendarDays className="mc-icon mc-icon--sm" />
          </button>
        </div>
      ),
    },
  ];

  // Pre-fill search from ?code= param (e.g. from navigation links)
  useEffect(() => {
    const code = searchParams.get("code");
    if (code) setSearch(code.trim());
  }, [searchParams]);

  useEffect(() => {
    let mounted = true;

    async function loadPatients() {
      setLoading(true);
      setError("");
      try {
        const data = await getReceptionPatients();
        if (mounted) {
          setPayload(data);
        }
      } catch (loadError) {
        if (mounted) {
          setError(stripHtml(loadError.message) || "Không tải được danh sách bệnh nhân.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadPatients();
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(
    () =>
      (payload.items || []).filter((patient) => {
        const matchSearch =
          !search ||
          patient.name.toLowerCase().includes(search.toLowerCase()) ||
          patient.phone.includes(search) ||
          patient.code.includes(search);
        const matchGender = genderFilter === "all" || patient.gender === genderFilter;
        return matchSearch && matchGender;
      }),
    [genderFilter, payload.items, search]
  );

  return (
    <div className="dash-page reception-patients">
      <div className="dash-page-header">
        <div>
          <h1 className="dash-page-title">Quản lý bệnh nhân</h1>
          <p className="dash-page-sub">Danh sách hồ sơ bệnh nhân tại Cơ sở Hải Châu</p>
        </div>
        <button className="dash-btn-primary" type="button" onClick={() => navigate("/book")}>
          + Thêm bệnh nhân
        </button>
      </div>

      <div className="dash-stats-row">
        {STAT_CARDS.map((card) => (
          <div key={card.key} className={`dash-stat-card reception-patients__stat-card reception-patients__stat-card--${card.tone}`}>
            <div className="dash-stat-icon">{React.createElement(card.icon, { className: "mc-icon mc-icon--md" })}</div>
            <div className="dash-stat-val">{payload.stats?.[card.key] || 0}</div>
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
        <select className="dash-filter-select" value={genderFilter} onChange={(event) => setGenderFilter(event.target.value)}>
          <option value="all">Tất cả giới tính</option>
          <option value="Nam">Nam</option>
          <option value="Nữ">Nữ</option>
          <option value="Khác">Khác</option>
        </select>
      </div>

      {loading ? <div className="dash-page-sub">Đang tải dữ liệu bệnh nhân...</div> : null}
      {error ? <div className="dash-page-sub">{error}</div> : null}
      {!loading && !error && <Table columns={COLUMNS} data={filtered} emptyMessage="Không tìm thấy bệnh nhân." />}
    </div>
  );
}


