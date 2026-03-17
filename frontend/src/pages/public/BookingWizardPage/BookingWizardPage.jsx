import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Baby,
  Brain,
  Check,
  CircleAlert,
  Eye,
  HeartPulse,
  Lock,
  Sparkles,
  Stethoscope,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Button from "../../../components/Button/Button";
import Input from "../../../components/Input/Input";
import LoadingSpinner from "../../../components/LoadingSpinner/LoadingSpinner";
import {
  createGuestBooking,
  getDoctorsBySpecialty,
  getSlots,
  getSpecialties,
} from "../../../services/bookingApi";
import "./BookingWizardPage.css";

const STEPS = ["Chọn khoa", "Chọn bác sĩ", "Chọn loại khám & giờ", "Thông tin bệnh nhân"];

const VISIT_TYPES = [
  {
    id: "VISIT_15",
    label: "Khám 15 phút",
    duration: 15,
    blocks: 1,
    description: "Chiếm 1 block 25 phút.",
  },
  {
    id: "VISIT_20",
    label: "Khám 20 phút",
    duration: 20,
    blocks: 1,
    description: "Chiếm 1 block 25 phút.",
  },
  {
    id: "VISIT_40",
    label: "Khám 40 phút",
    duration: 40,
    blocks: 2,
    description: "Cần 2 block liên tiếp.",
  },
];

const SPECIALTY_META = {
  "Nhi khoa": { icon: Baby, cardClass: "bw-card--nhi" },
  "Da liễu": { icon: Sparkles, cardClass: "bw-card--da-lieu" },
  "Tai Mũi Họng": { icon: Stethoscope, cardClass: "bw-card--tai-mui-hong" },
  "Khám tổng quát": { icon: HeartPulse, cardClass: "bw-card--tong-quat" },
  "Mắt": { icon: Eye, cardClass: "bw-card--mat" },
  default: { icon: Brain, cardClass: "bw-card--default" },
};

function getSpecialtyMeta(name) {
  return SPECIALTY_META[name] || SPECIALTY_META.default;
}

function getInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function formatSlotMeta(slot) {
  return `${slot.duration}p | ${slot.occupies === 2 ? "x2 block" : "x1 block"}`;
}

export default function BookingWizardPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
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

  useEffect(() => {
    setLoading(true);
    getSpecialties().then(setSpecialties).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedSpecialty) {
      return;
    }

    setLoading(true);
    setSelectedDoctor(null);
    setSelectedSlot(null);
    getDoctorsBySpecialty(selectedSpecialty.id).then(setDoctors).finally(() => setLoading(false));
  }, [selectedSpecialty]);

  useEffect(() => {
    if (!selectedDoctor) {
      return;
    }

    setLoading(true);
    setSelectedSlot(null);
    getSlots(selectedDoctor.id, date, selectedVisitType.id).then(setSlots).finally(() => setLoading(false));
  }, [selectedDoctor, date, selectedVisitType]);

  function validateForm() {
    const nextErrors = {};

    if (!form.name.trim()) {
      nextErrors.name = "Vui lòng nhập họ tên.";
    }

    if (!/^0\d{9}$/.test(form.phone.trim())) {
      nextErrors.phone = "Số điện thoại không hợp lệ (10 số, bắt đầu bằng 0).";
    }

    if (!form.dob) {
      nextErrors.dob = "Vui lòng nhập ngày sinh.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function isLockedBySelected(slot) {
    if (!selectedSlot || selectedSlot.occupies !== 2) {
      return false;
    }

    if (slot.id === selectedSlot.id) {
      return false;
    }

    return slot.primaryBlockIndex === selectedSlot.nextBlockIndex;
  }

  async function handleSubmit() {
    if (!validateForm() || !selectedSlot) {
      return;
    }

    setLoading(true);
    try {
      const payload = {
        specialtyId: selectedSpecialty.id,
        specialtyName: selectedSpecialty.name,
        doctorId: selectedDoctor.id,
        doctorName: selectedDoctor.name,
        date,
        slotId: selectedSlot.id,
        slot: `${selectedSlot.start} - ${selectedSlot.end}`,
        slotDuration: selectedSlot.duration,
        slotBlocks: selectedSlot.occupies,
        slotBlockIndexes: selectedSlot.blockIndexes,
        visitType: selectedVisitType.id,
        visitTypeLabel: selectedVisitType.label,
        patientName: form.name.trim(),
        patientPhone: form.phone.trim(),
        patientDob: form.dob,
        note: form.note.trim(),
      };
      const booking = await createGuestBooking(payload);
      navigate(`/booking-success/${booking.code}`, { state: { booking } });
    } catch (error) {
      alert(`Đặt lịch thất bại: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  function canNext() {
    if (step === 0) {
      return Boolean(selectedSpecialty);
    }

    if (step === 1) {
      return Boolean(selectedDoctor);
    }

    if (step === 2) {
      return Boolean(selectedSlot);
    }

    return true;
  }

  function renderStep() {
    if (loading) {
      return (
        <div className="bw-loading-panel">
          <LoadingSpinner />
        </div>
      );
    }

    switch (step) {
      case 0:
        return (
          <div>
            <div className="bw-panel-title">Chọn chuyên khoa</div>
            <div className="bw-card-grid">
              {specialties.map((specialty) => {
                const meta = getSpecialtyMeta(specialty.name);
                return (
                  <button
                    type="button"
                    key={specialty.id}
                    className={`bw-card ${meta.cardClass}${selectedSpecialty?.id === specialty.id ? " selected" : ""}`}
                    onClick={() => setSelectedSpecialty(specialty)}
                  >
                    <div className="bw-card__avatar bw-card__avatar--large">
                      <meta.icon className="mc-icon bw-card__avatar-icon" />
                    </div>
                    <div className="bw-card__name">{specialty.name}</div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      case 1:
        return (
          <div>
            <div className="bw-panel-title">Chọn bác sĩ - {selectedSpecialty?.name}</div>
            {doctors.length === 0 ? (
              <p className="bw-empty-note">Không có bác sĩ cho chuyên khoa này.</p>
            ) : (
              <div className="bw-card-grid">
                {doctors.map((doctor) => (
                  <button
                    type="button"
                    key={doctor.id}
                    className={`bw-card${selectedDoctor?.id === doctor.id ? " selected" : ""}`}
                    onClick={() => setSelectedDoctor(doctor)}
                  >
                    <div className="bw-card__avatar bw-card__avatar-initials">{getInitials(doctor.name)}</div>
                    <div className="bw-card__name">{doctor.name}</div>
                    <div className="bw-card__sub">1 block = {doctor.slotDuration} phút</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      case 2:
        return (
          <div>
            <div className="bw-visit-type-grid">
              {VISIT_TYPES.map((visitType) => (
                <button
                  key={visitType.id}
                  type="button"
                  className={`bw-visit-type${selectedVisitType.id === visitType.id ? " selected" : ""}`}
                  onClick={() => setSelectedVisitType(visitType)}
                >
                  <div className="bw-visit-type__title">{visitType.label}</div>
                  <div className="bw-visit-type__meta">{visitType.description}</div>
                </button>
              ))}
            </div>

            <div className="bw-date-row">
              <div className="bw-date-label">Ngày khám:</div>
              <input
                type="date"
                className="mc-input bw-date-input"
                value={date}
                min={todayStr()}
                onChange={(event) => setDate(event.target.value)}
              />
            </div>

            <div className="bw-panel-title bw-panel-title--spaced">
              Chọn khung giờ cho {selectedVisitType.label}
            </div>
            <p className="bw-empty-note bw-empty-note--spaced">
              {selectedVisitType.blocks === 2
                ? "Loại khám này yêu cầu 2 block liên tiếp. Hệ thống sẽ khóa block kế tiếp khi bạn chọn slot."
                : "Loại khám này chiếm 1 block 25 phút."}
            </p>

            {slots.length === 0 ? (
              <p className="bw-empty-note">Không có slot khả dụng cho ngày này.</p>
            ) : (
              <>
                <div className="bw-slot-grid">
                  {slots.map((slot) => {
                    const locked = isLockedBySelected(slot);
                    const disabled = slot.status === "conflict" || locked;

                    return (
                      <button
                        type="button"
                        key={slot.id}
                        className={[
                          "bw-slot",
                          slot.status === "conflict" ? "conflict" : "",
                          slot.occupies === 2 ? "two-blocks" : "",
                          locked ? "locked" : "",
                          selectedSlot?.id === slot.id ? "selected" : "",
                        ].join(" ")}
                        disabled={disabled}
                        onClick={() => setSelectedSlot(slot)}
                        title={
                          slot.status === "conflict"
                            ? "Khung giờ này đã full hoặc không đủ block liên tiếp."
                            : locked
                              ? "Khung giờ này bị khóa vì slot 40 phút đang được chọn."
                              : ""
                        }
                      >
                        <div className="bw-slot__time">{slot.start}</div>
                        <div className="bw-slot__sub">{slot.end}</div>
                        <div className="bw-slot__dur">{formatSlotMeta(slot)}</div>
                      </button>
                    );
                  })}
                </div>

                <div className="bw-slot-legend">
                  <span className="bw-legend-chip">
                    <span className="bw-legend-swatch bw-legend-swatch--available" />
                    Còn trống
                  </span>
                  <span className="bw-legend-chip bw-slot-legend__selected">
                    <span className="bw-legend-swatch bw-legend-swatch--selected" />
                    Đã chọn
                  </span>
                  <span className="bw-legend-chip bw-slot-legend__conflict">
                    <span className="bw-legend-swatch bw-legend-swatch--conflict" />
                    Đã full / không đủ block
                  </span>
                  <span className="bw-legend-chip bw-slot-legend__locked">
                    <Lock className="mc-icon mc-icon--xs" />
                    Khóa theo slot 40 phút
                  </span>
                </div>
              </>
            )}
          </div>
        );
      case 3:
        return (
          <div className="mc-stack-md">
            <div className="bw-panel-title">Thông tin bệnh nhân</div>
            <Input
              label="Họ và tên *"
              placeholder="Nguyễn Văn An"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              error={errors.name}
            />
            <Input
              label="Số điện thoại *"
              placeholder="0901234567"
              value={form.phone}
              onChange={(event) => setForm({ ...form, phone: event.target.value })}
              error={errors.phone}
            />
            <Input
              label="Ngày sinh *"
              type="date"
              value={form.dob}
              onChange={(event) => setForm({ ...form, dob: event.target.value })}
              error={errors.dob}
            />
            <Input
              label="Ghi chú triệu chứng (không bắt buộc)"
              placeholder="Mô tả ngắn triệu chứng..."
              value={form.note}
              onChange={(event) => setForm({ ...form, note: event.target.value })}
              hint="Thông tin này để bác sĩ chuẩn bị trước, không thay thế chẩn đoán."
            />
          </div>
        );
      default:
        return null;
    }
  }

  return (
    <div className="mc-stack-lg booking-page">
      <div>
        <h1 className="home-hero-title booking-page-title">Đặt lịch khám</h1>
        <p className="home-hero-sub">MediCare Clinic - Cơ sở Hải Châu</p>
      </div>

      <div className="bw-stepper">
        {STEPS.map((label, index) => (
          <div key={label} className={`bw-step${index === step ? " active" : ""}${index < step ? " done" : ""}`}>
            <div className="bw-step__dot">
              {index < step ? <Check className="mc-icon mc-icon--sm bw-step__dot-icon" /> : index + 1}
            </div>
            <div className="bw-step__label hidden-md-down">{label}</div>
          </div>
        ))}
      </div>

      <div className="bw-layout">
        <div className="bw-panel">
          {renderStep()}
          <div className="bw-nav">
            {step > 0 ? (
              <Button variant="ghost" onClick={() => setStep((currentStep) => currentStep - 1)}>
                <ArrowLeft className="mc-icon mc-icon--sm" />
                Quay lại
              </Button>
            ) : (
              <div />
            )}

            {step < STEPS.length - 1 ? (
              <Button onClick={() => setStep((currentStep) => currentStep + 1)} disabled={!canNext()}>
                Tiếp theo
                <ArrowRight className="mc-icon mc-icon--sm" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? "Đang đặt lịch..." : "Xác nhận đặt lịch"}
                {!loading && <ArrowRight className="mc-icon mc-icon--sm" />}
              </Button>
            )}
          </div>
        </div>

        <div className="bw-summary">
          <div className="bw-summary__title">Tóm tắt lịch hẹn</div>
          {[
            ["Cơ sở", "Cơ sở Hải Châu"],
            ["Chuyên khoa", selectedSpecialty?.name ?? "-"],
            ["Bác sĩ", selectedDoctor?.name ?? "-"],
            ["Loại khám", selectedVisitType.label],
            ["Ngày khám", date],
            ["Giờ khám", selectedSlot ? `${selectedSlot.start} - ${selectedSlot.end}` : "-"],
            ["Bệnh nhân", form.name || "-"],
            ["SĐT", form.phone || "-"],
          ].map(([key, value]) => (
            <div className="bw-summary__row" key={key}>
              <span className="bw-summary__key">{key}</span>
              <span className="bw-summary__val">{value}</span>
            </div>
          ))}
          <div className="bw-summary__tip">
            <CircleAlert className="mc-icon mc-icon--sm" />
            Lịch hẹn sẽ được giữ trong 15 phút để bạn xác nhận ở bước PA1.
          </div>
        </div>
      </div>
    </div>
  );
}

