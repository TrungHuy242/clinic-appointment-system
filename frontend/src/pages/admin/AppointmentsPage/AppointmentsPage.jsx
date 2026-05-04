import React, { useState, useEffect } from "react";
import { CalendarClock, CalendarRange } from "lucide-react";
import Button from "../../../components/Button/Button";
import LoadingSpinner from "../../../components/LoadingSpinner/LoadingSpinner";
import Modal from "../../../components/Modal/Modal";
import RescheduleModal from "./RescheduleModal";
import { listAppointments, updateAppointmentStatus, getAppointmentHistory } from "../../../services/adminApi";
import { getStatusLabel, statusToClass } from "../../../services/formatters";
import "./AppointmentsPage.css";

function stripHtml(raw) {
  if (typeof raw !== "string") return "";
  return raw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() || "Đã xảy ra lỗi.";
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

export default function AppointmentsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [historyData, setHistoryData] = useState([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState(todayStr());
  const [showAllDays, setShowAllDays] = useState(true);

  // Summary
  const [summary, setSummary] = useState({
    total: 0, pending: 0, confirmed: 0,
    checked_in: 0, completed: 0, cancelled: 0, no_show: 0,
  });

  // Sort
  const [sortField, setSortField] = useState("scheduled_start");
  const [sortDir, setSortDir] = useState("asc");

  // Selection
  const [selectedId, setSelectedId] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);

  // Modals
  const [confirmModal, setConfirmModal] = useState({ open: false, appointment: null });
  const [checkInModal, setCheckInModal] = useState({ open: false, appointment: null });
  const [cancelModal, setCancelModal] = useState({ open: false, appointment: null });
  const [noShowModal, setNoShowModal] = useState({ open: false, appointment: null });
  const [rescheduleModal, setRescheduleModal] = useState({ open: false, appointment: null });
  const [historyModal, setHistoryModal] = useState({ open: false, appointment: null });

  // ── Load ────────────────────────────────────────────────────────────────
  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (!showAllDays && dateFilter) params.date = dateFilter;
      if (statusFilter !== "ALL") params.status = statusFilter;
      if (searchQuery.trim()) params.q = searchQuery.trim();

      const data = await listAppointments(params);
      const list = Array.isArray(data.results) ? data.results : Array.isArray(data) ? data : [];
      const sm = data.summary || summary;
      setRows(list);
      setSummary(sm);
    } catch (err) {
      setError(stripHtml(err.message) || "Không tải được lịch hẹn.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-load when filters change
  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(loadData, 300);
      return () => clearTimeout(timer);
    }
  }, [statusFilter, dateFilter, showAllDays]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update selected row when rows change
  useEffect(() => {
    if (selectedId !== null) {
      const found = rows.find((r) => r.id === selectedId);
      setSelectedRow(found || null);
    } else {
      setSelectedRow(null);
    }
  }, [rows, selectedId]);

  // ── Sort + filter (client-side for current page) ───────────────────────
  const sortedRows = [...rows].sort((a, b) => {
    let aVal = a[sortField] ?? "";
    let bVal = b[sortField] ?? "";
    if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  function handleSort(field) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  }

  function handleReset() {
    setSearchQuery("");
    setStatusFilter("ALL");
    setDateFilter(todayStr());
    setShowAllDays(false);
    setSelectedId(null);
  }

  // ── Status update ──────────────────────────────────────────────────────
  async function doUpdateStatus(id, newStatus, extra = {}) {
    setSaving(true);
    try {
      await updateAppointmentStatus(id, newStatus, extra);
      await loadData();
      setSelectedId(null);
    } catch (err) {
      setError(stripHtml(err.message) || "Cập nhật trạng thái thất bại.");
    } finally {
      setSaving(false);
    }
  }

  // ── History ─────────────────────────────────────────────────────────────
  async function loadHistory(appointmentId) {
    try {
      const data = await getAppointmentHistory(appointmentId);
      setHistoryData(Array.isArray(data) ? data : []);
    } catch {
      setHistoryData([]);
    }
  }

  function openHistoryModal(appointment) {
    loadHistory(appointment.id);
    setHistoryModal({ open: true, appointment });
  }

  function closeHistoryModal() {
    setHistoryModal({ open: false, appointment: null });
    setHistoryData([]);
  }

  const isSaving = saving;

  return (
    <div className="appt-page">
      {/* Header */}
      <div className="appt-page__header">
        <div className="appt-page__header-icon">
          <CalendarClock className="mc-icon mc-icon--md" />
        </div>
        <div>
          <h1 className="appt-page__title">Danh sách lịch hẹn</h1>
          <p className="appt-page__subtitle">Tất cả lịch hẹn trong hệ thống</p>
        </div>
      </div>

      {error && (
        <div className="appt-page__error">
          {error}
          <button type="button" className="appt-page__error-btn" onClick={() => setError("")}>×</button>
        </div>
      )}

      {/* Filters */}
      <div className="appt-page__filters">
        <input
          type="text"
          className="appt-page__search-input"
          placeholder="Tìm theo mã lịch, tên bệnh nhân..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setSelectedId(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") loadData();
          }}
        />
        <select
          className="appt-page__status-select"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setSelectedId(null);
          }}
        >
          <option value="ALL">Tất cả</option>
          <option value="PENDING">Chờ xác nhận</option>
          <option value="CONFIRMED">Đã xác nhận</option>
          <option value="CHECKED_IN">Đã check-in</option>
          <option value="IN_PROGRESS">Đang khám</option>
          <option value="COMPLETED">Đã hoàn thành</option>
          <option value="CANCELLED">Đã hủy</option>
          <option value="NO_SHOW">No-show</option>
        </select>
        <input
          type="date"
          className="appt-page__date-filter"
          value={dateFilter}
          onChange={(e) => {
            setDateFilter(e.target.value);
            setSelectedId(null);
          }}
        />
        <label className="appt-page__show-all-label">
          <input
            type="checkbox"
            checked={showAllDays}
            onChange={(e) => {
              setShowAllDays(e.target.checked);
              setSelectedId(null);
            }}
          />
          Tất cả ngày
        </label>
        <button
          className="appt-page__reset-btn"
          onClick={handleReset}
        >
          Đặt lại
        </button>
        <Button size="sm" onClick={loadData} disabled={loading}>
          {loading ? "Đang tải..." : "Làm mới"}
        </Button>
      </div>

      {/* Summary */}
      <div className="appt-page__summary">
        {[
          { key: "total",      label: "Tổng lịch hẹn",   value: summary.total },
          { key: "pending",    label: "Chờ xác nhận",     value: summary.pending },
          { key: "confirmed",  label: "Đã xác nhận",      value: summary.confirmed },
          { key: "checked_in", label: "Đã check-in",      value: summary.checked_in },
          { key: "completed",  label: "Hoàn thành",       value: summary.completed },
          { key: "cancelled",  label: "Đã hủy",           value: summary.cancelled },
          { key: "no_show",   label: "No-show",          value: summary.no_show },
        ].map((s) => (
          <div key={s.key} className="appt-page__summary-item">
            <div className="appt-page__summary-value">{s.value}</div>
            <div className="appt-page__summary-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="appt-page__table-wrap">
        {loading && rows.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center" }}>
            <LoadingSpinner />
          </div>
        ) : rows.length === 0 ? (
          <div className="appt-page__td-empty">
            Không tìm thấy lịch hẹn phù hợp
          </div>
        ) : (
          <table className="appt-page__table">
            <thead>
              <tr>
                <th
                  className="appt-page__th--sortable"
                  onClick={() => handleSort("code")}
                >
                  Mã lịch {sortField === "code" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                </th>
                <th
                  className="appt-page__th--sortable"
                  onClick={() => handleSort("scheduled_start")}
                >
                  Ngày {sortField === "scheduled_start" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                </th>
                <th>Bệnh nhân</th>
                <th>SĐT</th>
                <th>Bác sĩ</th>
                <th
                  className="appt-page__th--sortable"
                  onClick={() => handleSort("visit_type")}
                >
                  Loại khám
                </th>
                <th
                  className="appt-page__th--sortable"
                  onClick={() => handleSort("status")}
                >
                  Trạng thái {sortField === "status" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((row) => (
                <tr
                  key={row.id}
                  className={selectedId === row.id ? "appt-page__tr--selected" : ""}
                  onClick={() => setSelectedId(selectedId === row.id ? null : row.id)}
                >
                  <td className="appt-page__td-code">{row.code}</td>
                  <td>{row.scheduled_start ? row.scheduled_start.split("T")[0] : "—"}</td>
                  <td>{row.patient_full_name}</td>
                  <td>{row.patient_phone}</td>
                  <td>{row.doctor_name || "—"}</td>
                  <td>{row.visit_type_label || row.visit_type || "—"}</td>
                  <td>
                    <span className={`appt-page__badge appt-page__badge--${statusToClass(row.status)}`}>
                      {getStatusLabel(row.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Detail Modal */}
      <Modal
        open={!!selectedRow}
        title="Chi tiết lịch hẹn"
        description={selectedRow ? `${selectedRow.code} — ${selectedRow.patient_full_name}` : ""}
        onClose={() => setSelectedId(null)}
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setSelectedId(null)}>Đóng</Button>
            <Button variant="secondary" size="sm" onClick={() => openHistoryModal(selectedRow)} disabled={isSaving}>
              Lịch sử
            </Button>
            {(selectedRow?.status === "PENDING" || selectedRow?.status === "CONFIRMED") && (
              <Button variant="secondary" size="sm" onClick={() => { setRescheduleModal({ open: true, appointment: selectedRow }); }} disabled={isSaving}>
                <CalendarRange className="mc-icon mc-icon--sm" style={{ marginRight: 4 }} />
                Đổi lịch
              </Button>
            )}
            {selectedRow?.status === "PENDING" && (
              <>
                <Button size="sm" onClick={() => { setConfirmModal({ open: true, appointment: selectedRow }); }} disabled={isSaving}>Xác nhận</Button>
                <Button variant="danger" size="sm" onClick={() => { setCancelModal({ open: true, appointment: selectedRow }); }} disabled={isSaving}>Hủy lịch</Button>
              </>
            )}
            {selectedRow?.status === "CONFIRMED" && (
              <>
                <Button size="sm" onClick={() => { setCheckInModal({ open: true, appointment: selectedRow }); }} disabled={isSaving}>Check-in</Button>
                <Button variant="secondary" size="sm" onClick={() => { setNoShowModal({ open: true, appointment: selectedRow }); }} disabled={isSaving}>No-show</Button>
                <Button variant="danger" size="sm" onClick={() => { setCancelModal({ open: true, appointment: selectedRow }); }} disabled={isSaving}>Hủy lịch</Button>
              </>
            )}
            {selectedRow?.status === "CHECKED_IN" && (
              <Button variant="secondary" size="sm" onClick={() => { setNoShowModal({ open: true, appointment: selectedRow }); }} disabled={isSaving}>No-show</Button>
            )}
          </>
        }
      >
        <div className="appt-modal__grid">
          <div className="appt-modal__row">
            <span className="appt-modal__label">Ngày</span>
            <span className="appt-modal__value">{selectedRow?.scheduled_start ? selectedRow.scheduled_start.split("T")[0] : "—"}</span>
          </div>
          <div className="appt-modal__row">
            <span className="appt-modal__label">Giờ</span>
            <span className="appt-modal__value">{selectedRow?.scheduled_start ? selectedRow.scheduled_start.split("T")[1]?.substring(0, 5) : "—"}</span>
          </div>
          <div className="appt-modal__row">
            <span className="appt-modal__label">Bệnh nhân</span>
            <span className="appt-modal__value">{selectedRow?.patient_full_name || "—"}</span>
          </div>
          <div className="appt-modal__row">
            <span className="appt-modal__label">SĐT</span>
            <span className="appt-modal__value">{selectedRow?.patient_phone || "—"}</span>
          </div>
          <div className="appt-modal__row">
            <span className="appt-modal__label">Bác sĩ</span>
            <span className="appt-modal__value">{selectedRow?.doctor_name || "—"}</span>
          </div>
          <div className="appt-modal__row">
            <span className="appt-modal__label">Khoa</span>
            <span className="appt-modal__value">{selectedRow?.specialty_name || "—"}</span>
          </div>
          <div className="appt-modal__row">
            <span className="appt-modal__label">Loại khám</span>
            <span className="appt-modal__value">{selectedRow?.visit_type_label || selectedRow?.visit_type || "—"}</span>
          </div>
          <div className="appt-modal__row">
            <span className="appt-modal__label">Trạng thái</span>
            <span className={`appt-page__badge appt-page__badge--${statusToClass(selectedRow?.status)}`}>
              {getStatusLabel(selectedRow?.status)}
            </span>
          </div>
        </div>
      </Modal>

      {/* ── Modal: Xác nhận lịch hẹn ── */}
      <Modal
        open={confirmModal.open}
        title="Xác nhận lịch hẹn"
        description={
          confirmModal.appointment
            ? `${confirmModal.appointment.code} — ${confirmModal.appointment.patient_full_name}`
            : ""
        }
        onClose={() => setConfirmModal({ open: false, appointment: null })}
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setConfirmModal({ open: false, appointment: null })} disabled={isSaving}>Hủy</Button>
            <Button size="sm" onClick={() => { doUpdateStatus(confirmModal.appointment.id, "CONFIRMED"); setConfirmModal({ open: false, appointment: null }); }} disabled={isSaving}>
              Xác nhận
            </Button>
          </>
        }
      >
        <p className="appt-page__modal-text">
          Sau khi xác nhận, lịch hẹn sẽ chuyển sang trạng thái <strong>Đã xác nhận</strong> và bệnh nhân có thể check-in khi đến.
        </p>
      </Modal>

      {/* ── Modal: Check-in ── */}
      <Modal
        open={checkInModal.open}
        title="Check-in bệnh nhân"
        description={
          checkInModal.appointment
            ? `${checkInModal.appointment.code} — ${checkInModal.appointment.patient_full_name}`
            : ""
        }
        onClose={() => setCheckInModal({ open: false, appointment: null })}
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setCheckInModal({ open: false, appointment: null })} disabled={isSaving}>Hủy</Button>
            <Button size="sm" onClick={() => { doUpdateStatus(checkInModal.appointment.id, "CHECKED_IN"); setCheckInModal({ open: false, appointment: null }); }} disabled={isSaving}>
              Check-in
            </Button>
          </>
        }
      >
        <p className="appt-page__modal-text">
          Bệnh nhân đã đến và được check-in thành công. Lịch hẹn chuyển sang trạng thái <strong>Đã check-in</strong>.
        </p>
      </Modal>

      {/* ── Modal: Hủy lịch hẹn ── */}
      <Modal
        open={cancelModal.open}
        title="Hủy lịch hẹn"
        description={
          cancelModal.appointment
            ? `${cancelModal.appointment.code} — ${cancelModal.appointment.patient_full_name}`
            : ""
        }
        onClose={() => setCancelModal({ open: false, appointment: null })}
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setCancelModal({ open: false, appointment: null })} disabled={isSaving}>Không</Button>
            <Button variant="danger" size="sm" onClick={() => { doUpdateStatus(cancelModal.appointment.id, "CANCELLED"); setCancelModal({ open: false, appointment: null }); }} disabled={isSaving}>
              Xác nhận hủy
            </Button>
          </>
        }
      >
        <p className="appt-page__modal-text appt-page__modal-text--danger">
          Lịch hẹn sẽ bị hủy và không thể khôi phục.
        </p>
      </Modal>

      {/* ── Modal: No-show ── */}
      <Modal
        open={noShowModal.open}
        title="Đánh dấu No-show"
        description={
          noShowModal.appointment
            ? `${noShowModal.appointment.code} — ${noShowModal.appointment.patient_full_name}`
            : ""
        }
        onClose={() => setNoShowModal({ open: false, appointment: null })}
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setNoShowModal({ open: false, appointment: null })} disabled={isSaving}>Không</Button>
            <Button size="sm" onClick={() => { doUpdateStatus(noShowModal.appointment.id, "NO_SHOW"); setNoShowModal({ open: false, appointment: null }); }} disabled={isSaving}>
              Xác nhận No-show
            </Button>
          </>
        }
      >
        <p className="appt-page__modal-text">
          Lịch hẹn sẽ được đánh dấu là <strong>No-show</strong> (bệnh nhân không đến).
        </p>
      </Modal>

      {/* ── Modal: Đổi lịch ── */}
      <RescheduleModal
        open={rescheduleModal.open}
        appointment={rescheduleModal.appointment}
        onClose={() => setRescheduleModal({ open: false, appointment: null })}
        onSuccess={loadData}
      />

      {/* ── Modal: Lịch sử thay đổi ── */}
      <HistoryModal
        open={historyModal.open}
        appointment={historyModal.appointment}
        historyData={historyData}
        onClose={closeHistoryModal}
      />
    </div>
  );
}

// ── History Modal ────────────────────────────────────────────────────────────

const HISTORY_ACTION_LABELS = {
  CREATE: { label: "Tạo mới", variant: "success" },
  CONFIRM: { label: "Xác nhận", variant: "info" },
  CANCEL: { label: "Hủy lịch", variant: "danger" },
  CHECKIN: { label: "Check-in", variant: "success" },
  NO_SHOW: { label: "No-show", variant: "warning" },
  RESCHEDULE: { label: "Đổi lịch", variant: "info" },
  COMPLETE: { label: "Hoàn tất", variant: "success" },
  DELETE: { label: "Xóa", variant: "danger" },
};

function HistoryModal({ open, appointment, historyData, onClose }) {
  if (!open) return null;

  return (
    <Modal
      open={open}
      title="Lịch sử thay đổi"
      description={appointment ? `${appointment.code} — ${appointment.patient_full_name}` : ""}
      onClose={onClose}
      size="lg"
      footer={
        <Button variant="secondary" size="sm" onClick={onClose}>Đóng</Button>
      }
    >
      <div className="appt-history">
        {historyData.length === 0 ? (
          <div className="appt-history__empty">Chưa có lịch sử thay đổi.</div>
        ) : (
          <div className="appt-history__list">
            {historyData.map((entry) => {
              const cfg = HISTORY_ACTION_LABELS[entry.action] ?? { label: entry.action, variant: "neutral" };
              return (
                <div key={entry.id} className="appt-history__item">
                  <div className="appt-history__item-header">
                    <span className={`appt-history__badge appt-history__badge--${cfg.variant}`}>
                      {cfg.label}
                    </span>
                    <span className="appt-history__time">
                      {entry.created_at ? new Date(entry.created_at).toLocaleString("vi-VN") : "—"}
                    </span>
                  </div>
                  <div className="appt-history__item-body">
                    <span className="appt-history__actor">
                      {entry.changed_by || "Hệ thống"}
                      {entry.changed_by_role && (
                        <span className="appt-history__role"> — {entry.changed_by_role}</span>
                      )}
                    </span>
                    {entry.note && (
                      <div className="appt-history__note">{entry.note}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
}
