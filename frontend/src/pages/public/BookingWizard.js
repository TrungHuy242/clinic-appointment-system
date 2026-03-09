import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import {
  getSpecialties,
  getDoctorsBySpecialty,
  getSlots,
  createGuestBooking,
} from "../../services/bookingApi";
import "../../styles/pages/booking.css";

const STEPS = ["Chọn khoa", "Chọn bác sĩ", "Chọn giờ", "Thông tin BN"];

// Map tên chuyên khoa → icon + màu
const SPECIALTY_STYLE = {
  "Nhi khoa": { icon: "👶", bg: "#e0f2fe", color: "#0369a1" },
  "Da liễu": { icon: "🔬", bg: "#fce7f3", color: "#9d174d" },
  "Tai Mũi Họng": { icon: "👂", bg: "#fef3c7", color: "#92400e" },
  "Nha khoa": { icon: "🦷", bg: "#d1fae5", color: "#065f46" },
  "Tim mạch": { icon: "🫀", bg: "#fee2e2", color: "#991b1b" },
  "Thần kinh": { icon: "🧠", bg: "#ede9fe", color: "#5b21b6" },
  "Mắt": { icon: "👁️", bg: "#f0f9ff", color: "#0369a1" },
  "Khám tổng quát": { icon: "🩺", bg: "#f0fdf4", color: "#166534" },
  "Nội khoa": { icon: "💊", bg: "#fff7ed", color: "#9a3412" },
  "Cơ xương khớp": { icon: "🦴", bg: "#faf5ff", color: "#6b21a8" },
  "default": { icon: "🏥", bg: "#f3f4f6", color: "#374151" },
};
function getSpecialtyStyle(name) {
  return SPECIALTY_STYLE[name] || SPECIALTY_STYLE["default"];
}


function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function BookingWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const [specialties, setSpecialties] = useState([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState(null);

  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  const [date, setDate] = useState(todayStr());
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);

  const [form, setForm] = useState({ name: "", phone: "", dob: "", note: "" });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setLoading(true);
    getSpecialties()
      .then(setSpecialties)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedSpecialty) return;
    setLoading(true);
    setSelectedDoctor(null);
    setSelectedSlot(null);
    getDoctorsBySpecialty(selectedSpecialty.id)
      .then(setDoctors)
      .finally(() => setLoading(false));
  }, [selectedSpecialty]);

  useEffect(() => {
    if (!selectedDoctor) return;
    setLoading(true);
    setSelectedSlot(null);
    getSlots(selectedDoctor.id, date)
      .then(setSlots)
      .finally(() => setLoading(false));
  }, [selectedDoctor, date]);

  function validateForm() {
    const nextErrors = {};
    if (!form.name.trim()) nextErrors.name = "Vui lòng nhập họ tên.";
    if (!/^0\d{9}$/.test(form.phone.trim())) {
      nextErrors.phone = "Số điện thoại không hợp lệ (10 số, bắt đầu bằng 0).";
    }
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
    if (!validateForm()) return;
    if (!selectedSlot) return;

    setLoading(true);
    try {
      const payload = {
        specialtyId: selectedSpecialty.id,
        specialtyName: selectedSpecialty.name,
        doctorId: selectedDoctor.id,
        doctorName: selectedDoctor.name,
        date,
        slotId: selectedSlot.id,
        slot: `${selectedSlot.start} – ${selectedSlot.end}`,
        slotDuration: selectedSlot.duration,
        slotBlocks: selectedSlot.occupies,
        slotBlockIndexes: selectedSlot.blockIndexes,
        patientName: form.name.trim(),
        patientPhone: form.phone.trim(),
        patientDob: form.dob,
        note: form.note.trim(),
      };
      const booking = await createGuestBooking(payload);
      navigate(`/booking-success/${booking.code}`, { state: { booking } });
    } catch (err) {
      alert("Đặt lịch thất bại (mock): " + err.message);
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

  function renderStep() {
    if (loading) {
      return (
        <div style={{ padding: 40, textAlign: "center" }}>
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
              {specialties.map((sp) => {
                const style = getSpecialtyStyle(sp.name);
                return (
                  <button
                    type="button"
                    key={sp.id}
                    className={`bw-card${selectedSpecialty?.id === sp.id ? " selected" : ""}`}
                    onClick={() => setSelectedSpecialty(sp)}
                    style={selectedSpecialty?.id === sp.id ? { background: style.bg, borderColor: "var(--color-primary)" } : {}}
                  >
                    <div className="bw-card__avatar" style={{ fontSize: 28 }}>{style.icon}</div>
                    <div className="bw-card__name">{sp.name}</div>
                  </button>
                );
              })}
            </div>
          </div>
        );


      case 1:
        return (
          <div>
            <div className="bw-panel-title">Chọn bác sĩ – {selectedSpecialty?.name}</div>
            {doctors.length === 0 ? (
              <p style={{ color: "var(--color-text-muted)", fontSize: 14 }}>
                Không có bác sĩ cho chuyên khoa này.
              </p>
            ) : (
              <div className="bw-card-grid">
                {doctors.map((dr) => (
                  <button
                    type="button"
                    key={dr.id}
                    className={`bw-card${selectedDoctor?.id === dr.id ? " selected" : ""}`}
                    onClick={() => setSelectedDoctor(dr)}
                  >
                    <div className="bw-card__avatar">{dr.avatar}</div>
                    <div className="bw-card__name">{dr.name}</div>
                    <div className="bw-card__sub">{dr.slotDuration} phút / lượt</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div>
            <div className="bw-date-row">
              <div className="bw-date-label">Ngày khám:</div>
              <input
                type="date"
                className="mc-input"
                style={{ width: "auto" }}
                value={date}
                min={todayStr()}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="bw-panel-title" style={{ marginBottom: 12 }}>
              Chọn khung giờ ({selectedDoctor?.slotDuration} phút/lượt)
            </div>
            {slots.length === 0 ? (
              <p style={{ color: "var(--color-text-muted)", fontSize: 14 }}>
                Không có slot khả dụng cho ngày này.
              </p>
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
                            ? "Khung giờ này đã có người đặt"
                            : locked
                              ? "Ô này bị khóa vì slot 40 phút đang chọn"
                              : ""
                        }
                      >
                        {slot.start}
                        <div className="bw-slot__dur">{slot.duration}p</div>
                      </button>
                    );
                  })}
                </div>
                <div
                  style={{
                    marginTop: 12,
                    fontSize: 12,
                    color: "var(--color-text-muted)",
                    display: "flex",
                    gap: 16,
                    flexWrap: "wrap",
                  }}
                >
                  <span>⬜ Còn trống</span>
                  <span style={{ color: "var(--color-primary)", fontWeight: 600 }}>
                    ■ Đã chọn
                  </span>
                  <span style={{ color: "var(--color-danger)" }}>■ Đã đặt (conflict)</span>
                  <span style={{ color: "var(--color-text-muted)" }}>
                    ■ Khóa theo slot 40 phút
                  </span>
                  <span>×2 = chiếm 2 block 25 phút</span>
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
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              error={errors.name}
            />
            <Input
              label="Số điện thoại *"
              placeholder="0901234567"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
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
              label="Ghi chú triệu chứng (không bắt buộc)"
              placeholder="Mô tả ngắn triệu chứng..."
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              hint="Thông tin này để bác sĩ chuẩn bị trước, không thay thế chẩn đoán."
            />
          </div>
        );

      default:
        return null;
    }
  }

  return (
    <div className="mc-stack-lg">
      <div>
        <h1 className="home-hero-title" style={{ fontSize: 22 }}>
          Đặt lịch khám
        </h1>
        <p className="home-hero-sub">MediCare Clinic – Cơ sở Hải Châu</p>
      </div>

      <div className="bw-stepper">
        {STEPS.map((label, idx) => (
          <div
            key={label}
            className={`bw-step${idx === step ? " active" : ""}${idx < step ? " done" : ""}`}
          >
            <div className="bw-step__dot">{idx < step ? "✓" : idx + 1}</div>
            <div className="bw-step__label hidden-md-down">{label}</div>
          </div>
        ))}
      </div>

      <div className="bw-layout">
        <div className="bw-panel">
          {renderStep()}
          <div className="bw-nav">
            {step > 0 ? (
              <Button variant="ghost" onClick={() => setStep((s) => s - 1)}>
                ← Quay lại
              </Button>
            ) : (
              <div />
            )}
            {step < STEPS.length - 1 ? (
              <Button onClick={() => setStep((s) => s + 1)} disabled={!canNext()}>
                Tiếp theo →
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? "Đang đặt lịch..." : "Xác nhận đặt lịch ✓"}
              </Button>
            )}
          </div>
        </div>

        <div className="bw-summary">
          <div className="bw-summary__title">Tóm tắt lịch hẹn</div>
          {[
            ["Cơ sở", "Hải Châu"],
            ["Chuyên khoa", selectedSpecialty?.name ?? "—"],
            ["Bác sĩ", selectedDoctor?.name ?? "—"],
            ["Ngày khám", date],
            ["Giờ khám", selectedSlot ? `${selectedSlot.start} – ${selectedSlot.end}` : "—"],
            ["Bệnh nhân", form.name || "—"],
            ["SĐT", form.phone || "—"],
          ].map(([k, v]) => (
            <div className="bw-summary__row" key={k}>
              <span className="bw-summary__key">{k}</span>
              <span className="bw-summary__val">{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
