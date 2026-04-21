import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  CalendarCheck2,
  CheckCircle2,
  ClipboardList,
  Clock,
  Copy,
  Info,
  MapPin,
  Phone,
  QrCode,
  ShieldCheck,
  Stethoscope,
  Timer,
  User,
  XCircle,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import LoadingSpinner from "../../../components/LoadingSpinner/LoadingSpinner";
import { confirmPA1, expirePA1, getBookingByCode } from "../../../services/bookingApi";
import "./BookingSuccessPage.css";

const STATUS_CONFIG = {
  CONFIRMED: {
    icon: CheckCircle2,
    title: "Xác nhận thành công!",
    subtitle: "Lịch hẹn đã được xác nhận. Vui lòng đến đúng giờ.",
    color: "success",
    pill: "Đã xác nhận",
  },
  PENDING: {
    icon: Clock,
    title: "Chờ xác nhận",
    subtitle: "Vui lòng xác nhận trong 15 phút để giữ lịch hẹn.",
    color: "warning",
    pill: "Chờ xác nhận",
  },
  PENDING_PA1: {
    icon: Clock,
    title: "Chờ xác nhận",
    subtitle: "Vui lòng xác nhận trong 15 phút để giữ lịch hẹn.",
    color: "warning",
    pill: "Chờ xác nhận",
  },
  CANCELLED: {
    icon: XCircle,
    title: "Lịch hẹn đã hủy",
    subtitle: "Lịch hẹn đã bị hủy do chưa được xác nhận kịp thời.",
    color: "danger",
    pill: "Đã hủy",
  },
};

export default function BookingSuccessPage() {
  const { code } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(location.state?.booking ?? null);
  const [loading, setLoading] = useState(!location.state?.booking);
  const [status, setStatus] = useState(location.state?.booking?.status ?? null);
  const [secsLeft, setSecsLeft] = useState(null);
  const [copyState, setCopyState] = useState("idle");
  const [submitFeedback, setSubmitFeedback] = useState(null); // { type: "error"|"info", message: string }
  const expirySyncedRef = useRef(false);
  const isPending = status === "PENDING" || status === "PENDING_PA1";

  useEffect(() => {
    if (booking) {
      setStatus(booking.status);
      return;
    }
    setLoading(true);
    getBookingByCode(code)
      .then((data) => {
        setBooking(data);
        setStatus(data.status);
      })
      .catch(() => setStatus("NOT_FOUND"))
      .finally(() => setLoading(false));
  }, [booking, code]);

  useEffect(() => {
    if (!booking?.expiresAt || !isPending) return;

    const tick = () => {
      const diff = Math.floor((new Date(booking.expiresAt).getTime() - Date.now()) / 1000);
      if (diff <= 0) {
        setSecsLeft(0);
        setStatus("CANCELLED");
        setBooking((current) => (current ? { ...current, status: "CANCELLED" } : current));
        if (!expirySyncedRef.current) {
          expirySyncedRef.current = true;
          expirePA1(code).catch(() => {});
        }
        return;
      }
      setSecsLeft(diff);
    };

    tick();
    const intervalId = setInterval(tick, 1000);
    return () => clearInterval(intervalId);
  }, [booking, code, isPending]);

  const handleConfirm = useCallback(async () => {
    setLoading(true);
    try {
      const updated = await confirmPA1(code);
      setBooking(updated);
      setStatus(updated.status);
    } catch (error) {
      if (error?.message === "PA1_EXPIRED") {
        await expirePA1(code).catch(() => {});
        setStatus("CANCELLED");
        setBooking((current) => (current ? { ...current, status: "CANCELLED" } : current));
        setSubmitFeedback({ type: "error", message: "Mã xác nhận đã hết hạn, lịch hẹn đã được hủy." });
      } else {
        setSubmitFeedback({ type: "error", message: "Xác nhận thất bại. Vui lòng thử lại." });
      }
    } finally {
      setLoading(false);
    }
  }, [code]);

  const handleCopyCode = useCallback(async () => {
    if (!navigator?.clipboard?.writeText) return;
    const textToCopy = booking.qrText
      ? `Mã lịch hẹn: ${booking.code}\nMã QR: ${booking.qrText}`
      : booking.code;
    await navigator.clipboard.writeText(textToCopy);
    setCopyState("copied");
    window.setTimeout(() => setCopyState("idle"), 2000);
  }, [booking]);

  const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  const StatusIcon = statusConfig.icon;

  if (loading) {
    return (
      <div className="bs-page">
        <div className="bs-loading">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (status === "NOT_FOUND" || !booking) {
    return (
      <div className="bs-page">
        <div className="bs-error-card">
          <div className="bs-error-icon">
            <AlertCircle size={40} />
          </div>
          <h2>Không tìm thấy lịch hẹn</h2>
          <p>Mã lịch hẹn <strong>{code}</strong> không tồn tại hoặc đã hết hiệu lực.</p>
          <button className="bs-btn bs-btn--primary" onClick={() => navigate("/book")}>
            Đặt lịch mới
          </button>
        </div>
      </div>
    );
  }

  const formatCountdown = () => {
    if (secsLeft === null || secsLeft <= 0) return "00:00";
    const minutes = Math.floor(secsLeft / 60);
    const seconds = secsLeft % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  return (
    <div className="bs-page">

      {/* ── Status Hero ── */}
      <div className={`bs-hero bs-hero--${statusConfig.color}`}>
        <div className="bs-hero-inner">
          <div className="bs-hero-icon-wrap">
            <div className="bs-hero-icon-ring" />
            <div className="bs-hero-icon">
              <StatusIcon size={36} />
            </div>
          </div>
          <div className="bs-hero-text">
            <h1>{statusConfig.title}</h1>
            <p>{statusConfig.subtitle}</p>
          </div>
          <div className={`bs-status-pill bs-status-pill--${statusConfig.color}`}>
            {statusConfig.pill}
          </div>
        </div>

        {/* Countdown bar */}
        {isPending && secsLeft !== null && (
          <div className="bs-countdown-bar">
            <div className="bs-countdown-bar-track">
              <div
                className="bs-countdown-bar-fill"
                style={{ width: `${Math.max(0, (secsLeft / 900) * 100)}%` }}
              />
            </div>
            <div className="bs-countdown-bar-label">
              <Timer size={14} />
              <span>Thời gian xác nhận còn lại</span>
              <strong>{formatCountdown()}</strong>
            </div>
          </div>
        )}
      </div>

      {/* ── Main Content ── */}
      <div className="bs-content">

        {/* Left — Appointment Details */}
        <div className="bs-card bs-card--details">
          <div className="bs-card-header">
            <div className="bs-card-icon">
              <ClipboardList size={18} />
            </div>
            <h2>Chi tiết lịch hẹn</h2>
          </div>

          <div className="bs-appointment-code-block">
            <span className="bs-appointment-code-label">Mã lịch hẹn</span>
            <div className="bs-appointment-code-value">
              <strong>{booking.code}</strong>
              <button className="bs-copy-btn" onClick={handleCopyCode}>
                <Copy size={13} />
                {copyState === "copied" ? "Đã lưu!" : "Sao chép"}
              </button>
            </div>
          </div>

          <div className="bs-detail-grid">
            <div className="bs-detail-item">
              <div className="bs-detail-icon">
                <CalendarCheck2 size={16} />
              </div>
              <div className="bs-detail-content">
                <span className="bs-detail-label">Ngày hẹn</span>
                <strong>{booking.date}</strong>
              </div>
            </div>
            <div className="bs-detail-item">
              <div className="bs-detail-icon">
                <Clock size={16} />
              </div>
              <div className="bs-detail-content">
                <span className="bs-detail-label">Giờ hẹn</span>
                <strong>{booking.slot}</strong>
              </div>
            </div>
            <div className="bs-detail-item">
              <div className="bs-detail-icon">
                <Stethoscope size={16} />
              </div>
              <div className="bs-detail-content">
                <span className="bs-detail-label">Chuyên khoa</span>
                <strong>{booking.service || booking.specialty || "—"}</strong>
              </div>
            </div>
            <div className="bs-detail-item">
              <div className="bs-detail-icon">
                <User size={16} />
              </div>
              <div className="bs-detail-content">
                <span className="bs-detail-label">Bác sĩ</span>
                <strong>{booking.doctorName || booking.doctor || "—"}</strong>
              </div>
            </div>
            <div className="bs-detail-item">
              <div className="bs-detail-icon">
                <Phone size={16} />
              </div>
              <div className="bs-detail-content">
                <span className="bs-detail-label">Điện thoại liên hệ</span>
                <strong>{booking.patientPhone}</strong>
              </div>
            </div>
            <div className="bs-detail-item">
              <div className="bs-detail-icon">
                <MapPin size={16} />
              </div>
              <div className="bs-detail-content">
                <span className="bs-detail-label">Địa điểm</span>
                <strong>MediCare Clinic — Cơ sở Hải Châu</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Right — QR + Actions + Notes */}
        <div className="bs-sidebar">

          {/* Unified sidebar card */}
          <div className="bs-sidebar-card">

            {/* QR Section */}
            {booking.qrText && (
              <div className="bs-sidebar-section">
                <div className="bs-sidebar-section-header">
                  <QrCode size={15} />
                  <span>Mã QR Check-in</span>
                </div>
                <div className="bs-sidebar-qr-wrapper">
                  <div className="bs-sidebar-qr-frame">
                    <QRCodeSVG
                      value={booking.qrText}
                      size={160}
                      level="M"
                      fgColor="#0f766e"
                      bgColor="#f8fafc"
                      imageSettings={{
                        src: "",
                        excavate: false,
                        height: 0,
                        width: 0,
                      }}
                    />
                  </div>
                  <div className="bs-sidebar-qr-meta">
                    <code className="bs-sidebar-qr-code-text">{booking.qrText}</code>
                  </div>
                </div>
                <button className="bs-sidebar-copy-btn" onClick={handleCopyCode}>
                  <Copy size={13} />
                  {copyState === "copied" ? "Đã lưu!" : "Sao chép mã QR"}
                </button>
              </div>
            )}

            {/* Feedback */}
            {submitFeedback && (
              <div className={`bs-sidebar-feedback bs-sidebar-feedback--${submitFeedback.type}`}>
                <AlertCircle size={14} />
                {submitFeedback.message}
              </div>
            )}

            {/* Action Buttons */}
            <div className="bs-sidebar-section bs-sidebar-section--actions">
              {isPending && (
                <button
                  className="bs-sidebar-btn bs-sidebar-btn--primary"
                  onClick={handleConfirm}
                  disabled={loading}
                >
                  <CheckCircle2 size={16} />
                  {loading ? "Đang xác nhận..." : "Xác nhận lịch hẹn"}
                </button>
              )}
              {status === "CONFIRMED" && (
                <button
                  className="bs-sidebar-btn bs-sidebar-btn--outline"
                  onClick={() => navigate("/lookup")}
                >
                  <QrCode size={15} />
                  Tra cứu lịch hẹn
                </button>
              )}
              {status === "CANCELLED" && (
                <button
                  className="bs-sidebar-btn bs-sidebar-btn--primary"
                  onClick={() => navigate("/book")}
                >
                  <CalendarCheck2 size={15} />
                  Đặt lịch mới
                </button>
              )}
              <button
                className="bs-sidebar-btn bs-sidebar-btn--ghost"
                onClick={() => navigate("/")}
              >
                Về trang chủ
              </button>
            </div>

            {/* Notes */}
            {status === "CONFIRMED" && (
              <div className="bs-sidebar-section">
                <div className="bs-sidebar-section-header">
                  <Info size={15} />
                  <span>Lưu ý khi đến khám</span>
                </div>
                <ul className="bs-sidebar-notes">
                  <li>
                    <span className="bs-sidebar-note-dot" />
                    Đến trước giờ hẹn <strong>10–15 phút</strong> để làm thủ tục.
                  </li>
                  <li>
                    <span className="bs-sidebar-note-dot" />
                    Mang theo <strong>CMND/CCCD</strong> hoặc giấy tờ tùy thân.
                  </li>
                  <li>
                    <span className="bs-sidebar-note-dot" />
                    Nếu cần hủy hoặc dời lịch, thông báo trước <strong>24 giờ</strong>.
                  </li>
                </ul>
              </div>
            )}
          </div>

          {/* Brand strip */}
          <div className="bs-brand-strip">
            <div className="bs-brand-logo">
              <ShieldCheck size={14} />
            </div>
            <span>MediCare Clinic — Hệ thống chăm sóc sức khỏe</span>
          </div>
        </div>

      </div>
    </div>
  );
}
