import React, { useEffect, useState, useRef } from "react";
import {
  CalendarDays,
  CalendarOff,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { doctorApi } from "../../../services/doctorApi";
import "./WorkSchedulePage.css";

function stripHtml(raw) {
  if (typeof raw !== "string") return "";
  return raw
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim() || "Đã xảy ra lỗi.";
}

const WEEKDAY_LABELS = [
  { value: 0, short: "T2", full: "Thứ Hai" },
  { value: 1, short: "T3", full: "Thứ Ba" },
  { value: 2, short: "T4", full: "Thứ Tư" },
  { value: 3, short: "T5", full: "Thứ Năm" },
  { value: 4, short: "T6", full: "Thứ Sáu" },
  { value: 5, short: "T7", full: "Thứ Bảy" },
  { value: 6, short: "CN", full: "Chủ Nhật" },
];

function getWeekDates(date) {
  const d = new Date(date);
  const day = d.getDay();
  const monday = new Date(d);
  monday.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
  return Array.from({ length: 7 }, (_, i) => {
    const nd = new Date(monday);
    nd.setDate(monday.getDate() + i);
    return nd;
  });
}

function getMonthDates(year, month) {
  const firstDay = new Date(year, month, 1);
  const startDow = firstDay.getDay();
  const offset = startDow === 0 ? -6 : 1 - startDow;
  const gridStart = new Date(firstDay);
  gridStart.setDate(firstDay.getDate() + offset);
  return Array.from({ length: 42 }, (_, i) => {
    const nd = new Date(gridStart);
    nd.setDate(gridStart.getDate() + i);
    return nd;
  });
}

function formatDateISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function getMonthLabel(year, month) {
  return `${month + 1 === 5 ? "Tháng 5" : new Date(year, month).toLocaleDateString("vi-VN", { month: "long", year: "numeric" })}`.replace(
    /^(Tháng \d+) (\d+)$/,
    (_, m, y) => `${m} ${y}`
  );
}

function getWeekLabel(dates) {
  if (!dates.length) return "";
  const first = dates[0];
  const last = dates[dates.length - 1];
  if (first.getMonth() === last.getMonth()) {
    return `${first.getDate()} – ${last.getDate()} ${first.toLocaleDateString("vi-VN", { month: "long" })}, ${first.getFullYear()}`;
  }
  return `${first.getDate()} ${first.toLocaleDateString("vi-VN", { month: "short" })} – ${last.getDate()} ${last.toLocaleDateString("vi-VN", { month: "short" })}, ${last.getFullYear()}`;
}

export default function DoctorWorkSchedulePage() {
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [scheduleMsg, setScheduleMsg] = useState({ type: "", text: "" });

  const [workDays, setWorkDays] = useState({});
  const [timeOffs, setTimeOffs] = useState([]);

  const [viewMode, setViewMode] = useState("month");
  const [currentDate, setCurrentDate] = useState(new Date());

  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedDateStatus, setSelectedDateStatus] = useState(null);
  const [selectedDateReason, setSelectedDateReason] = useState("");
  const [showDayModal, setShowDayModal] = useState(false);
  const [savingDay, setSavingDay] = useState(false);

  const [deletingId, setDeletingId] = useState(null);

  const modalRef = useRef(null);

  useEffect(() => {
    loadScheduleConfig();
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        setShowDayModal(false);
      }
    }
    if (showDayModal) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showDayModal]);

  async function loadScheduleConfig() {
    setScheduleLoading(true);
    setScheduleMsg({ type: "", text: "" });
    try {
      const data = await doctorApi.getScheduleConfig();
      const daysMap = {};
      for (const item of data.schedule) {
        daysMap[item.weekday] = item.isWorking;
      }
      setWorkDays(daysMap);
      setTimeOffs(data.timeOffs || []);
    } catch (err) {
      setScheduleMsg({
        type: "error",
        text: stripHtml(err.message) || "Không tải được lịch làm việc.",
      });
    } finally {
      setScheduleLoading(false);
    }
  }

  async function handleSaveAll() {
    setScheduleSaving(true);
    setScheduleMsg({ type: "", text: "" });
    try {
      const schedule = WEEKDAY_LABELS.map((d) => ({
        weekday: d.value,
        isWorking: Boolean(workDays[d.value]),
      }));
      await doctorApi.updateScheduleConfig({ schedule });
      setScheduleMsg({ type: "success", text: "Lưu lịch làm việc thành công." });
      setTimeout(() => setScheduleMsg({ type: "", text: "" }), 3000);
    } catch (err) {
      setScheduleMsg({
        type: "error",
        text: stripHtml(err.message) || "Lưu thất bại.",
      });
    } finally {
      setScheduleSaving(false);
    }
  }

  function handleDayClick(date) {
    const iso = formatDateISO(date);
    const dow = date.getDay();
    const adjustedDow = dow === 0 ? 6 : dow - 1;

    const existingTimeOff = timeOffs.find((t) => t.offDate === iso);

    setSelectedDate(date);
    setSelectedDateReason(existingTimeOff?.reason || "");
    setSelectedDateStatus(
      existingTimeOff
        ? "timeoff"
        : workDays[adjustedDow]
        ? "work"
        : "off"
    );
    setShowDayModal(true);
  }

  async function handleConfirmDay() {
    if (!selectedDate) return;
    setSavingDay(true);
    const iso = formatDateISO(selectedDate);

    try {
      if (selectedDateStatus === "timeoff") {
        if (selectedDateReason.trim()) {
          const newItem = await doctorApi.addTimeOff({
            offDate: iso,
            reason: selectedDateReason.trim(),
          });
          setTimeOffs((prev) =>
            [...prev.filter((t) => t.offDate !== iso), newItem].sort((a, b) =>
              a.offDate.localeCompare(b.offDate)
            )
          );
        }
      } else {
        if (selectedDateStatus === "off") {
          await doctorApi.deleteTimeOff(
            timeOffs.find((t) => t.offDate === iso)?.id
          );
          setTimeOffs((prev) => prev.filter((t) => t.offDate !== iso));
        }
      }
      setShowDayModal(false);
      setScheduleMsg({ type: "success", text: "Cập nhật ngày thành công." });
      setTimeout(() => setScheduleMsg({ type: "", text: "" }), 2000);
    } catch (err) {
      setScheduleMsg({
        type: "error",
        text: stripHtml(err.message) || "Cập nhật thất bại.",
      });
    } finally {
      setSavingDay(false);
    }
  }

  async function handleDeleteTimeOff(id) {
    setDeletingId(id);
    try {
      await doctorApi.deleteTimeOff(id);
      setTimeOffs((prev) => prev.filter((t) => t.id !== id));
      setScheduleMsg({ type: "success", text: "Đã xóa ngày nghỉ." });
      setTimeout(() => setScheduleMsg({ type: "", text: "" }), 2000);
    } catch (err) {
      setScheduleMsg({
        type: "error",
        text: stripHtml(err.message) || "Xóa thất bại.",
      });
    } finally {
      setDeletingId(null);
    }
  }

  function navigatePrev() {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      if (viewMode === "month") {
        d.setMonth(d.getMonth() - 1);
      } else {
        d.setDate(d.getDate() - 7);
      }
      return d;
    });
  }

  function navigateNext() {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      if (viewMode === "month") {
        d.setMonth(d.getMonth() + 1);
      } else {
        d.setDate(d.getDate() + 7);
      }
      return d;
    });
  }

  function navigateToday() {
    setCurrentDate(new Date());
  }

  const monthDates = getMonthDates(
    currentDate.getFullYear(),
    currentDate.getMonth()
  );
  const weekDates = getWeekDates(currentDate);
  const displayDates = viewMode === "month" ? monthDates : weekDates;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  function getDayStatus(date) {
    const iso = formatDateISO(date);
    const dow = date.getDay();
    const adjustedDow = dow === 0 ? 6 : dow - 1;
    const isWorkDay = Boolean(workDays[adjustedDow]);
    const timeOff = timeOffs.find((t) => t.offDate === iso);
    const isPast = date < today;
    const isToday = isSameDay(date, today);
    const isCurrentMonth = date.getMonth() === currentDate.getMonth();

    return {
      status: timeOff ? "timeoff" : isWorkDay ? "work" : "off",
      timeOff,
      isPast,
      isToday,
      isCurrentMonth,
    };
  }

  const upcomingTimeOffs = timeOffs
    .filter((t) => t.offDate >= formatDateISO(today))
    .slice(0, 8);

  const workDaysCount = Object.values(workDays).filter(Boolean).length;

  if (scheduleLoading) {
    return (
      <div className="doc-work-schedule-page">
        <div className="doc-work-schedule-loading">Đang tải lịch làm việc...</div>
      </div>
    );
  }

  return (
    <div className="doc-work-schedule-page">
      {/* ── Header ── */}
      <div className="doc-work-schedule-header">
        <div>
          <h1 className="dash-page-title">Lịch làm việc</h1>
          <p className="dash-page-sub">
            Click vào ngày để đặt làm việc / nghỉ / nghỉ phép
          </p>
        </div>
        <div className="doc-work-schedule-header-actions">
          <div className="doc-view-toggle">
            <button
              type="button"
              className={`doc-view-toggle-btn ${viewMode === "week" ? "active" : ""}`}
              onClick={() => setViewMode("week")}
            >
              Tuần
            </button>
            <button
              type="button"
              className={`doc-view-toggle-btn ${viewMode === "month" ? "active" : ""}`}
              onClick={() => setViewMode("month")}
            >
              Tháng
            </button>
          </div>
          <button
            type="button"
            className="dash-btn-primary doc-work-schedule-save"
            onClick={handleSaveAll}
            disabled={scheduleSaving}
          >
            {scheduleSaving ? "Đang lưu..." : "Lưu lịch"}
          </button>
        </div>
      </div>

      {scheduleMsg.text && (
        <div
          className={`doc-work-schedule-msg doc-work-schedule-msg--${scheduleMsg.type}`}
        >
          {scheduleMsg.text}
        </div>
      )}

      {/* ── Calendar ── */}
      <div className="doc-work-schedule-calendar">
        {/* Nav */}
        <div className="doc-cal-nav">
          <button
            type="button"
            className="doc-cal-nav-btn"
            onClick={navigatePrev}
          >
            <ChevronLeft size={18} />
          </button>
          <div className="doc-cal-nav-title">
            {viewMode === "month"
              ? getMonthLabel(currentDate.getFullYear(), currentDate.getMonth())
              : getWeekLabel(weekDates)}
          </div>
          <button
            type="button"
            className="doc-cal-nav-btn"
            onClick={navigateNext}
          >
            <ChevronRight size={18} />
          </button>
          <button
            type="button"
            className="doc-cal-nav-today"
            onClick={navigateToday}
          >
            Hôm nay
          </button>
        </div>

        {/* Weekday header */}
        <div className="doc-cal-grid doc-cal-grid--header">
          {WEEKDAY_LABELS.map((d) => (
            <div key={d.value} className="doc-cal-header-cell">
              <span className="doc-cal-header-full">{d.full}</span>
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div
          className={`doc-cal-grid ${viewMode === "week" ? "doc-cal-grid--week" : ""}`}
        >
          {displayDates.map((date, idx) => {
            const { status, timeOff, isToday, isCurrentMonth } = getDayStatus(date);

            return (
              <button
                key={idx}
                type="button"
                className={[
                  "doc-cal-cell",
                  isToday ? "doc-cal-cell--today" : "",
                  !isCurrentMonth ? "doc-cal-cell--other-month" : "",
                  status === "timeoff" ? "doc-cal-cell--timeoff" : "",
                  status === "work" ? "doc-cal-cell--work" : "",
                  viewMode === "month" ? "doc-cal-cell--compact" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => handleDayClick(date)}
                title={
                  status === "work"
                    ? `${date.getDate()} - Làm việc (click để thay đổi)`
                    : status === "timeoff"
                    ? `${date.getDate()} - ${timeOff?.reason || "Nghỉ phép"} (click để thay đổi)`
                    : `${date.getDate()} - Nghỉ (click để đặt làm việc)`
                }
              >
                <div className="doc-cal-cell-header">
                  <span className="doc-cal-cell-num">{date.getDate()}</span>
                  {isToday && <span className="doc-cal-cell-today-dot" />}
                </div>
                <div className="doc-cal-cell-body">
                  {status === "work" && (
                    <span className="doc-cal-cell-label doc-cal-cell-label--work">
                      Làm việc
                    </span>
                  )}
                  {status === "timeoff" && (
                    <span
                      className="doc-cal-cell-label doc-cal-cell-label--timeoff"
                      title={timeOff?.reason}
                    >
                      {timeOff?.reason?.length > 12
                        ? timeOff.reason.slice(0, 12) + "…"
                        : timeOff?.reason || "Nghỉ phép"}
                    </span>
                  )}
                  {status === "off" && (
                    <span className="doc-cal-cell-label doc-cal-cell-label--off">
                      Nghỉ
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="doc-cal-legend">
          <div className="doc-legend-item">
            <div className="doc-legend-dot doc-legend-dot--work" />
            <span>Làm việc</span>
          </div>
          <div className="doc-legend-item">
            <div className="doc-legend-dot doc-legend-dot--timeoff" />
            <span>Nghỉ phép</span>
          </div>
          <div className="doc-legend-item">
            <div className="doc-legend-dot doc-legend-dot--off" />
            <span>Nghỉ</span>
          </div>
          <span className="doc-cal-legend-hint">
            · Click vào ngày để thay đổi trạng thái
          </span>
        </div>
      </div>

      {/* ── Quick weekday summary ── */}
      <div className="doc-work-schedule-summary">
        {WEEKDAY_LABELS.map((day) => {
          const isWorking = Boolean(workDays[day.value]);
          return (
            <button
              key={day.value}
              type="button"
              className={`doc-summary-day ${isWorking ? "active" : ""}`}
              onClick={() =>
                setWorkDays((prev) => ({ ...prev, [day.value]: !prev[day.value] }))
              }
              title={`${day.full}: ${isWorking ? "Làm việc (click đổi nghỉ)" : "Nghỉ (click đổi làm việc)"}`}
            >
              <span className="doc-summary-day__short">{day.short}</span>
              <span className="doc-summary-day__status">
                {isWorking ? "Làm" : "Nghỉ"}
              </span>
            </button>
          );
        })}
        <div className="doc-summary-count">
          <span className="doc-summary-count__num">{workDaysCount}</span>
          <span className="doc-summary-count__label">ngày/tuần</span>
        </div>
      </div>

      {/* ── Upcoming time offs ── */}
      {upcomingTimeOffs.length > 0 && (
        <div className="doc-work-schedule-timeoff-list">
          <div className="doc-work-schedule-section-title">
            <CalendarOff size={15} />
            Ngày nghỉ phép sắp tới
          </div>
          <div className="doc-timeoff-cards">
            {upcomingTimeOffs.map((item) => (
              <div key={item.id} className="doc-timeoff-card">
                <div className="doc-timeoff-card__date">
                  <div className="doc-timeoff-card__day">
                    {item.offDate.split("-")[2]}
                  </div>
                  <div className="doc-timeoff-card__month">
                    {new Date(item.offDate + "T00:00:00").toLocaleDateString(
                      "vi-VN",
                      { month: "short", year: "numeric" }
                    )}
                  </div>
                </div>
                <div className="doc-timeoff-card__info">
                  <div className="doc-timeoff-card__reason">
                    {item.reason || "Nghỉ phép"}
                  </div>
                  <div className="doc-timeoff-card__dow">
                    {(() => {
                      const dow = new Date(item.offDate + "T00:00:00").getDay();
                      const adj = dow === 0 ? 6 : dow - 1;
                      return WEEKDAY_LABELS[adj]?.full || "";
                    })()}
                  </div>
                </div>
                <button
                  type="button"
                  className="doc-timeoff-card__delete"
                  onClick={() => handleDeleteTimeOff(item.id)}
                  disabled={deletingId === item.id}
                  title="Xóa ngày nghỉ"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Day edit modal ── */}
      {showDayModal && selectedDate && (
        <div className="doc-day-modal-overlay">
          <div className="doc-day-modal" ref={modalRef}>
            <div className="doc-day-modal__header">
              <div className="doc-day-modal__title">
                <CalendarDays size={18} />
                {selectedDate.getDate()}{" "}
                {selectedDate.toLocaleDateString("vi-VN", {
                  month: "long",
                  year: "numeric",
                })}
              </div>
              <button
                type="button"
                className="doc-day-modal__close"
                onClick={() => setShowDayModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="doc-day-modal__body">
              <div className="doc-day-modal__status-group">
                <button
                  type="button"
                  className={`doc-day-status-btn ${selectedDateStatus === "work" ? "active" : ""}`}
                  onClick={() => setSelectedDateStatus("work")}
                >
                  <CalendarDays size={20} />
                  <span className="doc-day-status-btn__label">Làm việc</span>
                  <span className="doc-day-status-btn__hint">
                    Bệnh nhân có thể đặt lịch
                  </span>
                </button>
                <button
                  type="button"
                  className={`doc-day-status-btn ${selectedDateStatus === "off" ? "active" : ""}`}
                  onClick={() => setSelectedDateStatus("off")}
                >
                  <CalendarOff size={20} />
                  <span className="doc-day-status-btn__label">Nghỉ</span>
                  <span className="doc-day-status-btn__hint">
                    Theo lịch ngày trong tuần
                  </span>
                </button>
                <button
                  type="button"
                  className={`doc-day-status-btn ${selectedDateStatus === "timeoff" ? "active" : ""}`}
                  onClick={() => setSelectedDateStatus("timeoff")}
                >
                  <CalendarOff size={20} />
                  <span className="doc-day-status-btn__label">Nghỉ phép</span>
                  <span className="doc-day-status-btn__hint">
                    Ngày nghỉ cụ thể
                  </span>
                </button>
              </div>

              {selectedDateStatus === "timeoff" && (
                <div className="doc-day-modal__reason">
                  <label className="doc-profile-field__label">Lý do nghỉ phép</label>
                  <input
                    type="text"
                    className="doc-profile-field__input"
                    placeholder="VD: Nghỉ phép năm, Công tác..."
                    value={selectedDateReason}
                    onChange={(e) => setSelectedDateReason(e.target.value)}
                    maxLength={100}
                    autoFocus
                  />
                </div>
              )}
            </div>

            <div className="doc-day-modal__footer">
              <button
                type="button"
                className="doc-day-modal__cancel"
                onClick={() => setShowDayModal(false)}
              >
                Hủy
              </button>
              <button
                type="button"
                className="dash-btn-primary"
                onClick={handleConfirmDay}
                disabled={savingDay}
              >
                {savingDay ? "Đang lưu..." : "Xác nhận"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
