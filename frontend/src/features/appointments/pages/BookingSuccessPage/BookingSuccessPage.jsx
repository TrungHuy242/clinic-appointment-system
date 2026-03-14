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
  const [loading, setLoading] = useState(!location.state?.booking);
  const [status, setStatus] = useState(location.state?.booking?.status ?? null);
  const [secsLeft, setSecsLeft] = useState(null);
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
        alert("PA1 dã h?t h?n, l?ch h?n dã du?c h?y.");
      } else {
        alert("Xác nh?n th?t b?i.");
      }
    } finally {
      setLoading(false);
    }
  }, [code]);

  function renderCountdown() {
    if (!isPending || secsLeft === null) return null;

    const minutes = Math.floor(secsLeft / 60);
    const seconds = secsLeft % 60;
    return (
      <div className="bs-alert-box">
        <div className="bs-alert-icon">
          <Clock3 className="mc-icon mc-icon--lg" />
        </div>
        <div>
          <div className="bs-alert-title">
            Vui lòng xác nh?n trong vòng{" "}
            <strong>
              {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
            </strong>
          </div>
          <div className="bs-alert-sub">
            Khung gi? này ch? du?c gi? trong 15 phút tru?c khi h? th?ng t? d?ng h?y.
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
          <h1 className="booking-success__not-found-title">Không tìm th?y l?ch h?n</h1>
          <p className="booking-success__not-found-copy">
            Mã l?ch h?n <strong>{code}</strong> không t?n t?i ho?c dã h?t h?n.
          </p>
          <Button onClick={() => navigate("/book")}>Ð?t l?ch m?i</Button>
        </div>
      </div>
    );
  }

  const doctorName = booking.doctorName || booking.doctor;
  const specialtyName = booking.specialtyName || booking.specialty;
  const statusIcon =
    status === "CONFIRMED" ? (
      <CircleCheck className="mc-icon bs-icon-circle__icon" />
    ) : status === "CANCELLED" ? (
      <CircleX className="mc-icon bs-icon-circle__icon" />
    ) : (
      <ShieldCheck className="mc-icon bs-icon-circle__icon" />
    );

  return (
    <div className="bs-wrap mc-stack-lg">
      <div className="bs-card-v2">
        <div
          className={`bs-card-top-bar ${
            status === "CONFIRMED" ? "success" : status === "CANCELLED" ? "danger" : "primary"
          }`}
        />
        <div
          className={`bs-icon-circle ${
            status === "CONFIRMED"
              ? "bs-icon-circle--success"
              : status === "CANCELLED"
                ? "bs-icon-circle--danger"
                : "bs-icon-circle--primary"
          }`}
        >
          {statusIcon}
        </div>

        <h1 className="bs-title">
          {status === "CONFIRMED"
            ? "L?ch h?n dã du?c xác nh?n"
            : status === "CANCELLED"
              ? "L?ch h?n dã h?t h?n"
              : "Ð?t l?ch thành công"}
        </h1>

        <p className="bs-subtitle">
          {status === "CONFIRMED"
            ? "H? th?ng s? nh?c b?n tru?c gi? khám qua SMS."
            : status === "CANCELLED"
              ? "L?ch h?n dã b? h?y vì chua du?c xác nh?n trong th?i h?n 15 phút."
              : `Yêu c?u d?t h?n c?a b?n dã du?c ti?p nh?n cho s? di?n tho?i ${booking.patientPhone}.`}
        </p>

        <div className="booking-success__status-group">
          {status === "CONFIRMED" && (
            <span className="bs-status-pill bs-status-pill--success">Ðã xác nh?n</span>
          )}
          {status === "CANCELLED" && (
            <span className="bs-status-pill bs-status-pill--danger">Ðã h?y</span>
          )}
          {isPending && (
            <span className="bs-status-pill bs-status-pill--warning">Ch? xác nh?n</span>
          )}
        </div>

        <div className="bs-details-grid">
          <div className="bs-detail-item">
            <div className="bs-detail-icon">
              <CalendarDays className="mc-icon mc-icon--sm" />
            </div>
            <div className="bs-detail-label">Ngày và gi?</div>
            <div className="bs-detail-value">{booking.date}</div>
            <div className="bs-detail-sub">{booking.slot}</div>
          </div>
          <div className="bs-detail-item">
            <div className="bs-detail-icon">
              <Stethoscope className="mc-icon mc-icon--sm" />
            </div>
            <div className="bs-detail-label">Bác si</div>
            <div className="bs-detail-value">{doctorName}</div>
            <div className="bs-detail-sub">{specialtyName}</div>
          </div>
          <div className="bs-detail-item">
            <div className="bs-detail-icon">
              <ShieldCheck className="mc-icon mc-icon--sm" />
            </div>
            <div className="bs-detail-label">Mã l?ch h?n</div>
            <div className="bs-detail-value bs-detail-value--code">{booking.code}</div>
          </div>
          <div className="bs-detail-item">
            <div className="bs-detail-icon">
              <MapPin className="mc-icon mc-icon--sm" />
            </div>
            <div className="bs-detail-label">Ð?a di?m</div>
            <div className="bs-detail-value">Co s? H?i Châu</div>
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
              <div className="bs-alert-title">Ðã h?t h?n xác nh?n PA1</div>
              <div className="bs-alert-sub">
                L?ch h?n dã t? d?ng h?y vì chua du?c xác nh?n trong 15 phút.
              </div>
            </div>
          </div>
        )}

        <div className="bs-actions">
          {isPending && (
            <Button onClick={handleConfirm} disabled={loading} className="booking-success__action-btn">
              <ShieldCheck className="mc-icon mc-icon--sm" />
              {loading ? "Ðang xác nh?n..." : "Xác nh?n PA1"}
            </Button>
          )}
          {status === "CANCELLED" && (
            <Button onClick={() => navigate("/book")} className="booking-success__action-btn">
              Ð?t l?ch l?i
            </Button>
          )}
          <Button
            variant="secondary"
            onClick={() => navigate("/lookup")}
            className="booking-success__action-btn"
          >
            <Search className="mc-icon mc-icon--sm" />
            Tra c?u l?ch h?n
          </Button>
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="booking-success__action-btn"
          >
            <Home className="mc-icon mc-icon--sm" />
            V? trang ch?
          </Button>
        </div>
      </div>
    </div>
  );
}
