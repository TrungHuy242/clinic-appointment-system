import React, { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  CalendarClock,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  QrCode,
  RefreshCcw,
  Search,
  Stethoscope,
  UserRound,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import LoadingSpinner from "../../../components/LoadingSpinner/LoadingSpinner";
import { lookupAppointment, lookupAppointmentsByPhone } from "../../../services/bookingApi";
import "./LookupPage.css";

const STATUS_CONFIG = {
  PENDING: { label: "Chờ xác nhận", className: "lk-status--pending", icon: Clock },
  PENDING_PA1: { label: "Chờ xác nhận", className: "lk-status--pending", icon: Clock },
  CONFIRMED: { label: "Đã xác nhận", className: "lk-status--confirmed", icon: CheckCircle2 },
  COMPLETED: { label: "Hoàn thành", className: "lk-status--confirmed", icon: CheckCircle2 },
  CANCELLED: { label: "Đã hủy", className: "lk-status--cancelled", icon: XCircle },
};

export default function LookupPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [code, setCode] = useState(searchParams.get("code") || "");
  const [phone, setPhone] = useState(searchParams.get("phone") || "");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [results, setResults] = useState([]);
  const [errors, setErrors] = useState({});
  const [hasSearched, setHasSearched] = useState(false);

  // Check if we came from patient appointments (has code in URL)
  const hasCodeParam = searchParams.get("code");
  const cameFromPatientAppointments = hasCodeParam && searchParams.get("from") === "patient";

  const handleLookupInternal = useCallback(async (searchCode, searchPhone) => {
    setLoading(true);
    setResult(null);
    setResults([]);
    setHasSearched(true);

    try {
      if (searchCode) {
        const data = await lookupAppointment(searchCode, searchPhone);
        setResult(data);
      } else {
        const data = await lookupAppointmentsByPhone(searchPhone);
        if (!data.length) {
          setResult("not_found");
        } else if (data.length === 1) {
          setResult(data[0]);
        } else {
          setResults(data);
        }
      }
    } catch {
      setResult("not_found");
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-search when URL has code parameter
  useEffect(() => {
    const codeParam = searchParams.get("code");
    const phoneParam = searchParams.get("phone");
    
    setCode(codeParam || "");
    setPhone(phoneParam || "");
    
    // Auto search if we have phone
    if (phoneParam && /^0\d{9}$/.test(phoneParam)) {
      handleLookupInternal(codeParam || "", phoneParam);
    } else if (codeParam && phoneParam) {
      // Has code but phone might not be valid - still try
      handleLookupInternal(codeParam, phoneParam);
    }
  }, [handleLookupInternal, searchParams]);

  function validate() {
    const nextErrors = {};
    if (!/^0\d{9}$/.test(phone.trim())) {
      nextErrors.phone = "Số điện thoại phải gồm 10 số, bắt đầu bằng 0.";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleLookup(event) {
    event.preventDefault();
    if (!validate()) return;
    await handleLookupInternal(code.trim(), phone.trim());
  }

  const handleBack = () => {
    // Go back to patient appointments with current tab
    const tab = searchParams.get("tab") || "upcoming";
    navigate(`/app/patient/appointments?tab=${tab}`);
  };

  const statusInfo = result && result !== "not_found" ? STATUS_CONFIG[result.status] : null;
  const isPending = result?.status === "PENDING" || result?.status === "PENDING_PA1";

  return (
    <div className="lk-page">
      {/* Back Button - Show when came from patient appointments */}
      {hasCodeParam && (
        <button className="lk-back-btn" onClick={handleBack}>
          <ArrowLeft size={20} />
          Quay lại lịch hẹn
        </button>
      )}

      {/* Header - Hide when came from patient appointments */}
      {!cameFromPatientAppointments && (
        <div className="lk-header">
          <h1>Tra cứu lịch hẹn</h1>
          <p>Nhập số điện thoại để xem danh sách lịch hẹn, hoặc thêm mã lịch hẹn để tra cứu chi tiết.</p>
        </div>
      )}

      {/* Search Form - Hide when came from patient appointments */}
      {!cameFromPatientAppointments && (
        <form onSubmit={handleLookup} className="lk-search">
          <div className="lk-field">
            <label>Số điện thoại</label>
            <div className="lk-input-wrap">
              <Phone size={18} />
              <input
                type="tel"
                placeholder="0901234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={errors.phone ? "error" : ""}
              />
            </div>
            {errors.phone && <span className="lk-error">{errors.phone}</span>}
          </div>

          <div className="lk-field">
            <label>Mã lịch hẹn (tùy chọn)</label>
            <div className="lk-input-wrap">
              <QrCode size={18} />
              <input
                type="text"
                placeholder="APT-2026-0001"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
              />
            </div>
          </div>

          <button type="submit" className="lk-btn" disabled={loading}>
            <Search size={18} />
            Tra cứu
          </button>
        </form>
      )}

      {/* Loading State */}
      {loading && (
        <div className="lk-state">
          <LoadingSpinner />
        </div>
      )}

      {/* Not Found */}
      {!loading && result === "not_found" && (
        <div className="lk-result lk-result--error">
          <div className="lk-result-icon">
            <AlertCircle size={32} />
          </div>
          <h3>Không tìm thấy lịch hẹn</h3>
          <p>Không có lịch hẹn nào phù hợp với thông tin bạn nhập. Vui lòng kiểm tra lại số điện thoại và mã lịch hẹn.</p>
        </div>
      )}

      {/* Multiple Results */}
      {!loading && results.length > 1 && (
        <div className="lk-result lk-result--list">
          <h3>Tìm thấy {results.length} lịch hẹn</h3>
          <p>Chọn một mục bên dưới để xem chi tiết lịch hẹn</p>
          <div className="lk-list">
            {results.map((item) => {
              const itemStatus = STATUS_CONFIG[item.status] || STATUS_CONFIG.PENDING;
              return (
                <button key={item.id} className="lk-list-item" onClick={() => setResult(item)}>
                  <div className="lk-list-left">
                    <div className="lk-list-date">
                      <CalendarDays size={16} />
                      <span>{item.date}</span>
                    </div>
                    <div className="lk-list-code">{item.code}</div>
                  </div>
                  <div className="lk-list-right">
                    <span className={`lk-status ${itemStatus.className}`}>
                      <itemStatus.icon size={14} />
                      {itemStatus.label}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Single Result */}
      {!loading && result && result !== "not_found" && (
        <div className="lk-result lk-result--detail">
          {/* Status Banner */}
          <div className={`lk-banner ${statusInfo?.className || ""}`}>
            <div className="lk-banner-icon">
              {statusInfo?.icon && <statusInfo.icon size={24} />}
            </div>
            <div className="lk-banner-content">
              <h3>{statusInfo?.label}</h3>
              <p>
                {result.status === "CONFIRMED" && "Lịch hẹn của bạn đã được xác nhận. Vui lòng đến đúng giờ khám."}
                {isPending && "Vui lòng xác nhận lịch hẹn trong thời gian quy định để giữ chỗ khám."}
                {result.status === "CANCELLED" && "Lịch hẹn đã bị hủy. Bạn có thể đặt lịch mới khi cần."}
                {result.status === "COMPLETED" && "Lịch hẹn đã hoàn thành. Cảm ơn bạn đã đến thăm khám."}
              </p>
            </div>
            {isPending && (
              <div className="lk-banner-badge">PA1</div>
            )}
          </div>

          {/* Main Content */}
          <div className="lk-detail-grid">
            {/* QR Code */}
            <div className="lk-qr">
              <QrCode size={48} />
              <span className="lk-qr-text">{result.qrText}</span>
            </div>

            {/* Info */}
            <div className="lk-info">
              <div className="lk-info-header">
                <span className="lk-code">{result.code}</span>
                <span className={`lk-status ${statusInfo?.className || ""}`}>
                  {statusInfo?.icon && <statusInfo.icon size={14} />}
                  {statusInfo?.label}
                </span>
              </div>

              <div className="lk-info-items">
                <div className="lk-info-item">
                  <CalendarClock size={18} />
                  <div>
                    <span className="lk-info-label">Ngày giờ</span>
                    <span className="lk-info-value">{result.date} · {result.slot}</span>
                  </div>
                </div>
                <div className="lk-info-item">
                  <Stethoscope size={18} />
                  <div>
                    <span className="lk-info-label">Bác sĩ</span>
                    <span className="lk-info-value">{result.doctorName || result.doctor}</span>
                    <span className="lk-info-sub">{result.specialtyName || result.specialty}</span>
                  </div>
                </div>
                <div className="lk-info-item">
                  <UserRound size={18} />
                  <div>
                    <span className="lk-info-label">Bệnh nhân</span>
                    <span className="lk-info-value">{result.patientName}</span>
                    <span className="lk-info-sub">{result.patientPhone}</span>
                  </div>
                </div>
                <div className="lk-info-item">
                  <MapPin size={18} />
                  <div>
                    <span className="lk-info-label">Địa điểm khám</span>
                    <span className="lk-info-value">MediCare Clinic - Hải Châu</span>
                    <span className="lk-info-sub">123 Nguyễn Văn Linh, Hải Châu, Đà Nẵng</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="lk-actions">
                {isPending && (
                  <button className="lk-btn-primary" onClick={() => navigate(`/booking-success/${result.code}`)}>
                    <CheckCircle2 size={18} />
                    Xác nhận lịch hẹn
                  </button>
                )}
                {result.status === "CONFIRMED" && !cameFromPatientAppointments && (
                  <button className="lk-btn-primary" onClick={() => navigate(`/booking-success/${result.code}`)}>
                    <Search size={18} />
                    Xem chi tiết
                  </button>
                )}
                {result.status === "CANCELLED" && (
                  <button className="lk-btn-primary" onClick={() => navigate("/book")}>
                    <RefreshCcw size={18} />
                    Đặt lịch mới
                  </button>
                )}
                {!cameFromPatientAppointments && (
                  <button className="lk-btn-secondary" onClick={() => { setResult(null); setCode(""); }}>
                    Tra cứu khác
                  </button>
                )}
              </div>

              {/* Back Button in detail view - Show when came from patient appointments */}
              {cameFromPatientAppointments && (
                <div className="lk-back-in-detail">
                  <button className="lk-btn-full" onClick={handleBack}>
                    <ArrowLeft size={18} />
                    Quay lại lịch hẹn
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Help Text - Hide when came from patient appointments */}
      {!cameFromPatientAppointments && !hasSearched && !loading && !result && results.length === 0 && (
        <div className="lk-help">
          <Search size={20} />
          <p>Nhập số điện thoại hoặc mã lịch hẹn để tra cứu. Bạn cũng có thể dùng mã được gửi trong tin nhắn xác nhận lịch hẹn.</p>
        </div>
      )}

      {/* Footer - Hide when came from patient appointments */}
      {!cameFromPatientAppointments && (
        <div className="lk-footer">
          <p>Hotline: <strong>1900 1234</strong> · Email: <strong>support@medicare.vn</strong></p>
        </div>
      )}
    </div>
  );
}








