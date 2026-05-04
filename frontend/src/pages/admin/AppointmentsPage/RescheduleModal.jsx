import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Baby,
  Brain,

  Check,
  HeartPulse,
  Lock,
  Sparkles,
  Stethoscope,
  Eye,
} from "lucide-react";
import Button from "../../../components/Button/Button";
import LoadingSpinner from "../../../components/LoadingSpinner/LoadingSpinner";
import Modal from "../../../components/Modal/Modal";
import { getSpecialties, getDoctorsBySpecialty, getSlots } from "../../../services/bookingApi";
import { rescheduleAppointment } from "../../../services/adminApi";
import "./RescheduleModal.css";

const STEPS = ["Chọn khoa", "Chọn bác sĩ", "Chọn giờ", "Xác nhận"];

const VISIT_TYPES = [
  { id: "VISIT_15", label: "Khám nhanh", duration: 15, blocks: 1, description: "Chiếm 1 block 25 phút." },
  { id: "VISIT_20", label: "Khám thường", duration: 20, blocks: 1, description: "Chiếm 1 block 25 phút." },
  { id: "VISIT_40", label: "Khám tổng quát", duration: 40, blocks: 2, description: "Cần 2 block liên tiếp." },
];

const SPECIALTY_META = {
  "Nhi khoa":       { icon: Baby,        cardClass: "bw-card--nhi" },
  "Da liễu":        { icon: Sparkles,    cardClass: "bw-card--da-lieu" },
  "Tai Mũi Họng":   { icon: Stethoscope, cardClass: "bw-card--tai-mui-hong" },
  "Khám tổng quát": { icon: HeartPulse,  cardClass: "bw-card--tong-quat" },
  "Mắt":            { icon: Eye,         cardClass: "bw-card--mat" },
  default:          { icon: Brain,       cardClass: "bw-card--default" },
};

function getSpecialtyMeta(name) {
  return SPECIALTY_META[name] || SPECIALTY_META.default;
}

function getInitials(name = "") {
  return name.split(" ").filter(Boolean).slice(-2).map((p) => p[0]).join("").toUpperCase();
}

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

function fmtTime(d) {
  if (!d) return "—";
  return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

function fmtTimeFromStr(timeStr) {
  if (!timeStr) return "—";
  const [h, m] = timeStr.split(":").map(Number);
  const d = new Date(2000, 0, 1, h, m);
  return fmtTime(d);
}




function fmtDateFull(d) {
  if (!d) return "—";
  return d.toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" });
}



function fmtSlotDateFull(dateStr, timeStr) {
  if (!dateStr) return "—";
  const d = new Date(`${dateStr}T${timeStr || "00:00"}`);
  if (isNaN(d.getTime())) return "—";
  return fmtDateFull(d);
}

function stripHtml(raw) {
  if (typeof raw !== "string") return "";
  return raw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() || "Đã xảy ra lỗi.";
}

function RescheduleModalInner({ appointment, onClose, onSuccess }) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [saving, setSaving] = useState(false);

  // Wizard state
  const [specialties, setSpecialties] = useState([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedVisitType, setSelectedVisitType] = useState(VISIT_TYPES[1]);
  const [date, setDate] = useState(todayStr());
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Load specialties on mount
  useEffect(() => {
    setLoading(true);
    getSpecialties()
      .then(setSpecialties)
      .finally(() => setLoading(false));
  }, []);

  // Load doctors when specialty changes
  useEffect(() => {
    if (!selectedSpecialty) return;
    setLoading(true);
    setSelectedDoctor(null);
    setSelectedSlot(null);
    getDoctorsBySpecialty(selectedSpecialty.id)
      .then(setDoctors)
      .finally(() => setLoading(false));
  }, [selectedSpecialty]);

  // Load slots when doctor/date/visitType changes
  useEffect(() => {
    if (!selectedDoctor) return;
    setLoading(true);
    setSelectedSlot(null);
    getSlots(selectedDoctor.id, date, selectedVisitType.id)
      .then((data) => setSlots(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, [selectedDoctor, date, selectedVisitType]);

  // Prefill: auto-select specialty + doctor + visitType + date from existing appointment
  useEffect(() => {
    if (!appointment || specialties.length === 0) return;

    // specialty
    const sp = specialties.find((s) => s.id === appointment.specialty_id || s.name === appointment.specialty_name);
    if (sp) {
      setSelectedSpecialty(sp);
    }
  }, [appointment, specialties]);

  useEffect(() => {
    if (!appointment || !selectedSpecialty || doctors.length === 0) return;

    const doc = doctors.find((d) => d.id === appointment.doctor_id || d.name === appointment.doctor_name);
    if (doc) {
      setSelectedDoctor(doc);
    }
  }, [appointment, selectedSpecialty, doctors]);

  useEffect(() => {
    if (!appointment || !selectedDoctor) return;

    const vt = VISIT_TYPES.find((v) => v.id === appointment.visit_type);
    if (vt) setSelectedVisitType(vt);

    if (appointment.scheduled_start) {
      const d = new Date(appointment.scheduled_start);
      const dateStr = d.toISOString().split("T")[0];
      setDate(dateStr);
    }
  }, [appointment, selectedDoctor]);

  function isLockedBySelected(slot) {
    if (!selectedSlot || selectedSlot.occupies !== 2) return false;
    if (slot.id === selectedSlot.id) return false;
    return slot.primaryBlockIndex === selectedSlot.nextBlockIndex;
  }

  function canNext() {
    if (step === 0) return Boolean(selectedSpecialty);
    if (step === 1) return Boolean(selectedDoctor);
    if (step === 2) return Boolean(selectedSlot);
    return true;
  }

  function handleNext() {
    setStep((s) => s + 1);
  }

  function handleBack() {
    setStep((s) => s - 1);
    setSubmitError("");
  }

  async function handleSubmit() {
    if (!selectedSlot) return;
    setSaving(true);
    setSubmitError("");
    try {
      await rescheduleAppointment(appointment.id, {
        scheduled_start: `${date}T${selectedSlot.start}:00`,
        scheduled_end: `${date}T${selectedSlot.end}:00`,
        note: "",
      });
      onSuccess();
    } catch (err) {
      setSubmitError(stripHtml(err.message) || "Dời lịch thất bại.");
      setSaving(false);
    }
  }

  // ── Render steps ───────────────────────────────────────────────────────
  function renderStep() {
    if (loading) {
      return <div className="rs-loading-panel"><LoadingSpinner /></div>;
    }

    switch (step) {
      case 0:
        return (
          <div>
            <div className="rs-panel-title">Chọn chuyên khoa</div>
            <div className="rs-card-grid">
              {specialties.map((specialty) => {
                const meta = getSpecialtyMeta(specialty.name);
                return (
                  <button
                    type="button"
                    key={specialty.id}
                    className={`rs-card ${meta.cardClass}${selectedSpecialty?.id === specialty.id ? " selected" : ""}`}
                    onClick={() => setSelectedSpecialty(specialty)}
                  >
                    <div className="rs-card__avatar">
                      {React.createElement(meta.icon, { className: "mc-icon" })}
                    </div>
                    <div className="rs-card__name">{specialty.name}</div>
                  </button>
                );
              })}
            </div>
          </div>
        );

      case 1:
        return (
          <div>
            <div className="rs-panel-title">
              Chọn bác sĩ — <span className="rs-panel-title__sub">{selectedSpecialty?.name}</span>
            </div>
            {doctors.length === 0 ? (
              <p className="rs-empty-note">Không có bác sĩ cho chuyên khoa này.</p>
            ) : (
              <div className="rs-card-grid">
                {doctors.map((doctor) => (
                  <button
                    type="button"
                    key={doctor.id}
                    className={`rs-card${selectedDoctor?.id === doctor.id ? " selected" : ""}`}
                    onClick={() => setSelectedDoctor(doctor)}
                  >
                    <div className="rs-card__avatar rs-card__avatar--initials">
                      {getInitials(doctor.name)}
                    </div>
                    <div className="rs-card__name">{doctor.name}</div>
                    <div className="rs-card__sub">
                      {doctor.slotDuration ? `${doctor.slotDuration} phút/block` : ""}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div>
            {/* Visit type grid */}
            <div className="rs-visit-type-grid">
              {VISIT_TYPES.map((vt) => (
                <button
                  key={vt.id}
                  type="button"
                  className={`rs-visit-type${selectedVisitType.id === vt.id ? " selected" : ""}`}
                  onClick={() => setSelectedVisitType(vt)}
                >
                  <div className="rs-visit-type__title">{vt.label}</div>
                  <div className="rs-visit-type__meta">{vt.description}</div>
                </button>
              ))}
            </div>

            {/* Date picker */}
            <div className="rs-date-row">
              <div className="rs-date-label">Ngày khám:</div>
              <input
                type="date"
                className="rs-date-input"
                value={date}
                min={todayStr()}
                onChange={(e) => {
                  setDate(e.target.value);
                  setSelectedSlot(null);
                }}
              />
            </div>

            {/* Slot section title */}
            <div className="rs-panel-title rs-panel-title--spaced">
              Khung giờ cho {selectedVisitType.label}
            </div>
            <p className="rs-empty-note rs-empty-note--spaced">
              {selectedVisitType.blocks === 2
                ? "Loại khám này yêu cầu 2 block liên tiếp. Hệ thống sẽ khóa block kế tiếp khi bạn chọn."
                : "Chiếm 1 block 25 phút."}
            </p>

            {/* Slots */}
            {slots.length === 0 ? (
              <p className="rs-empty-note">Không có khung giờ trống cho ngày này.</p>
            ) : (
              <>
                <div className="rs-slot-grid">
                  {slots.map((slot) => {
                    const locked = isLockedBySelected(slot);
                    const disabled = slot.status === "conflict" || locked;
                    return (
                      <button
                        type="button"
                        key={slot.id || slot.start}
                        className={[
                          "rs-slot",
                          slot.status === "conflict" ? "conflict" : "",
                          locked ? "locked" : "",
                          selectedSlot?.id === slot.id ? "selected" : "",
                        ].join(" ")}
                        disabled={disabled}
                        onClick={() => setSelectedSlot(slot)}
                      >
                        <div className="rs-slot__time">
                          {slot.start}
                        </div>
                        <div className="rs-slot__sub">
                          {slot.end}
                        </div>
                        <div className="rs-slot__dur">
                          {slot.duration}p · x{slot.occupies} block
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="rs-slot-legend">
                  <span className="rs-legend-chip">
                    <span className="rs-legend-swatch rs-legend-swatch--available" />
                    Còn trống
                  </span>
                  <span className="rs-legend-chip rs-legend-chip--selected">
                    <span className="rs-legend-swatch rs-legend-swatch--selected" />
                    Đã chọn
                  </span>
                  <span className="rs-legend-chip rs-legend-chip--conflict">
                    <span className="rs-legend-swatch rs-legend-swatch--conflict" />
                    Đã full
                  </span>
                  <span className="rs-legend-chip rs-legend-chip--locked">
                    <Lock className="mc-icon mc-icon--xs" />
                    Khóa (slot 40 phút)
                  </span>
                </div>
              </>
            )}
          </div>
        );

      case 3:
        return (
          <div>
            {/* So sánh lịch cũ vs mới */}
            <div className="rs-compare">
              <div className="rs-compare__old">
                <div className="rs-compare__label">Lịch cũ</div>
                <div className="rs-compare__value">
                  {appointment?.scheduled_start
                    ? fmtDateFull(new Date(appointment.scheduled_start))
                    : "—"}
                </div>
                <div className="rs-compare__time">
                  {appointment?.scheduled_start
                    ? fmtTime(new Date(appointment.scheduled_start))
                    : "—"}
                  {" – "}
                  {appointment?.scheduled_end
                    ? fmtTime(new Date(appointment.scheduled_end))
                    : "—"}
                </div>
              </div>
              <div className="rs-compare__arrow">→</div>
              <div className="rs-compare__new">
                <div className="rs-compare__label">Lịch mới</div>
                <div className="rs-compare__value">
                  {fmtSlotDateFull(date, selectedSlot?.start)}
                </div>
                <div className="rs-compare__time">
                  {selectedSlot?.start ? fmtTimeFromStr(selectedSlot.start) : "—"}
                  {" – "}
                  {selectedSlot?.end ? fmtTimeFromStr(selectedSlot.end) : "—"}
                </div>
              </div>
            </div>

            {/* Summary card */}
            <div className="rs-summary">
              <div className="rs-summary__row">
                <span className="rs-summary__key">Chuyên khoa</span>
                <span className="rs-summary__val">{selectedSpecialty?.name || "—"}</span>
              </div>
              <div className="rs-summary__row">
                <span className="rs-summary__key">Bác sĩ</span>
                <span className="rs-summary__val">{selectedDoctor?.name || "—"}</span>
              </div>
              <div className="rs-summary__row">
                <span className="rs-summary__key">Loại khám</span>
                <span className="rs-summary__val">{selectedVisitType?.label}</span>
              </div>
              <div className="rs-summary__row">
                <span className="rs-summary__key">Ngày</span>
                <span className="rs-summary__val">
                  {fmtSlotDateFull(date, selectedSlot?.start)}
                </span>
              </div>
              <div className="rs-summary__row">
                <span className="rs-summary__key">Giờ</span>
                <span className="rs-summary__val">
                  {selectedSlot?.start ? fmtTimeFromStr(selectedSlot.start) : "—"}
                  {" – "}
                  {selectedSlot?.end ? fmtTimeFromStr(selectedSlot.end) : "—"}
                </span>
              </div>
              <div className="rs-summary__row">
                <span className="rs-summary__key">Bệnh nhân</span>
                <span className="rs-summary__val">{appointment?.patient_full_name || "—"}</span>
              </div>
            </div>

            {submitError && (
              <div className="rs-submit-error">{submitError}</div>
            )}
          </div>
        );

      default:
        return null;
    }
  }

  return (
    <div className="rs-wizard">
      {/* Stepper */}
      <div className="rs-stepper">
        {STEPS.map((label, index) => (
          <div
            key={label}
            className={`rs-step${index === step ? " active" : ""}${index < step ? " done" : ""}`}
          >
            <div className="rs-step__dot">
              {index < step ? (
                <Check className="mc-icon mc-icon--xs" />
              ) : (
                index + 1
              )}
            </div>
            <div className="rs-step__label">{label}</div>
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="rs-panel">{renderStep()}</div>

      {/* Navigation */}
      <div className="rs-nav">
        {step > 0 ? (
          <Button variant="ghost" size="sm" onClick={handleBack} disabled={saving}>
            <ArrowLeft className="mc-icon mc-icon--sm" />
            Quay lại
          </Button>
        ) : (
          <div />
        )}
        {step < STEPS.length - 1 ? (
          <Button size="sm" onClick={handleNext} disabled={!canNext()}>
            Tiếp theo
            <ArrowRight className="mc-icon mc-icon--sm" />
          </Button>
        ) : (
          <Button size="sm" onClick={handleSubmit} disabled={saving || !selectedSlot}>
            {saving ? "Đang xử lý..." : "Xác nhận đổi lịch"}
            {!saving && <ArrowRight className="mc-icon mc-icon--sm" />}
          </Button>
        )}
      </div>
    </div>
  );
}

export default function RescheduleModal({ open, appointment, onClose, onSuccess }) {
  if (!open) return null;

  return (
    <Modal
      open={open}
      title="Đổi lịch hẹn"
      description={appointment ? `${appointment.code} — ${appointment.patient_full_name}` : ""}
      onClose={onClose}
      size="lg"
    >
      <RescheduleModalInner
        appointment={appointment}
        onClose={onClose}
        onSuccess={() => {
          onSuccess();
          onClose();
        }}
      />
    </Modal>
  );
}
