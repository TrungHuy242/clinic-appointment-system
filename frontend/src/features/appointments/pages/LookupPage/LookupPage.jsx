import React, { useState } from "react";
import {
  CalendarDays,
  CircleX,
  ClipboardList,
  HelpCircle,
  MapPin,
  Phone,
  QrCode,
  RefreshCcw,
  Search,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import LoadingSpinner from "../../../../shared/components/LoadingSpinner/LoadingSpinner";
import { lookupAppointment } from "../../services/bookingApi";
import "./LookupPage.css";

const STATUS_MAP = {
  PENDING: {
    label: "L?ch h?n dang ch? xác nh?n PA1",
    subLabel: "Vui lòng xác nh?n trong th?i gian hi?u l?c d? gi? khung gi? này.",
    statusText: "Ch? xác nh?n",
    statusClass: "bs-status-pill--warning",
  },
  PENDING_PA1: {
    label: "L?ch h?n dang ch? xác nh?n PA1",
    subLabel: "Vui lòng xác nh?n trong th?i gian hi?u l?c d? gi? khung gi? này.",
    statusText: "Ch? xác nh?n",
    statusClass: "bs-status-pill--warning",
  },
  CONFIRMED: {
    label: "L?ch h?n dã du?c xác nh?n",
    subLabel: "B?n s? du?c nh?c tru?c gi? khám qua SMS.",
    statusText: "Ðã xác nh?n",
    statusClass: "bs-status-pill--success",
  },
  CANCELLED: {
    label: "L?ch h?n dã b? h?y",
    subLabel: "B?n có th? d?t l?ch m?i b?t k? lúc nào d? ch?n khung gi? khác.",
    statusText: "Ðã h?y",
    statusClass: "bs-status-pill--danger",
  },
};

export default function LookupPage() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [errors, setErrors] = useState({});

  function validate() {
    const nextErrors = {};
    if (!code.trim()) nextErrors.code = "Vui lòng nh?p mã l?ch h?n.";
    if (!/^0\d{9}$/.test(phone.trim())) {
      nextErrors.phone = "S? di?n tho?i không h?p l? (10 s?).";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleLookup(event) {
    event.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setResult(null);
    try {
      const data = await lookupAppointment(code.trim(), phone.trim());
      setResult(data);
    } catch {
      setResult("not_found");
    } finally {
      setLoading(false);
    }
  }

  const statusInfo = result && result !== "not_found" ? STATUS_MAP[result.status] : null;
  const isPending = result?.status === "PENDING" || result?.status === "PENDING_PA1";
  const doctorName = result?.doctorName || result?.doctor;
  const specialtyName = result?.specialtyName || result?.specialty;

  return (
    <div className="lk-v2-wrap mc-stack-lg lookup-page">
      <div className="lookup-page__header">
        <h1 className="lookup-page__title">Tra c?u l?ch h?n</h1>
        <p className="lookup-page__subtitle">
          Nh?p mã l?ch h?n và s? di?n tho?i d? ki?m tra tr?ng thái d?t l?ch c?a b?n.
        </p>
      </div>

      <div className="lk-v2-search-card">
        <form onSubmit={handleLookup} className="lk-v2-search-form">
          <div className="lk-v2-field">
            <label className="lk-v2-label">Mã l?ch h?n</label>
            <div className="lk-v2-input-wrap">
              <ClipboardList className="mc-icon mc-icon--sm lk-v2-input-icon" />
              <input
                className={`lk-v2-input ${errors.code ? "lk-v2-input--error" : ""}`}
                placeholder="APT-2026-0001"
                value={code}
                onChange={(event) => setCode(event.target.value)}
              />
            </div>
            {errors.code && <span className="lk-v2-error-msg">{errors.code}</span>}
          </div>

          <div className="lk-v2-field">
            <label className="lk-v2-label">S? di?n tho?i</label>
            <div className="lk-v2-input-wrap">
              <Phone className="mc-icon mc-icon--sm lk-v2-input-icon" />
              <input
                className={`lk-v2-input ${errors.phone ? "lk-v2-input--error" : ""}`}
                placeholder="0901234567"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
              />
            </div>
            {errors.phone && <span className="lk-v2-error-msg">{errors.phone}</span>}
          </div>

          <button type="submit" className="lk-v2-search-btn" disabled={loading}>
            <Search className="mc-icon mc-icon--sm" />
            Tra c?u
          </button>
        </form>
      </div>

      {loading && (
        <div className="lookup-page__loading">
          <LoadingSpinner />
        </div>
      )}

      {result === "not_found" && (
        <div className="lk-v2-alert lk-v2-alert--danger">
          <div className="lk-v2-alert-icon">
            <CircleX className="mc-icon mc-icon--lg" />
          </div>
          <div>
            <div className="lk-v2-alert-title">Thông tin không trùng kh?p</div>
            <div className="lk-v2-alert-sub">
              Vui lòng ki?m tra l?i mã l?ch h?n và s? di?n tho?i.
            </div>
          </div>
        </div>
      )}

      {result && result !== "not_found" && statusInfo && (
        <>
          <div
            className={`lk-v2-alert ${
              result.status === "CANCELLED" ? "lk-v2-alert--danger" : "lk-v2-alert--info"
            }`}
          >
            <div className="lk-v2-alert-icon">
              {result.status === "CANCELLED" ? (
                <CircleX className="mc-icon mc-icon--lg" />
              ) : (
                <ShieldCheck className="mc-icon mc-icon--lg" />
              )}
            </div>
            <div className="lookup-page__alert-copy">
              <div className="lk-v2-alert-title">{statusInfo.label}</div>
              <div className="lk-v2-alert-sub">{statusInfo.subLabel}</div>
            </div>
            {isPending && (
              <div className="lk-v2-timer-badge">
                <div className="lk-v2-timer-label">TR?NG THÁI</div>
                <div className="lk-v2-timer-val">PA1</div>
              </div>
            )}
          </div>

          <div className="lk-v2-detail-card">
            <div className="lk-v2-detail-left">
              <div className="lk-v2-qr-box">
                <QrCode className="mc-icon lookup-page__qr-icon" />
                <div className="lookup-page__qr-label">QR Check-in</div>
              </div>
              <div className="lk-v2-status-section">
                <div className="lk-v2-status-label">TR?NG THÁI</div>
                <span className={`bs-status-pill ${statusInfo.statusClass}`}>
                  {statusInfo.statusText}
                </span>
              </div>
            </div>

            <div className="lk-v2-detail-right">
              <div className="lk-v2-detail-header">
                <div>
                  <h3 className="lk-v2-detail-title">Chi ti?t l?ch h?n</h3>
                  <div className="lk-v2-detail-code">#{result.code}</div>
                </div>
              </div>

              <div className="lk-v2-info-grid">
                <div className="lk-v2-info-item">
                  <div className="lk-v2-info-icon">
                    <CalendarDays className="mc-icon mc-icon--sm" />
                  </div>
                  <div>
                    <div className="lk-v2-info-label">Ngày và gi?</div>
                    <div className="lk-v2-info-val">{result.date}</div>
                    <div className="lk-v2-info-sub">{result.slot}</div>
                  </div>
                </div>
                <div className="lk-v2-info-item">
                  <div className="lk-v2-info-icon">
                    <Stethoscope className="mc-icon mc-icon--sm" />
                  </div>
                  <div>
                    <div className="lk-v2-info-label">Bác si ph? trách</div>
                    <div className="lk-v2-info-val">{doctorName}</div>
                    <div className="lk-v2-info-sub">{specialtyName}</div>
                  </div>
                </div>
                <div className="lk-v2-info-item">
                  <div className="lk-v2-info-icon">
                    <MapPin className="mc-icon mc-icon--sm" />
                  </div>
                  <div>
                    <div className="lk-v2-info-label">Ð?a di?m</div>
                    <div className="lk-v2-info-val">Co s? H?i Châu</div>
                    <div className="lk-v2-info-sub">123 Nguy?n Van Linh, Ðà N?ng</div>
                  </div>
                </div>
                <div className="lk-v2-info-item">
                  <div className="lk-v2-info-icon">
                    <ShieldCheck className="mc-icon mc-icon--sm" />
                  </div>
                  <div>
                    <div className="lk-v2-info-label">D?ch v?</div>
                    <div className="lk-v2-info-val">{specialtyName}</div>
                    <div className="lk-v2-info-sub">Phí d?ch v? tham kh?o: 300.000d</div>
                  </div>
                </div>
              </div>

              <div className="lk-v2-detail-actions">
                <button className="lk-v2-action-secondary" type="button">
                  <HelpCircle className="mc-icon mc-icon--sm" />
                  H? tr?
                </button>
                {isPending && (
                  <button
                    className="lk-v2-action-primary"
                    type="button"
                    onClick={() => navigate(`/booking-success/${result.code}`)}
                  >
                    <ShieldCheck className="mc-icon mc-icon--sm" />
                    Xác nh?n PA1
                  </button>
                )}
                {result.status === "CONFIRMED" && (
                  <button
                    className="lk-v2-action-primary"
                    type="button"
                    onClick={() => navigate(`/booking-success/${result.code}`)}
                  >
                    <Search className="mc-icon mc-icon--sm" />
                    Xem chi ti?t
                  </button>
                )}
                {result.status === "CANCELLED" && (
                  <button
                    className="lk-v2-action-primary"
                    type="button"
                    onClick={() => navigate("/book")}
                  >
                    <RefreshCcw className="mc-icon mc-icon--sm" />
                    Ð?t l?ch l?i
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      <div className="lk-v2-footer-info">
        <p>
          M?i th?c m?c vui lòng liên h? hotline <strong>1900 1234</strong> ho?c email
          <strong> support@medicare.vn</strong>
        </p>
        <p>
          H? th?ng s? t? d?ng h?y các l?ch h?n chua du?c xác nh?n trong 15 phút d? uu tiên cho
          b?nh nhân khác.
        </p>
      </div>
    </div>
  );
}
