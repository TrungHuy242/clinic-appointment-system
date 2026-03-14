import React, { useEffect, useState } from "react";
import { CalendarDays, CheckCircle2, CircleX, Plus, ScanLine, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Badge from "../../../../shared/components/Badge/Badge";
import Button from "../../../../shared/components/Button/Button";
import LoadingSpinner from "../../../../shared/components/LoadingSpinner/LoadingSpinner";
import Table from "../../../../shared/components/Table/Table";
import { listTodayAppointments } from "../../services/appointmentsApi";
import "./ReceptionAppointmentsPage.css";

const STATUS_CONFIG = {
  CONFIRMED: { label: "Ðã xác nh?n", variant: "success" },
  PENDING: { label: "Ch? xác nh?n", variant: "warning" },
  PENDING_PA1: { label: "Ch? xác nh?n", variant: "warning" },
  CHECKED_IN: { label: "Ðã check-in", variant: "info" },
  CANCELLED: { label: "Ðã h?y", variant: "danger" },
  COMPLETED: { label: "Hoàn t?t", variant: "neutral" },
};

const STAT_CARDS = [
  { key: "total", label: "T?ng l?ch h?n", icon: CalendarDays, tone: "sky" },
  { key: "confirmed", label: "Ðã xác nh?n", icon: CheckCircle2, tone: "green" },
  { key: "checkedIn", label: "Ðã check-in", icon: ScanLine, tone: "blue" },
  { key: "cancelled", label: "Ðã h?y", icon: CircleX, tone: "red" },
];

export default function ReceptionAppointmentsPage() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    setLoading(true);
    listTodayAppointments(date)
      .then(setAppointments)
      .finally(() => setLoading(false));
  }, [date]);

  const filtered = appointments.filter((appointment) => {
    const matchSearch =
      !search ||
      appointment.patientName?.toLowerCase().includes(search.toLowerCase()) ||
      appointment.code?.toUpperCase().includes(search.toUpperCase());
    const matchStatus = filterStatus === "all" || appointment.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: appointments.length,
    confirmed: appointments.filter((item) => item.status === "CONFIRMED").length,
    checkedIn: appointments.filter((item) => item.status === "CHECKED_IN").length,
    cancelled: appointments.filter((item) => item.status === "CANCELLED").length,
  };

  const columns = [
    {
      key: "code",
      title: "Mã l?ch h?n",
      render: (row) => <span className="reception-appointments__code">{row.code}</span>,
    },
    { key: "patientName", title: "B?nh nhân", dataIndex: "patientName" },
    { key: "specialty", title: "Chuyên khoa", dataIndex: "specialty" },
    {
      key: "slot",
      title: "Gi? h?n",
      render: (row) => <span className="reception-appointments__slot">{row.slot}</span>,
    },
    {
      key: "status",
      title: "Tr?ng thái",
      render: (row) => {
        const cfg = STATUS_CONFIG[row.status] ?? { label: row.status, variant: "neutral" };
        return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
      },
    },
    {
      key: "actions",
      title: "",
      render: (row) => (
        <div className="reception-appointments__actions">
          <button
            className="dash-action-btn dash-action-btn--sm"
            title="Chi ti?t"
            type="button"
            onClick={() => navigate(`/booking-success/${row.code}`)}
          >
            <Search size={16} />
          </button>
          {row.status === "CONFIRMED" && (
            <button
              className="dash-action-btn dash-action-btn--sm dash-action-btn--primary"
              title="Check-in"
              type="button"
              onClick={() => navigate("/app/reception/checkin")}
            >
              <CheckCircle2 size={16} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="dash-page reception-appointments">
      <div className="dash-page-header">
        <div>
          <h1 className="dash-page-title">Qu?n lý l?ch h?n</h1>
          <p className="dash-page-sub">Theo dõi và c?p nh?t tr?ng thái l?ch h?n trong ngày</p>
        </div>
        <div className="reception-appointments__header-actions">
          <input
            className="reception-appointments__date-input"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
          <Button size="sm" onClick={() => navigate("/book")}>
            <Plus className="mc-icon mc-icon--sm" />
            T?o l?ch h?n
          </Button>
        </div>
      </div>

      <div className="dash-stats-row">
        {STAT_CARDS.map((card) => (
          <div
            key={card.key}
            className={`dash-stat-card reception-appointments__stat-card reception-appointments__stat-card--${card.tone}`}
          >
            <div className="dash-stat-icon reception-appointments__stat-text">
              {React.createElement(card.icon, { className: "mc-icon mc-icon--md" })}
            </div>
            <div className="dash-stat-val">{stats[card.key]}</div>
            <div className="dash-stat-label">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="dash-filter-bar">
        <input
          className="dash-search-input"
          placeholder="Tìm b?nh nhân, mã l?ch h?n..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <select
          className="dash-filter-select"
          value={filterStatus}
          onChange={(event) => setFilterStatus(event.target.value)}
        >
          <option value="all">T?t c? tr?ng thái</option>
          {Object.entries(STATUS_CONFIG).map(([key, value]) => (
            <option key={key} value={key}>
              {value.label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="reception-appointments__loading">
          <LoadingSpinner />
        </div>
      ) : (
        <Table columns={columns} data={filtered} emptyMessage="Không có l?ch h?n nào phù h?p." />
      )}
    </div>
  );
}
