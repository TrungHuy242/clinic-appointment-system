import React, { useState } from "react";
import { CalendarDays, CircleCheck, Clock3, Play, ScanLine } from "lucide-react";
import Badge from "../../../../shared/components/Badge/Badge";
import "./MySchedulePage.css";

const MOCK_SCHEDULE = [
  {
    time: "08:00",
    patientName: "Nguyễn Văn An",
    phone: "0901234567",
    service: "Da liễu - Khám lần đầu",
    status: "waiting",
    code: "APT-2026-0011",
  },
  {
    time: "08:50",
    patientName: "Trần Thị Bình",
    phone: "0912345678",
    service: "Da liễu - Tái khám",
    status: "checked_in",
    code: "APT-2026-0012",
  },
  {
    time: "09:15",
    patientName: "Lê Văn Cường",
    phone: "0934567890",
    service: "Da liễu - Kê đơn",
    status: "in_progress",
    code: "APT-2026-0013",
  },
  {
    time: "09:40",
    patientName: "Phạm Thị Dung",
    phone: "0945678901",
    service: "Da liễu - Khám lần đầu",
    status: "done",
    code: "APT-2026-0014",
  },
  {
    time: "10:05",
    patientName: "Hoàng Anh Em",
    phone: "0956789012",
    service: "Da liễu - Tái khám",
    status: "waiting",
    code: "APT-2026-0015",
  },
  {
    time: "10:30",
    patientName: "Vũ Thị Phương",
    phone: "0967890123",
    service: "Da liễu - Tư vấn",
    status: "waiting",
    code: "APT-2026-0016",
  },
  {
    time: "14:00",
    patientName: "Mai Văn Quốc",
    phone: "0978901234",
    service: "Da liễu - Khám lần đầu",
    status: "waiting",
    code: "APT-2026-0017",
  },
];

const STATUS_MAP = {
  waiting: { label: "Chờ khám", variant: "neutral", icon: Clock3 },
  checked_in: { label: "Đã check-in", variant: "info", icon: ScanLine },
  in_progress: { label: "Đang khám", variant: "warning", icon: Play },
  done: { label: "Hoàn tất", variant: "success", icon: CircleCheck },
};

const STAT_CARDS = [
  { key: "total", label: "Tổng lịch hẹn", icon: CalendarDays, tone: "sky" },
  { key: "waiting", label: "Chờ khám", icon: Clock3, tone: "yellow" },
  { key: "inProgress", label: "Đang khám", icon: Play, tone: "blue" },
  { key: "done", label: "Hoàn tất", icon: CircleCheck, tone: "green" },
];

export default function MySchedulePage() {
  const [today] = useState(
    new Date().toLocaleDateString("vi-VN", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  );
  const [activeFilter, setActiveFilter] = useState("all");

  const filtered =
    activeFilter === "all"
      ? MOCK_SCHEDULE
      : MOCK_SCHEDULE.filter((item) => item.status === activeFilter);

  const stats = {
    total: MOCK_SCHEDULE.length,
    waiting: MOCK_SCHEDULE.filter((item) => item.status === "waiting").length,
    inProgress: MOCK_SCHEDULE.filter((item) => item.status === "in_progress").length,
    done: MOCK_SCHEDULE.filter((item) => item.status === "done").length,
  };

  return (
    <div className="dash-page my-schedule-page">
      <div className="dash-page-header">
        <div>
          <h1 className="dash-page-title">Lịch khám của tôi</h1>
          <p className="dash-page-sub">
            <CalendarDays size={16} /> {today}
          </p>
        </div>
        <div className="my-schedule-page__doctor-chip">BS. Nguyễn Thị Sarah · Da liễu</div>
      </div>

      <div className="dash-stats-row">
        {STAT_CARDS.map((card) => (
          <div
            key={card.key}
            className={`dash-stat-card my-schedule-page__stat-card my-schedule-page__stat-card--${card.tone}`}
          >
            <div className="dash-stat-icon my-schedule-page__stat-text">{React.createElement(card.icon, { className: "mc-icon mc-icon--md" })}</div>
            <div className="dash-stat-val">{stats[card.key]}</div>
            <div className="dash-stat-label">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="dash-filter-tabs">
        {[
          { key: "all", label: "Tất cả" },
          { key: "waiting", label: "Chờ khám" },
          { key: "in_progress", label: "Đang khám" },
          { key: "done", label: "Hoàn tất" },
        ].map((filter) => (
          <button
            key={filter.key}
            className={`dash-filter-tab ${activeFilter === filter.key ? "active" : ""}`}
            onClick={() => setActiveFilter(filter.key)}
            type="button"
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="schedule-list">
        {filtered.map((item) => {
          const cfg = STATUS_MAP[item.status];
          const StatusIcon = cfg.icon;
          return (
            <div
              key={item.code}
              className={`schedule-item ${item.status === "in_progress" ? "schedule-item--active" : ""} ${item.status === "done" ? "schedule-item--done" : ""}`}
            >
              <div className="schedule-item__time">
                <div className="schedule-time-val">{item.time}</div>
              </div>
              <div className="schedule-item__dot">
                <div className={`schedule-dot schedule-dot--${item.status}`} />
              </div>
              <div className="schedule-item__content">
                <div className="my-schedule-page__row">
                  <div>
                    <div className="my-schedule-page__patient-name">{item.patientName}</div>
                    <div className="my-schedule-page__patient-meta">
                      {item.phone} · {item.code}
                    </div>
                    <div className="my-schedule-page__patient-service">{item.service}</div>
                  </div>
                  <div className="my-schedule-page__actions">
                    <Badge variant={cfg.variant}>
                      <StatusIcon size={14} /> {cfg.label}
                    </Badge>
                    {(item.status === "waiting" || item.status === "checked_in") && (
                      <button
                        className="dash-action-btn dash-action-btn--primary my-schedule-page__start-btn"
                        type="button"
                      >
                        Bắt đầu khám
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}