import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays, CircleCheck, Clock3, Play, ScanLine } from "lucide-react";
import Badge from "../../../components/Badge/Badge";
import { getDoctorSchedule } from "../../../services/doctorApi";
import "./SchedulePage.css";

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

function formatHeaderDate(dateValue) {
  if (!dateValue) {
    return new Date().toLocaleDateString("vi-VN", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  return new Date(`${dateValue}T00:00:00`).toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function SchedulePage() {
  const navigate = useNavigate();
  const [schedule, setSchedule] = useState({ doctorName: "", specialtyName: "", date: "", items: [] });
  const [selectedDate, setSelectedDate] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadSchedule() {
      setLoading(true);
      setError("");
      try {
        const data = await getDoctorSchedule(selectedDate || undefined);
        if (mounted) {
          setSchedule(data);
        }
      } catch (loadError) {
        if (mounted) {
          setError(loadError.message || "Không tải được lịch khám.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadSchedule();
    return () => {
      mounted = false;
    };
  }, [selectedDate]);

  const filteredItems = useMemo(() => {
    if (activeFilter === "all") {
      return schedule.items || [];
    }
    return (schedule.items || []).filter((item) => item.status === activeFilter);
  }, [activeFilter, schedule.items]);

  const stats = useMemo(
    () => ({
      total: schedule.items?.length || 0,
      waiting: (schedule.items || []).filter((item) => item.status === "waiting" || item.status === "checked_in").length,
      inProgress: (schedule.items || []).filter((item) => item.status === "in_progress").length,
      done: (schedule.items || []).filter((item) => item.status === "done").length,
    }),
    [schedule.items]
  );

  return (
    <div className="dash-page my-schedule-page">
      <div className="dash-page-header">
        <div>
          <h1 className="dash-page-title">Lịch khám của tôi</h1>
          <p className="dash-page-sub">
          <CalendarDays size={16} /> {formatHeaderDate(schedule.date)}
          </p>
        </div>

        <div className="my-schedule-page__header-actions">
          <input
            type="date"
            className="my-schedule-page__date-input"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
          />

          <div className="my-schedule-page__doctor-chip">
            {schedule.doctorName || "Bác sĩ"}
            {schedule.specialtyName ? ` · ${schedule.specialtyName}` : ""}
          </div>
        </div>
      </div>
      
      <div className="dash-stats-row">
        {STAT_CARDS.map((card) => (
          <div
            key={card.key}
            className={`dash-stat-card my-schedule-page__stat-card my-schedule-page__stat-card--${card.tone}`}
          >
            <div className="dash-stat-icon my-schedule-page__stat-text">
              {React.createElement(card.icon, { className: "mc-icon mc-icon--md" })}
            </div>
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

      {loading && <div className="schedule-list">Đang tải lịch khám...</div>}
      {!loading && error && <div className="schedule-list">{error}</div>}
      {!loading && !error && filteredItems.length === 0 && <div className="schedule-list">Không có lịch khám phù hợp.</div>}

      {!loading && !error && filteredItems.length > 0 && (
        <div className="schedule-list">
          {filteredItems.map((item) => {
            const cfg = STATUS_MAP[item.status] || STATUS_MAP.waiting;
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
                      {(item.status === "waiting" || item.status === "checked_in" || item.status === "in_progress") && (
                        <button
                          className="dash-action-btn dash-action-btn--primary my-schedule-page__start-btn"
                          type="button"
                          onClick={() => navigate(`/app/doctor/visit/${item.code}`)}
                        >
                          {item.status === "in_progress" ? "Tiếp tục khám" : "Bắt đầu khám"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


