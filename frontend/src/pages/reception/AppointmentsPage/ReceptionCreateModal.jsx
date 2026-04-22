import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Baby,
  Brain,
  Eye,
  HeartPulse,
  Sparkles,
  Stethoscope,
  Check,
  X,
} from "lucide-react";
import Button from "../../../components/Button/Button";
import Input from "../../../components/Input/Input";
import LoadingSpinner from "../../../components/LoadingSpinner/LoadingSpinner";
import {
  getDoctorsBySpecialty,
  getSlots,
  getSpecialties,
} from "../../../services/bookingApi";
import { receptionApi } from "../../../services/receptionApi";
import "./ReceptionCreateModal.css";

const STEPS = ["Chọn khoa", "Chọn bác sĩ", "Chọn giờ khám", "Thông tin bệnh nhân"];

const VISIT_TYPES = [
  { id: "VISIT_15", label: "Khám 15 phút", duration: 15, blocks: 1, description: "Chiếm 1 block 25 phút." },
  { id: "VISIT_20", label: "Khám 20 phút", duration: 20, blocks: 1, description: "Chiếm 1 block 25 phút." },
  { id: "VISIT_40", label: "Khám 40 phút", duration: 40, blocks: 2, description: "Cần 2 block liên tiếp." },
];

const SPECIALTY_META = {
  "Nhi khoa":        { icon: Baby,        cardClass: "rcm-card--nhi" },
  "Da liễu":         { icon: Sparkles,    cardClass: "rcm-card--da-lieu" },
  "Tai Mũi Họng":    { icon: Stethoscope, cardClass: "rcm-card--tai-mui-hong" },
  "Khám tổng quát":  { icon: HeartPulse,  cardClass: "rcm-card--tong-quat" },
  "Mắt":             { icon: Eye,         cardClass: "rcm-card--mat" },
  default:            { icon: Brain,       cardClass: "rcm-card--default" },
};

function getSpecialtyMeta(name) {
  return SPECIALTY_META[name] || SPECIALTY_META.default;
}

function getInitials(name = "") {
  return name.split(" ").filter(Boolean).slice(-2).map((p) => p[0]).join("").toUpperCase();
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function formatSlotMeta(slot) {
  return `${slot.duration}p | ${slot.occupies === 2 ? "x2 block" : "x1 block"}`;
}

export default function ReceptionCreateModal({ open, onClose, onSuccess }) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [specialties, setSpecialties] = useState([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedVisitType, setSelectedVisitType] = useState(VISIT_TYPES[1]);
  const [date, setDate] = useState(todayStr());
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [form, setForm] = useState({ name: "", phone: "", dob: "", note: "" });
  const [errors, setErrors] = useState({});

  // Reset when modal opens
  useEffect(() => {
    if (!open) return;
    setStep(0);
    setSelectedSpecialty(null);
    setSelectedDoctor(null);
    setSelectedSlot(null);
    setSlots([]);
    setForm({ name: "", phone: "", dob: "", note: "" });
    setErrors({});
    setSubmitError("");
    setDate(todayStr());
    setSelectedVisitType(VISIT_TYPES[1]);
  }, [open]);

  // Load specialties
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    getSpecialties().then(setSpecialties).finally(() => setLoading(false));
  }, [open]);

  // Load doctors when specialty changes
  useEffect(() => {
    if (!selectedSpecialty) return;
    setLoading(true);
    setSelectedDoctor(null);
    setSelectedSlot(null);
    setDoctors([]);
    getDoctorsBySpecialty(selectedSpecialty.id).then(setDoctors).finally(() => setLoading(false));
  }, [selectedSpecialty]);

  // Load slots when doctor/date/visitType changes
  useEffect(() => {
    if (!selectedDoctor) return;
    setLoading(true);
    setSelectedSlot(null);
    getSlots(selectedDoctor.id, date, selectedVisitType.id).then(setSlots).finally(() => setLoading(false));
  }, [selectedDoctor, date, selectedVisitType]);

  function validateForm() {
    const nextErrors = {};
    if (!form.name.trim()) nextErrors.name = "Vui lòng nhập họ tên.";
    if (!/^0\d{9}$/.test(form.phone.trim())) nextErrors.phone = "SĐT không hợp lệ (10 số, bắt đầu bằng 0).";
    if (!form.dob) nextErrors.dob = "Vui lòng nhập ngày sinh.";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function isLockedBySelected(slot) {
    if (!selectedSlot || selectedSlot.occupies !== 2) return false;
    if (slot.id === selectedSlot.id) return false;
    return slot.primaryBlockIndex === selectedSlot.nextBlockIndex;
  }

  async function handleSubmit() {
    if (!validateForm() || !selectedSlot) return;
    setLoading(true);
    setSubmitError("");
    try {
      const payload = {
        patient_full_name: form.name.trim(),
        patient_phone: form.phone.trim(),
        specialty: selectedSpecialty.id,
        doctor: selectedDoctor.id,
        scheduled_start: `${date}T${selectedSlot.start}:00`,
        scheduled_end: `${date}T${selectedSlot.end}:00`,
        visit_type: selectedVisitType.id,
      };
      await receptionApi.createAppointment(payload);
      onSuccess && onSuccess();
      onClose();
    } catch (error) {
      const msg = error?.response?.data
        ? Object.values(error.response.data).flat().join(". ")
        : error?.message || "Đã xảy ra lỗi.";
      setSubmitError(msg);
    } finally {
      setLoading(false);
    }
  }

  function canNext() {
    if (step === 0) return Boolean(selectedSpecialty);
    if (step === 1) return Boolean(selectedDoctor);
    if (step === 2) return Boolean(selectedSlot);
    return true;
  }

  if (!open) return null;

  return (
    <div className="rcm-backdrop">
      <div className="rcm-overlay" onClick={onClose} />
      <div className="rcm-modal">
        {/* Header */}
        <div className="rcm-header">
          <div>
            <h2 className="rcm-title">Tạo lịch hẹn</h2>
            <p className="rcm-sub">Lễ tân tạo lịch hẹn cho bệnh nhân</p>
          </div>
          <button type="button" className="rcm-close" onClick={onClose}>
            <X className="mc-icon mc-icon--sm" />
          </button>
        </div>

        {/* Stepper */}
        <div className="rcm-stepper">
          {STEPS.map((label, index) => (
            <div
              key={label}
              className={`rcm-step${index === step ? " active" : ""}${index < step ? " done" : ""}`}
            >
              <div className="rcm-step__dot">
                {index < step ? <Check className="mc-icon mc-icon--xs" /> : index + 1}
              </div>
              <div className="rcm-step__label">{label}</div>
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="rcm-body">
          {loading && step === 0 && <div className="rcm-loading"><LoadingSpinner /></div>}

          {/* Step 0: Chọn khoa */}
          {step === 0 && !loading && (
            <div>
              <div className="rcm-section-title">Chọn chuyên khoa</div>
              <div className="rcm-card-grid">
                {specialties.map((specialty) => {
                  const meta = getSpecialtyMeta(specialty.name);
                  return (
                    <button
                      type="button"
                      key={specialty.id}
                      className={`rcm-card ${meta.cardClass}${selectedSpecialty?.id === specialty.id ? " selected" : ""}`}
                      onClick={() => setSelectedSpecialty(specialty)}
                    >
                      <div className="rcm-card__avatar">
                        <meta.icon className="mc-icon rcm-card__icon" />
                      </div>
                      <div className="rcm-card__name">{specialty.name}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 1: Chọn bác sĩ */}
          {step === 1 && (
            <div>
              <div className="rcm-section-title">Chọn bác sĩ — {selectedSpecialty?.name}</div>
              {loading ? (
                <div className="rcm-loading"><LoadingSpinner /></div>
              ) : doctors.length === 0 ? (
                <p className="rcm-empty">Không có bác sĩ cho chuyên khoa này.</p>
              ) : (
                <div className="rcm-card-grid">
                  {doctors.map((doctor) => (
                    <button
                      type="button"
                      key={doctor.id}
                      className={`rcm-card rcm-card--doctor${selectedDoctor?.id === doctor.id ? " selected" : ""}`}
                      onClick={() => setSelectedDoctor(doctor)}
                    >
                      <div className="rcm-card__avatar rcm-card__avatar--initials">
                        {getInitials(doctor.name)}
                      </div>
                      <div className="rcm-card__name">{doctor.name}</div>
                      <div className="rcm-card__sub">1 block = {doctor.slotDuration} phút</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Chọn giờ */}
          {step === 2 && (
            <div>
              <div className="rcm-section-title">Loại khám</div>
              <div className="rcm-visit-type-grid">
                {VISIT_TYPES.map((vt) => (
                  <button
                    type="button"
                    key={vt.id}
                    className={`rcm-visit-type${selectedVisitType.id === vt.id ? " selected" : ""}`}
                    onClick={() => setSelectedVisitType(vt)}
                  >
                    <div className="rcm-visit-type__title">{vt.label}</div>
                    <div className="rcm-visit-type__desc">{vt.description}</div>
                  </button>
                ))}
              </div>

              <div className="rcm-date-row">
                <span className="rcm-date-label">Ngày khám:</span>
                <input
                  type="date"
                  className="rcm-date-input"
                  value={date}
                  min={todayStr()}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              <div className="rcm-section-title rcm-section-title--spaced">
                Chọn khung giờ
              </div>
              <p className="rcm-note">
                {selectedVisitType.blocks === 2
                  ? "Loại khám 40 phút yêu cầu 2 block liên tiếp."
                  : "Chiếm 1 block 25 phút."}
              </p>

              {loading ? (
                <div className="rcm-loading"><LoadingSpinner /></div>
              ) : slots.length === 0 ? (
                <p className="rcm-empty">Không có slot khả dụng cho ngày này.</p>
              ) : (
                <>
                  <div className="rcm-slot-grid">
                    {slots.map((slot) => {
                      const locked = isLockedBySelected(slot);
                      const disabled = slot.status === "conflict" || locked;
                      return (
                        <button
                          type="button"
                          key={slot.id}
                          className={[
                            "rcm-slot",
                            slot.status === "conflict" ? "conflict" : "",
                            slot.occupies === 2 ? "two-blocks" : "",
                            locked ? "locked" : "",
                            selectedSlot?.id === slot.id ? "selected" : "",
                          ].join(" ")}
                          disabled={disabled}
                          onClick={() => setSelectedSlot(slot)}
                          title={
                            slot.status === "conflict"
                              ? "Khung giờ đã full."
                              : locked
                                ? "Khung giờ bị khóa."
                                : ""
                          }
                        >
                          <div className="rcm-slot__time">{slot.start}</div>
                          <div className="rcm-slot__sub">{slot.end}</div>
                          <div className="rcm-slot__dur">{formatSlotMeta(slot)}</div>
                        </button>
                      );
                    })}
                  </div>
                  <div className="rcm-legend">
                    <span className="rcm-legend-chip">
                      <span className="rcm-swatch rcm-swatch--available" />Còn trống
                    </span>
                    <span className="rcm-legend-chip">
                      <span className="rcm-swatch rcm-swatch--selected" />Đã chọn
                    </span>
                    <span className="rcm-legend-chip">
                      <span className="rcm-swatch rcm-swatch--conflict" />Full / xung đột
                    </span>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 3: Thông tin bệnh nhân */}
          {step === 3 && (
            <div className="rcm-patient-form">
              <div className="rcm-section-title">Thông tin bệnh nhân</div>
              <p className="rcm-note">Lễ tân nhập thông tin bệnh nhân vào form bên dưới.</p>
              <Input
                label="Họ và tên *"
                placeholder="Nguyễn Văn An"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                error={errors.name}
              />
              <Input
                label="Số điện thoại *"
                placeholder="0901234567"
                value={form.phone}
                onChange={(e) => {
                  const val = e.target.value;
                  if (!/^\d*$/.test(val)) return;
                  setForm({ ...form, phone: val });
                  setErrors((p) => ({ ...p, phone: "" }));
                }}
                error={errors.phone}
              />
              <Input
                label="Ngày sinh *"
                type="date"
                value={form.dob}
                onChange={(e) => setForm({ ...form, dob: e.target.value })}
                error={errors.dob}
              />
              <Input
                label="Ghi chú (không bắt buộc)"
                placeholder="Mô tả triệu chứng..."
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
              />
            </div>
          )}
        </div>

        {/* Error */}
        {submitError && (
          <div className="rcm-error">{submitError}</div>
        )}

        {/* Footer / Navigation */}
        <div className="rcm-footer">
          <div className="rcm-footer-left">
            {step > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setStep((s) => s - 1)}>
                <ArrowLeft className="mc-icon mc-icon--sm" />
                Quay lại
              </Button>
            )}
          </div>
          <div className="rcm-footer-right">
            {step < STEPS.length - 1 ? (
              <Button size="sm" onClick={() => setStep((s) => s + 1)} disabled={!canNext() || loading}>
                Tiếp theo
                <ArrowRight className="mc-icon mc-icon--sm" />
              </Button>
            ) : (
              <Button size="sm" onClick={handleSubmit} disabled={loading}>
                {loading ? "Đang tạo..." : "Tạo lịch hẹn"}
                {!loading && <ArrowRight className="mc-icon mc-icon--sm" />}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
