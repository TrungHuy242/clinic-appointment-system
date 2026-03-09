import React, { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Button from "../../components/common/Button";

import LoadingSpinner from "../../components/common/LoadingSpinner";
import { confirmPA1, expirePA1, getBookingByCode } from "../../services/bookingApi";
import "../../styles/pages/booking.css";

export default function BookingSuccess() {
  const { code } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(location.state?.booking ?? null);
  const [loading, setLoading] = useState(!booking);
  const [status, setStatus] = useState(booking?.status ?? null);
  const [secsLeft, setSecsLeft] = useState(null);
  const expirySyncedRef = useRef(false);

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
  }, [code, booking]);

  useEffect(() => {
    if (!booking?.expiresAt || status !== "PENDING_PA1") return;

    const tick = () => {
      const diff = Math.floor((new Date(booking.expiresAt).getTime() - Date.now()) / 1000);
      if (diff <= 0) {
        setSecsLeft(0);
        setStatus("CANCELLED");
        setBooking((prev) => (prev ? { ...prev, status: "CANCELLED" } : prev));
        if (!expirySyncedRef.current) {
          expirySyncedRef.current = true;
          expirePA1(code).catch(() => { });
        }
      } else {
        setSecsLeft(diff);
      }
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [booking, code, status]);

  const handleConfirm = useCallback(async () => {
    setLoading(true);
    try {
      await confirmPA1(code);
      setStatus("CONFIRMED");
      setBooking((prev) => (prev ? { ...prev, status: "CONFIRMED" } : prev));
    } catch (err) {
      if (err?.message === "PA1_EXPIRED") {
        await expirePA1(code).catch(() => { });
        setStatus("CANCELLED");
        setBooking((prev) => (prev ? { ...prev, status: "CANCELLED" } : prev));
        alert("PA1 đã hết hạn, lịch hẹn đã được hủy.");
      } else {
        alert("Xác nhận thất bại (mock).");
      }
    } finally {
      setLoading(false);
    }
  }, [code]);

  function renderCountdown() {
    if (status !== "PENDING_PA1") return null;
    if (secsLeft === null) return null;

    const m = Math.floor(secsLeft / 60);
    const s = secsLeft % 60;
    return (
      <div className="bs-alert-box">
        <div className="bs-alert-icon">🕐</div>
        <div>
          <div className="bs-alert-title">
            Vui lòng xác nhận trong vòng{" "}
            <strong>{String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}</strong>
          </div>
          <div className="bs-alert-sub">
            Lưu ý rằng khung giờ này chỉ được giữ trong 15 phút trong khi chúng tôi
            xác minh thông tin bảo hiểm của bạn. Bạn sẽ sớm nhận được tin nhắn SMS xác nhận cuối cùng.
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 60 }}>
        <LoadingSpinner />
      </div>
    );
  }

  if (status === "NOT_FOUND" || !booking) {
    return (
      <div className="bs-wrap mc-stack-lg">
        <div className="bs-card-v2">
          <div className="bs-icon-circle bs-icon-circle--warning">❓</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: "12px 0 8px 0" }}>
            Không tìm thấy lịch hẹn
          </h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: 14, marginBottom: 20 }}>
            Mã lịch hẹn <strong>{code}</strong> không tồn tại hoặc đã hết hạn.
          </p>
          <Button onClick={() => navigate("/book")}>Đặt lịch mới</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bs-wrap mc-stack-lg">
      <div className="bs-card-v2">
        {/* Top accent bar */}
        <div className={`bs-card-top-bar ${status === "CONFIRMED" ? "success" : status === "CANCELLED" ? "danger" : "primary"}`} />

        {/* Icon circle */}
        <div className={`bs-icon-circle ${status === "CONFIRMED" ? "bs-icon-circle--success" : status === "CANCELLED" ? "bs-icon-circle--danger" : "bs-icon-circle--primary"}`}>
          {status === "CONFIRMED" ? "✅" : status === "CANCELLED" ? "❌" : "✅"}
        </div>

        <h1 className="bs-title">
          {status === "CONFIRMED"
            ? "Đã xác nhận lịch hẹn!"
            : status === "CANCELLED"
              ? "Lịch hẹn đã hết hạn"
              : "Đặt lịch thành công!"}
        </h1>

        <p className="bs-subtitle">
          {status === "CONFIRMED"
            ? "Chúng tôi sẽ nhắc nhở bạn trước 24 giờ qua SMS."
            : status === "CANCELLED"
              ? "Lịch hẹn chưa được xác nhận trong 15 phút và đã tự động hủy."
              : <>Yêu cầu đặt hẹn của bạn đã được tiếp nhận. Chúng tôi đã gửi email xác nhận đến <strong>{booking.patientPhone}.</strong></>}
        </p>

        {/* Status badge */}
        <div style={{ marginBottom: 20 }}>
          {status === "CONFIRMED" && (
            <span className="bs-status-pill bs-status-pill--success">✓ Đã xác nhận</span>
          )}
          {status === "CANCELLED" && (
            <span className="bs-status-pill bs-status-pill--danger">✗ Đã hủy</span>
          )}
          {status === "PENDING_PA1" && (
            <span className="bs-status-pill bs-status-pill--warning">⏱ Chờ xác nhận</span>
          )}
        </div>

        {/* Booking details grid */}
        <div className="bs-details-grid">
          <div className="bs-detail-item">
            <div className="bs-detail-label">NGÀY & GIỜ</div>
            <div className="bs-detail-value">{booking.date}</div>
            <div className="bs-detail-sub">{booking.slot}</div>
          </div>
          <div className="bs-detail-item">
            <div className="bs-detail-label">BÁC SĨ</div>
            <div className="bs-detail-value">{booking.doctorName}</div>
            <div className="bs-detail-sub">{booking.specialtyName}</div>
          </div>
          <div className="bs-detail-item">
            <div className="bs-detail-label">MÃ LỊCH HẸN</div>
            <div className="bs-detail-value bs-detail-value--code">{booking.code}</div>
          </div>
          <div className="bs-detail-item">
            <div className="bs-detail-label">ĐỊA ĐIỂM</div>
            <div className="bs-detail-value">Chi nhánh Hải Châu</div>
            <div className="bs-detail-sub">MediCare Clinic</div>
          </div>
        </div>

        {/* Countdown or expired notice */}
        {renderCountdown()}
        {status === "CANCELLED" && (
          <div className="bs-alert-box bs-alert-box--danger">
            <div className="bs-alert-icon">⏰</div>
            <div>
              <div className="bs-alert-title">Đã hết hạn xác nhận (PA1 Expired)</div>
              <div className="bs-alert-sub">Lịch hẹn đã tự động hủy vì chưa được xác nhận trong vòng 15 phút.</div>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="bs-actions">
          {status === "PENDING_PA1" && (
            <Button onClick={handleConfirm} disabled={loading} style={{ flex: 1 }}>
              {loading ? "Đang xác nhận..." : "✅ Xác nhận sẽ đến"}
            </Button>
          )}
          {status === "CANCELLED" && (
            <Button onClick={() => navigate("/book")} style={{ flex: 1 }}>Đặt lịch lại</Button>
          )}
          <Button variant="secondary" onClick={() => navigate("/lookup")} style={{ flex: 1 }}>
            Thêm vào lịch
          </Button>
          <Button variant="ghost" onClick={() => navigate("/")} style={{ flex: 1 }}>
            Về trang chủ
          </Button>
        </div>
      </div>
    </div>
  );
}
