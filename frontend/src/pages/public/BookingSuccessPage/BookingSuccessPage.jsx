import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  CalendarCheck,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  Stethoscope,
  User,
  XCircle,
} from "lucide-react";
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
    title: "Chờ xác nhận PA1",
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
        alert("Mã xác nhận đã hết hạn, lịch hẹn đã được hủy.");
      } else {
        alert("Xác nhận thất bại. Vui lòng thử lại.");
      }
    } finally {
      setLoading(false);
    }
  }, [code]);

  const handleCopyCode = useCallback(async () => {
    if (!booking?.code || !navigator?.clipboard?.writeText) return;
    await navigator.clipboard.writeText(booking.code);
    setCopyState("copied");
    window.setTimeout(() => setCopyState("idle"), 2000);
  }, [booking]);

  const formatCountdown = () => {
    if (secsLeft === null || secsLeft <= 0) return "00:00";
    const minutes = Math.floor(secsLeft / 60);
    const seconds = secsLeft % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="bs-loading">
        <LoadingSpinner />
      </div>
    );
  }

  if (status === "NOT_FOUND" || !booking) {
    return (
      <div className="bs-modal-overlay">
        <div className="bs-modal bs-modal--error">
          <div className="bs-modal-icon bs-modal-icon--error">
            <AlertCircle size={36} />
          </div>
          <h2>Không tìm thấy lịch hẹn</h2>
          <p>Mã lịch hẹn <strong>{code}</strong> không tồn tại hoặc đã hết hiệu lực.</p>
          <button className="bs-modal-btn bs-modal-btn--primary" onClick={() => navigate("/book")}>
            Đặt lịch mới
          </button>
        </div>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  const StatusIcon = statusConfig.icon;

  return (
    <div className="bs-modal-overlay">
      <div className="bs-modal">
        {/* Header */}
        <div className={`bs-modal-header bs-modal-header--${statusConfig.color}`}>
          <div className="bs-modal-header-icon">
            <StatusIcon size={24} />
          </div>
          <div className="bs-modal-header-content">
            <h2>{statusConfig.title}</h2>
            <p>{statusConfig.subtitle}</p>
          </div>
          <span className={`bs-modal-pill bs-modal-pill--${statusConfig.color}`}>
            {statusConfig.pill}
          </span>
        </div>

        {/* Countdown */}
        {isPending && secsLeft !== null && (
          <div className="bs-modal-countdown">
            <Clock size={18} />
            <span>{formatCountdown()}</span>
          </div>
        )}

        {/* Content */}
        <div className="bs-modal-content">
          {/* Code */}
          <div className="bs-modal-code">
            <span className="bs-modal-code-label">Mã lịch hẹn</span>
            <div className="bs-modal-code-value">
              <strong>{booking.code}</strong>
              <button className="bs-modal-copy" onClick={handleCopyCode}>
                {copyState === "copied" ? "Đã lưu" : "Sao chép"}
              </button>
            </div>
          </div>

          {/* Info Grid - Compact */}
          <div className="bs-modal-grid">
            <div className="bs-modal-item">
              <CalendarCheck size={16} />
              <div>
                <span>Ngày</span>
                <strong>{booking.date}</strong>
              </div>
            </div>
            <div className="bs-modal-item">
              <Clock size={16} />
              <div>
                <span>Giờ</span>
                <strong>{booking.slot}</strong>
              </div>
            </div>
            <div className="bs-modal-item">
              <Stethoscope size={16} />
              <div>
                <span>Bác sĩ</span>
                <strong>{booking.doctorName || booking.doctor}</strong>
              </div>
            </div>
            <div className="bs-modal-item">
              <User size={16} />
              <div>
                <span>Bệnh nhân</span>
                <strong>{booking.patientName}</strong>
              </div>
            </div>
            <div className="bs-modal-item">
              <Phone size={16} />
              <div>
                <span>Điện thoại</span>
                <strong>{booking.patientPhone}</strong>
              </div>
            </div>
            <div className="bs-modal-item">
              <MapPin size={16} />
              <div>
                <span>Địa điểm</span>
                <strong>MediCare</strong>
              </div>
            </div>
          </div>

          {/* QR */}
          {booking.qrText && (
            <div className="bs-modal-qr">
              <span>QR Check-in</span>
              <code>{booking.qrText}</code>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="bs-modal-actions">
          {isPending && (
            <button className="bs-modal-btn bs-modal-btn--primary" onClick={handleConfirm} disabled={loading}>
              <CheckCircle2 size={18} />
              {loading ? "Đang xác nhận..." : "Xác nhận ngay"}
            </button>
          )}
          {status === "CONFIRMED" && (
            <button className="bs-modal-btn bs-modal-btn--secondary" onClick={() => navigate("/lookup")}>
              Tra cứu lịch hẹn
            </button>
          )}
          {status === "CANCELLED" && (
            <button className="bs-modal-btn bs-modal-btn--primary" onClick={() => navigate("/book")}>
              Đặt lịch mới
            </button>
          )}
          <button className="bs-modal-btn bs-modal-btn--ghost" onClick={() => navigate("/")}>
            Về trang chủ
          </button>
        </div>
      </div>
    </div>
  );
}


