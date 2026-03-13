import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  CircleCheck,
  CircleX,
  Clock3,
  Home,
  MapPin,
  Search,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Button from "../../../../shared/components/Button/Button";
import LoadingSpinner from "../../../../shared/components/LoadingSpinner/LoadingSpinner";
import { confirmPA1, expirePA1, getBookingByCode } from "../../services/bookingApi";
import "./BookingSuccessPage.css";

export default function BookingSuccessPage() {
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
  }, [booking, code]);

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
          expirePA1(code).catch(() => {});
        }
      } else {
        setSecsLeft(diff);
      }
    };

    tick();
    const intervalId = setInterval(tick, 1000);
    return () => clearInterval(intervalId);
  }, [booking, code, status]);

  const handleConfirm = useCallback(async () => {
    setLoading(true);
    try {
      await confirmPA1(code);
      setStatus("CONFIRMED");
      setBooking((prev) => (prev ? { ...prev, status: "CONFIRMED" } : prev));
    } catch (error) {
      if (error?.message === "PA1_EXPIRED") {
        await expirePA1(code).catch(() => {});
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
    if (status !== "PENDING_PA1" || secsLeft === null) return null;
    const minutes = Math.floor(secsLeft / 60);
    const seconds = secsLeft % 60;
    return (
      <div className="bs-alert-box">
        <div className="bs-alert-icon">
          <Clock3 className="mc-icon mc-icon--lg" />
        </div>
        <div>
          <div className="bs-alert-title">
            Vui lòng xác nhận trong vòng <strong>{String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}</strong>
          </div>
          <div className="bs-alert-sub">
            Khung giờ này chỉ được giữ trong 15 phút trong khi hệ thống chờ xác minh bảo hiểm và
            thông tin lịch hẹn của bạn.
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="booking-success__loading">
        <LoadingSpinner />
      </div>
    );
  }

  if (status === "NOT_FOUND" || !booking) {
    return (
      <div className="bs-wrap mc-stack-lg">
        <div className="bs-card-v2">
          <div className="bs-icon-circle bs-icon-circle--warning">
            <AlertCircle className="mc-icon bs-icon-circle__icon" />
          </div>
          <h1 className="booking-success__not-found-title">Không tìm thấy lịch hẹn</h1>
          <p className="booking-success__not-found-copy">
            Mã lịch hẹn <strong>{code}</strong> không tồn tại hoặc đã hết hạn.
          </p>
          <Button onClick={() => navigate("/book")}>Đặt lịch mới</Button>
        </div>
      </div>
    );
  }

  const doctorName = booking.doctorName || booking.doctor;
  const specialtyName = booking.specialtyName || booking.specialty;
  const statusIcon =
    status === "CONFIRMED" ? <CircleCheck className="mc-icon bs-icon-circle__icon" /> :
    status === "CANCELLED" ? <CircleX className="mc-icon bs-icon-circle__icon" /> :
    <ShieldCheck className="mc-icon bs-icon-circle__icon" />;

  return (
    <div className="bs-wrap mc-stack-lg">
      <div className="bs-card-v2">
        <div className={`bs-card-top-bar ${status === "CONFIRMED" ? "success" : status === "CANCELLED" ? "danger" : "primary"}`} />
        <div className={`bs-icon-circle ${status === "CONFIRMED" ? "bs-icon-circle--success" : status === "CANCELLED" ? "bs-icon-circle--danger" : "bs-icon-circle--primary"}`}>
          {statusIcon}
        </div>

        <h1 className="bs-title">
          {status === "CONFIRMED"
            ? "Lịch hẹn đã được xác nhận"
            : status === "CANCELLED"
            ? "Lịch hẹn đã hết hạn"
            : "Đặt lịch thành công"}
        </h1>

        <p className="bs-subtitle">
          {status === "CONFIRMED"
            ? "Hệ thống sẽ nhắc bạn trước giờ khám qua SMS."
            : status === "CANCELLED"
            ? "Lịch hẹn chưa được xác nhận trong 15 phút nên đã tự động hủy."
            : (
              <>
                Yêu cầu đặt hẹn của bạn đã được tiếp nhận. Mã xác nhận đang chờ xử lý cho số điện thoại <strong>{booking.patientPhone}</strong>.
              </>
            )}
        </p>

        <div className="booking-success__status-group">
          {status === "CONFIRMED" && <span className="bs-status-pill bs-status-pill--success">Đã xác nhận</span>}
          {status === "CANCELLED" && <span className="bs-status-pill bs-status-pill--danger">Đã hủy</span>}
          {status === "PENDING_PA1" && <span className="bs-status-pill bs-status-pill--warning">Chờ xác nhận</span>}
        </div>

        <div className="bs-details-grid">
          <div className="bs-detail-item">
            <div className="bs-detail-icon"><CalendarDays className="mc-icon mc-icon--sm" /></div>
            <div className="bs-detail-label">Ngày và giờ</div>
            <div className="bs-detail-value">{booking.date}</div>
            <div className="bs-detail-sub">{booking.slot}</div>
          </div>
          <div className="bs-detail-item">
            <div className="bs-detail-icon"><Stethoscope className="mc-icon mc-icon--sm" /></div>
            <div className="bs-detail-label">Bác sĩ</div>
            <div className="bs-detail-value">{doctorName}</div>
            <div className="bs-detail-sub">{specialtyName}</div>
          </div>
          <div className="bs-detail-item">
            <div className="bs-detail-icon"><ShieldCheck className="mc-icon mc-icon--sm" /></div>
            <div className="bs-detail-label">Mã lịch hẹn</div>
            <div className="bs-detail-value bs-detail-value--code">{booking.code}</div>
          </div>
          <div className="bs-detail-item">
            <div className="bs-detail-icon"><MapPin className="mc-icon mc-icon--sm" /></div>
            <div className="bs-detail-label">Địa điểm</div>
            <div className="bs-detail-value">Cơ sở Hải Châu</div>
            <div className="bs-detail-sub">MediCare Clinic</div>
          </div>
        </div>

        {renderCountdown()}
        {status === "CANCELLED" && (
          <div className="bs-alert-box bs-alert-box--danger">
            <div className="bs-alert-icon">
              <AlertCircle className="mc-icon mc-icon--lg" />
            </div>
            <div>
              <div className="bs-alert-title">Đã hết hạn xác nhận PA1</div>
              <div className="bs-alert-sub">Lịch hẹn đã tự động hủy vì chưa được xác nhận trong 15 phút.</div>
            </div>
          </div>
        )}

        <div className="bs-actions">
          {status === "PENDING_PA1" && (
            <Button onClick={handleConfirm} disabled={loading} className="booking-success__action-btn">
              <ShieldCheck className="mc-icon mc-icon--sm" />
              {loading ? "Đang xác nhận..." : "Xác nhận PA1"}
            </Button>
          )}
          {status === "CANCELLED" && (
            <Button onClick={() => navigate("/book")} className="booking-success__action-btn">
              Đặt lịch lại
            </Button>
          )}
          <Button variant="secondary" onClick={() => navigate("/lookup")} className="booking-success__action-btn">
            <Search className="mc-icon mc-icon--sm" />
            Tra cứu lịch hẹn
          </Button>
          <Button variant="ghost" onClick={() => navigate("/")} className="booking-success__action-btn">
            <Home className="mc-icon mc-icon--sm" />
            Về trang chủ
          </Button>
        </div>
      </div>
    </div>
  );
}