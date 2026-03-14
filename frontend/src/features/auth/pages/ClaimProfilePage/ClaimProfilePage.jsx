import React, { useState } from "react";
import { ArrowRight, Link2, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { appointmentApi } from "../../../patients/services/patientApi";
import "./ClaimProfilePage.css";

const initialForm = {
  appointmentCode: "",
  fullName: "",
};

function mapClaimError(errorCode) {
  if (errorCode === "CLAIM_NOT_FOUND") {
    return "Không tìm thấy hồ sơ khớp với mã lịch hẹn này tại Cơ sở Hải Châu.";
  }
  if (errorCode === "CLAIM_NAME_MISMATCH") {
    return "Họ tên không khớp với mã lịch hẹn. Vui lòng nhập đúng như lúc đặt lịch.";
  }
  return "Không thể liên kết hồ sơ lúc này. Vui lòng thử lại.";
}

export default function ClaimProfilePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [claimResult, setClaimResult] = useState(null);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function validate() {
    const nextErrors = {};

    if (!form.appointmentCode.trim()) {
      nextErrors.appointmentCode = "Vui lòng nhập mã lịch hẹn.";
    }

    if (!form.fullName.trim()) {
      nextErrors.fullName = "Vui lòng nhập họ tên.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setSubmitError("");
    setClaimResult(null);

    try {
      const result = await appointmentApi.claimProfile(form.appointmentCode, form.fullName);
      setClaimResult(result);
    } catch (error) {
      setSubmitError(mapClaimError(error.message));
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setForm(initialForm);
    setErrors({});
    setSubmitError("");
    setClaimResult(null);
  }

  return (
    <div className="claim-page">
      <div className="auth-page-badge claim-page__badge">
        <Link2 className="mc-icon mc-icon--sm" />
        Liên kết hồ sơ
      </div>
      <h1 className="auth-page-title">Liên kết hồ sơ bệnh nhân</h1>
      <p className="claim-page-subtitle">
        Nhập <strong>Mã lịch hẹn</strong> và <strong>Họ tên</strong> đúng như khi đặt lịch để đưa lịch
        hẹn và hồ sơ khám vào cổng bệnh nhân.
      </p>

      <form onSubmit={handleSubmit} className="claim-form">
        <div className="claim-info-box">
          <div className="claim-info-box__title">Thông tin demo để claim</div>
          <div>
            Demo đã seed: <strong>APT-2026-1001</strong> + <strong>Trần Thị Bình</strong>
          </div>
          <div>
            Hoặc: <strong>APT-2026-1015</strong> + <strong>Nguyễn Văn An</strong>
          </div>
        </div>

        <div className="auth-field-group">
          <label className="auth-field-label">Mã lịch hẹn *</label>
          <input
            className={`auth-field-input ${errors.appointmentCode ? "auth-field-input--err" : ""}`}
            placeholder="VD: APT-2026-1001"
            value={form.appointmentCode}
            onChange={(event) => updateField("appointmentCode", event.target.value.toUpperCase())}
          />
          {errors.appointmentCode && <span className="auth-field-error">{errors.appointmentCode}</span>}
        </div>

        <div className="auth-field-group">
          <label className="auth-field-label">Họ và tên bệnh nhân *</label>
          <input
            className={`auth-field-input ${errors.fullName ? "auth-field-input--err" : ""}`}
            placeholder="VD: Trần Thị Bình"
            value={form.fullName}
            onChange={(event) => updateField("fullName", event.target.value)}
          />
          {errors.fullName && <span className="auth-field-error">{errors.fullName}</span>}
        </div>

        {submitError && <div className="claim-submit-error">{submitError}</div>}

        <button type="submit" disabled={submitting} className="claim-submit-button">
          {submitting ? "Đang liên kết..." : "Liên kết hồ sơ"}
          <ArrowRight className="mc-icon mc-icon--sm" />
        </button>
      </form>

      {claimResult && (
        <div className="claim-result">
          <div className="claim-result__card">
            <div className="claim-result__label">Liên kết thành công</div>
            <div className="claim-result__name">{claimResult.patientName}</div>
            <div className="claim-result__meta">Mã lịch hẹn xác thực: {claimResult.appointmentCode}</div>
            <div className="claim-result__summary">
              {claimResult.alreadyClaimed
                ? "Hồ sơ này đã được liên kết trước đó. Bạn có thể vào cổng bệnh nhân để xem lại."
                : `Đã gắn ${claimResult.linkedAppointments} lịch hẹn và ${claimResult.linkedRecords} hồ sơ khám vào cổng bệnh nhân.`}
            </div>
          </div>

          <div className="claim-result__actions">
            <button type="button" className="claim-result__primary" onClick={() => navigate("/patient/appointments")}>
              <ShieldCheck className="mc-icon mc-icon--sm" />
              Vào cổng bệnh nhân
            </button>
            <button type="button" className="claim-result__secondary" onClick={resetForm}>
              Claim hồ sơ khác
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
