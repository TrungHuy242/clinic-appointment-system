import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  CalendarClock,
  Camera,
  CheckCircle2,
  Clock,
  ImagePlus,
  MapPin,
  Phone,
  QrCode,
  RefreshCcw,
  Search,
  Stethoscope,
  Upload,
  UserRound,
  XCircle,
} from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import { QRCodeSVG } from "qrcode.react";
import { useNavigate, useSearchParams } from "react-router-dom";
import LoadingSpinner from "../../../components/LoadingSpinner/LoadingSpinner";
import { getBookingByCode, lookupAppointmentsByPhone, expirePA1 } from "../../../services/bookingApi";
import "./LookupPage.css";

const STATUS_CONFIG = {
  PENDING:      { label: "Chờ xác nhận", className: "lk-status--pending",   icon: Clock },
  PENDING_PA1:  { label: "Chờ xác nhận", className: "lk-status--pending",   icon: Clock },
  CONFIRMED:    { label: "Đã xác nhận",  className: "lk-status--confirmed", icon: CheckCircle2 },
  COMPLETED:    { label: "Hoàn thành",     className: "lk-status--confirmed", icon: CheckCircle2 },
  CANCELLED:    { label: "Đã hủy",         className: "lk-status--cancelled", icon: XCircle },
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
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelSuccess, setCancelSuccess] = useState(false);

  // QR scan state
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [scannerError, setScannerError] = useState("");
  const scannerRef = useRef(null);
  const fileInputRef = useRef(null);
  const html5QrRef = useRef(null);

  const hasCodeParam = searchParams.get("code");
  const cameFromPatientAppointments = hasCodeParam && searchParams.get("from") === "patient";

  const handleLookupInternal = useCallback(async (searchCode, searchPhone) => {
    setLoading(true);
    setResult(null);
    setResults([]);
    setHasSearched(true);
    setScannerError("");

    try {
      if (searchCode) {
        const data = await getBookingByCode(searchCode);
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

  // Auto-search from URL params — depend on handleLookupInternal
  useEffect(() => {
    const codeParam = searchParams.get("code");
    const phoneParam = searchParams.get("phone");
    setCode(codeParam || "");
    setPhone(phoneParam || "");

    if (codeParam) {
      handleLookupInternal(codeParam, "");
    } else if (phoneParam && /^0\d{9}$/.test(phoneParam)) {
      handleLookupInternal("", phoneParam);
    }
  }, [searchParams, handleLookupInternal]);

  const validateCode = () => {
    const nextErrors = {};
    if (!code.trim()) {
      nextErrors.code = "Vui lòng nhập mã lịch hẹn.";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validatePhone = () => {
    const nextErrors = {};
    if (!/^0\d{9}$/.test(phone.trim())) {
      nextErrors.phone = "Số điện thoại phải gồm 10 số, bắt đầu bằng 0.";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  async function handleLookup(event) {
    event?.preventDefault();
    setScannerError("");
    if (!validateCode()) return;
    // phone may be empty → code-only lookup (uses detail endpoint)
    await handleLookupInternal(code.trim().toUpperCase(), phone.trim());
  }

  async function handleLookupByPhone(event) {
    event?.preventDefault();
    setScannerError("");
    if (!validatePhone()) return;
    await handleLookupInternal("", phone.trim());
  }

  // ── QR Scanner helpers ─────────────────────────────────────────────────────
  const parseQrText = (text) => {
    // Format: MEDICARE|APT-2026-XXXX|phone|datetime
    const parts = text.split("|");
    if (parts.length >= 2 && parts[0] === "MEDICARE") {
      return parts[1]; // booking code
    }
    return text.trim();
  };

  const startCameraScanner = async () => {
    setScannerError("");
    try {
      if (html5QrRef.current) {
        await html5QrRef.current.stop().catch(() => {});
        html5QrRef.current = null;
      }
      const html5Qr = new Html5Qrcode("lk-qr-reader");
      html5QrRef.current = html5Qr;

      await html5Qr.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 240 },
        (decodedText) => {
          html5Qr.stop().then(() => {
            html5QrRef.current = null;
            setShowQrScanner(false);
            const extractedCode = parseQrText(decodedText);
            setCode(extractedCode);
            handleLookupInternal(extractedCode, "");
          });
        },
        () => {} // ignore scan failures silently
      );
    } catch (err) {
      setScannerError("Không thể truy cập camera. Vui lòng kiểm tra quyền camera.");
    }
  };

  const stopCameraScanner = () => {
    if (html5QrRef.current) {
      html5QrRef.current.stop().then(() => {
        html5QrRef.current = null;
      }).catch(() => {});
    }
  };

  const handleQrFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScannerError("");
    setLoading(true);
    try {
      const html5Qr = new Html5Qrcode("lk-qr-upload-reader");
      const decoded = await html5Qr.scanFile(file, true);
      const extractedCode = parseQrText(decoded);
      setCode(extractedCode);
      await handleLookupInternal(extractedCode, phone.trim());
    } catch {
      setScannerError("Không đọc được mã QR. Vui lòng thử ảnh khác.");
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const toggleScanner = () => {
    if (showQrScanner) {
      stopCameraScanner();
      setShowQrScanner(false);
    } else {
      setShowQrScanner(true);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => stopCameraScanner();
  }, []);

  // ── Cancel ───────────────────────────────────────────────────────────────
  async function handleCancelAppointment() {
    try {
      setLoading(true);
      const updated = await expirePA1(result.code);
      setResult(updated);
      setResults((prev) =>
        prev.map((item) =>
          item.code === result.code ? { ...item, status: "CANCELLED" } : item
        )
      );
      setCancelSuccess(true);
      setShowCancelModal(false);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  const handleBack = () => {
    const tab = searchParams.get("tab") || "upcoming";
    navigate(`/app/patient/appointments?tab=${tab}`);
  };

  const statusInfo = result && result !== "not_found" ? STATUS_CONFIG[result.status] : null;
  const isPending = result?.status === "PENDING" || result?.status === "PENDING_PA1";

  return (
    <div className="lk-page">

      {/* Back Button */}
      {hasCodeParam && (
        <button className="lk-back-btn" onClick={handleBack}>
          <ArrowLeft size={18} />
          Quay lại lịch hẹn
        </button>
      )}

      {/* Header */}
      {!cameFromPatientAppointments && (
        <div className="lk-header">
          <h1>Tra cứu lịch hẹn</h1>
          <p>Nhập mã lịch hẹn để xem chi tiết, hoặc quét mã QR để đăng ký nhanh.</p>
        </div>
      )}

      {/* Search Card */}
      {!cameFromPatientAppointments && (
        <div className="lk-search-card">

          {/* Primary: Code Input */}
          <form onSubmit={handleLookup} className="lk-code-form">
            <div className="lk-code-field">
              <label>Mã lịch hẹn</label>
              <div className={`lk-input-wrap ${errors.code ? "error" : ""}`}>
                <QrCode size={18} />
                <input
                  type="text"
                  placeholder="APT-2026-3139"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.toUpperCase());
                    if (errors.code) setErrors((prev) => ({ ...prev, code: "" }));
                  }}
                  className="lk-input-main"
                  autoComplete="off"
                />
                {code && (
                  <button type="button" className="lk-input-clear" onClick={() => setCode("")}>
                    <XCircle size={15} />
                  </button>
                )}
              </div>
              {errors.code && <span className="lk-error">{errors.code}</span>}
            </div>
            <button type="submit" className="lk-btn lk-btn--primary" disabled={loading}>
              {loading ? <LoadingSpinner size={18} /> : <Search size={18} />}
              Tra cứu
            </button>
          </form>

          {/* QR Scan / Upload */}
          <div className="lk-qr-scan-section">
            <div className="lk-qr-scan-divider">
              <span>hoặc</span>
            </div>
            <div className="lk-qr-scan-actions">
              <button
                type="button"
                className="lk-btn-scan"
                onClick={toggleScanner}
              >
                <Camera size={16} />
                {showQrScanner ? "Tắt camera" : "Quét QR bằng camera"}
              </button>
              <label className="lk-btn-scan lk-btn-scan--upload">
                <Upload size={16} />
                Tải ảnh QR
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="lk-hidden-input"
                  onChange={handleQrFileChange}
                />
              </label>
            </div>

            {/* Camera Scanner */}
            {showQrScanner && (
              <div className="lk-scanner-wrapper">
                <div id="lk-qr-reader" className="lk-scanner-view" />
                <p className="lk-scanner-hint">Đưa mã QR vào khung hình</p>
              </div>
            )}

            {/* Hidden file reader */}
            <div id="lk-qr-upload-reader" style={{ display: "none" }} />

            {scannerError && (
              <div className="lk-scanner-error">
                <AlertCircle size={14} />
                {scannerError}
              </div>
            )}
          </div>

          {/* Secondary: Phone lookup */}
          <div className="lk-phone-section">
            <div className="lk-phone-divider">
              <span>Xem tất cả lịch hẹn theo số điện thoại</span>
            </div>
            <form onSubmit={handleLookupByPhone} className="lk-phone-form">
              <div className="lk-phone-field">
                <div className={`lk-input-wrap ${errors.phone ? "error" : ""}`}>
                  <Phone size={16} />
                  <input
                    type="tel"
                    placeholder="0901234567"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (errors.phone) setErrors((prev) => ({ ...prev, phone: "" }));
                    }}
                    autoComplete="tel"
                  />
                </div>
                {errors.phone && <span className="lk-error">{errors.phone}</span>}
              </div>
              <button type="submit" className="lk-btn lk-btn--secondary" disabled={loading}>
                <Search size={16} />
                Xem danh sách
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="lk-loading">
          <LoadingSpinner />
        </div>
      )}

      {/* Not Found */}
      {!loading && result === "not_found" && (
        <div className="lk-result-card lk-result-card--error">
          <div className="lk-result-icon lk-result-icon--error">
            <AlertCircle size={36} />
          </div>
          <h3>Không tìm thấy lịch hẹn</h3>
          <p>Không có lịch hẹn nào phù hợp. Vui lòng kiểm tra lại mã lịch hẹn hoặc số điện thoại.</p>
        </div>
      )}

      {/* Multiple Results */}
      {!loading && results.length > 1 && (
        <div className="lk-result-card">
          <div className="lk-result-header">
            <h3>Tìm thấy {results.length} lịch hẹn</h3>
            <p>Chọn một mục để xem chi tiết</p>
          </div>
          <div className="lk-appointments-list">
            {results.map((item) => {
              const s = STATUS_CONFIG[item.status] || STATUS_CONFIG.PENDING;
              return (
                <button key={item.id} className="lk-appointment-card" onClick={() => setResult(item)}>
                  <div className="lk-appt-card-left">
                    <div className="lk-appt-date">
                      <CalendarClock size={15} />
                      <span>{item.date} · {item.slot}</span>
                    </div>
                    <div className="lk-appt-code">{item.code}</div>
                    <div className="lk-appt-doctor">{item.doctorName || item.doctor} · {item.specialtyName || item.specialty}</div>
                  </div>
                  <span className={`lk-status ${s.className}`}>
                    <s.icon size={13} />
                    {s.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Single Result */}
      {!loading && result && result !== "not_found" && (
        <div className="lk-result-card lk-result-card--detail">

          {/* Status Hero */}
          <div className={`lk-hero lk-hero--${result.status === "CONFIRMED" || result.status === "COMPLETED" ? "success" : result.status === "CANCELLED" ? "danger" : "warning"}`}>
            <div className="lk-hero-icon">
              {statusInfo?.icon && <statusInfo.icon size={28} />}
            </div>
            <div className="lk-hero-text">
              <h2>{statusInfo?.label}</h2>
              <p>
                {result.status === "CONFIRMED" && "Lịch hẹn đã được xác nhận. Vui lòng đến đúng giờ."}
                {isPending && "Vui lòng xác nhận lịch hẹn để giữ chỗ khám."}
                {result.status === "CANCELLED" && "Lịch hẹn đã bị hủy."}
                {result.status === "COMPLETED" && "Lịch hẹn đã hoàn thành."}
              </p>
            </div>
            {isPending && <div className="lk-hero-badge">PA1</div>}
          </div>

          {/* Main Grid: QR + Info */}
          <div className="lk-detail-grid">

            {/* QR Column */}
            <div className="lk-qr-column">
              <div className="lk-qr-card">
                <div className="lk-qr-card-header">
                  <QrCode size={15} />
                  <span>Mã QR Check-in</span>
                </div>
                {result.qrText ? (
                  <div className="lk-qr-frame">
                    <QRCodeSVG
                      value={result.qrText}
                      size={160}
                      level="M"
                      fgColor="#0f766e"
                      bgColor="#f8fafc"
                    />
                  </div>
                ) : (
                  <div className="lk-qr-placeholder">
                    <QrCode size={40} />
                  </div>
                )}
                <div className="lk-qr-code-text">{result.qrText || result.code}</div>
              </div>

              <div className="lk-action-btns">
                {isPending && (
                  <button className="lk-btn lk-btn--primary" onClick={() => navigate(`/booking-success/${result.code}`)}>
                    <CheckCircle2 size={16} />
                    Xác nhận lịch hẹn
                  </button>
                )}
                {result.status === "CONFIRMED" && (
                  <button className="lk-btn lk-btn--primary" onClick={() => navigate(`/booking-success/${result.code}`)}>
                    <Search size={16} />
                    Xem chi tiết
                  </button>
                )}
                {(result.status === "CONFIRMED" || isPending) && (
                  <button className="lk-btn lk-btn--danger" onClick={() => setShowCancelModal(true)}>
                    <XCircle size={16} />
                    Hủy lịch hẹn
                  </button>
                )}
                {result.status === "CANCELLED" && (
                  <button className="lk-btn lk-btn--primary" onClick={() => navigate("/book")}>
                    <RefreshCcw size={16} />
                    Đặt lịch mới
                  </button>
                )}
                {!cameFromPatientAppointments && (
                  <button className="lk-btn lk-btn--ghost" onClick={() => { setResult(null); setCode(""); setHasSearched(false); }}>
                    Tra cứu khác
                  </button>
                )}
              </div>
            </div>

            {/* Info Column */}
            <div className="lk-info-column">
              {/* Booking Code */}
              <div className="lk-code-block">
                <span className="lk-code-label">Mã lịch hẹn</span>
                <strong className="lk-code-value">{result.code}</strong>
              </div>

              {/* Info Rows */}
              <div className="lk-info-rows">
                <div className="lk-info-row">
                  <div className="lk-info-icon"><CalendarClock size={16} /></div>
                  <div>
                    <span className="lk-info-label">Ngày giờ</span>
                    <strong className="lk-info-value">{result.date} · {result.slot}</strong>
                  </div>
                </div>
                <div className="lk-info-row">
                  <div className="lk-info-icon"><Stethoscope size={16} /></div>
                  <div>
                    <span className="lk-info-label">Bác sĩ · Chuyên khoa</span>
                    <strong className="lk-info-value">{result.doctorName || result.doctor}</strong>
                    <span className="lk-info-sub">{result.specialtyName || result.specialty}</span>
                  </div>
                </div>
                <div className="lk-info-row">
                  <div className="lk-info-icon"><UserRound size={16} /></div>
                  <div>
                    <span className="lk-info-label">Bệnh nhân</span>
                    <strong className="lk-info-value">{result.patientName}</strong>
                    <span className="lk-info-sub">{result.patientPhone}</span>
                  </div>
                </div>
                <div className="lk-info-row">
                  <div className="lk-info-icon"><MapPin size={16} /></div>
                  <div>
                    <span className="lk-info-label">Địa điểm</span>
                    <strong className="lk-info-value">MediCare Clinic — Cơ sở Hải Châu</strong>
                    <span className="lk-info-sub">123 Nguyễn Văn Linh, Hải Châu, Đà Nẵng</span>
                  </div>
                </div>
              </div>

              {/* Notes for confirmed */}
              {result.status === "CONFIRMED" && (
                <div className="lk-notes">
                  <div className="lk-notes-title">
                    <AlertCircle size={13} />
                    Lưu ý khi đến khám
                  </div>
                  <ul>
                    <li>Đến trước giờ hẹn <strong>10–15 phút</strong> để làm thủ tục.</li>
                    <li>Mang theo <strong>CMND/CCCD</strong> hoặc giấy tờ tùy thân.</li>
                    <li>Nếu cần hủy hoặc dời lịch, thông báo trước <strong>24 giờ</strong>.</li>
                  </ul>
                </div>
              )}

              {/* Back button */}
              {cameFromPatientAppointments && (
                <button className="lk-btn lk-btn--ghost lk-btn--full" onClick={handleBack}>
                  <ArrowLeft size={16} />
                  Quay lại lịch hẹn
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="lk-modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowCancelModal(false)}>
          <div className="lk-modal">
            <div className="lk-modal-icon">
              <AlertCircle size={32} />
            </div>
            <h3>Bạn có muốn hủy lịch hẹn?</h3>
            <p>Hành động này không thể hoàn tác. Lịch hẹn <strong>{result?.code}</strong> sẽ bị hủy.</p>
            <div className="lk-modal-actions">
              <button className="lk-btn lk-btn--ghost" onClick={() => setShowCancelModal(false)}>
                Không, giữ lại
              </button>
              <button className="lk-btn lk-btn--danger" onClick={handleCancelAppointment} disabled={loading}>
                {loading ? <LoadingSpinner size={16} /> : null}
                Có, hủy lịch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Success Toast */}
      {cancelSuccess && (
        <div className="lk-toast lk-toast--success">
          Hủy lịch hẹn thành công!
        </div>
      )}

      {/* Empty state */}
      {!cameFromPatientAppointments && !hasSearched && !loading && !result && results.length === 0 && (
        <div className="lk-empty-state">
          <QrCode size={48} />
          <p>Nhập <strong>mã lịch hẹn</strong> hoặc <strong>quét mã QR</strong> trên thẻ khám để tra cứu nhanh. Bạn cũng có thể dùng <strong>số điện thoại</strong> để xem tất cả lịch hẹn.</p>
        </div>
      )}

      {/* Footer */}
      {!cameFromPatientAppointments && (
        <div className="lk-footer">
          <p>Hotline: <strong>1900 1234</strong> · Email: <strong>support@medicare.vn</strong></p>
        </div>
      )}
    </div>
  );
}
