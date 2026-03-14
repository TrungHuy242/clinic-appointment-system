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
    label: "Lịch hẹn đang chờ xác nhận PA1",
    subLabel: "Vui lòng xác nhận trong thời gian hiệu lực để giữ khung giờ đã chọn.",
    statusText: "Chờ xác nhận",
    statusClass: "bs-status-pill--warning",
  },
  PENDING_PA1: {
    label: "Lịch hẹn đang chờ xác nhận PA1",
    subLabel: "Vui lòng xác nhận trong thời gian hiệu lực để giữ khung giờ đã chọn.",
    statusText: "Chờ xác nhận",
    statusClass: "bs-status-pill--warning",
  },
  CONFIRMED: {
    label: "Lịch hẹn đã được xác nhận",
    subLabel: "Bạn sẽ nhận nhắc lịch gần giờ khám qua SMS hoặc tại cổng bệnh nhân.",
    statusText: "Đã xác nhận",
    statusClass: "bs-status-pill--success",
  },
  CANCELLED: {
    label: "Lịch hẹn đã bị hủy",
    subLabel: "Bạn có thể đặt lại bất kỳ lúc nào để chọn khung giờ phù hợp hơn.",
    statusText: "Đã hủy",
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
    if (!code.trim()) nextErrors.code = "Vui lòng nhập mã lịch hẹn.";
    if (!/^0\d{9}$/.test(phone.trim())) {
      nextErrors.phone = "Số điện thoại không hợp lệ (10 số, bắt đầu bằng 0).";
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
        <h1 className="lookup-page__title">{"Tra cứu lịch hẹn"}</h1>
        <p className="lookup-page__subtitle">
          {"Nhập mã lịch hẹn và số điện thoại để xem trạng thái xử lý, thông tin bác sĩ và hướng dẫn bước tiếp theo."}
        </p>
      </div>

      <div className="lk-v2-search-card">
        <form onSubmit={handleLookup} className="lk-v2-search-form">
          <div className="lk-v2-field">
            <label className="lk-v2-label">{"Mã lịch hẹn"}</label>
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
            <label className="lk-v2-label">{"Số điện thoại"}</label>
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
            {"Tra cứu"}
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
            <div className="lk-v2-alert-title">{"Thông tin không trùng khớp"}</div>
            <div className="lk-v2-alert-sub">
              {"Vui lòng kiểm tra lại mã lịch hẹn và số điện thoại đã dùng khi đặt."}
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
                <div className="lk-v2-timer-label">{"TRẠNG THÁI"}</div>
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
                <div className="lk-v2-status-label">{"TRẠNG THÁI"}</div>
                <span className={`bs-status-pill ${statusInfo.statusClass}`}>
                  {statusInfo.statusText}
                </span>
              </div>
            </div>

            <div className="lk-v2-detail-right">
              <div className="lk-v2-detail-header">
                <div>
                  <h3 className="lk-v2-detail-title">{"Chi tiết lịch hẹn"}</h3>
                  <div className="lk-v2-detail-code">#{result.code}</div>
                </div>
              </div>

              <div className="lk-v2-info-grid">
                <div className="lk-v2-info-item">
                  <div className="lk-v2-info-icon">
                    <CalendarDays className="mc-icon mc-icon--sm" />
                  </div>
                  <div>
                    <div className="lk-v2-info-label">{"Ngày và giờ"}</div>
                    <div className="lk-v2-info-val">{result.date}</div>
                    <div className="lk-v2-info-sub">{result.slot}</div>
                  </div>
                </div>
                <div className="lk-v2-info-item">
                  <div className="lk-v2-info-icon">
                    <Stethoscope className="mc-icon mc-icon--sm" />
                  </div>
                  <div>
                    <div className="lk-v2-info-label">{"Bác sĩ phụ trách"}</div>
                    <div className="lk-v2-info-val">{doctorName}</div>
                    <div className="lk-v2-info-sub">{specialtyName}</div>
                  </div>
                </div>
                <div className="lk-v2-info-item">
                  <div className="lk-v2-info-icon">
                    <MapPin className="mc-icon mc-icon--sm" />
                  </div>
                  <div>
                    <div className="lk-v2-info-label">{"Địa điểm"}</div>
                    <div className="lk-v2-info-val">{"Cơ sở Hải Châu"}</div>
                    <div className="lk-v2-info-sub">{"123 Nguyễn Văn Linh, Đà Nẵng"}</div>
                  </div>
                </div>
                <div className="lk-v2-info-item">
                  <div className="lk-v2-info-icon">
                    <ShieldCheck className="mc-icon mc-icon--sm" />
                  </div>
                  <div>
                    <div className="lk-v2-info-label">{"Dịch vụ"}</div>
                    <div className="lk-v2-info-val">{specialtyName}</div>
                    <div className="lk-v2-info-sub">{"Phí dịch vụ tham khảo: 300.000đ"}</div>
                  </div>
                </div>
              </div>

              <div className="lk-v2-detail-actions">
                <button className="lk-v2-action-secondary" type="button">
                  <HelpCircle className="mc-icon mc-icon--sm" />
                  {"Hỗ trợ"}
                </button>
                {isPending && (
                  <button
                    className="lk-v2-action-primary"
                    type="button"
                    onClick={() => navigate(`/booking-success/${result.code}`)}
                  >
                    <ShieldCheck className="mc-icon mc-icon--sm" />
                    {"Xác nhận PA1"}
                  </button>
                )}
                {result.status === "CONFIRMED" && (
                  <button
                    className="lk-v2-action-primary"
                    type="button"
                    onClick={() => navigate(`/booking-success/${result.code}`)}
                  >
                    <Search className="mc-icon mc-icon--sm" />
                    {"Xem chi tiết"}
                  </button>
                )}
                {result.status === "CANCELLED" && (
                  <button
                    className="lk-v2-action-primary"
                    type="button"
                    onClick={() => navigate("/book")}
                  >
                    <RefreshCcw className="mc-icon mc-icon--sm" />
                    {"Đặt lại"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      <div className="lk-v2-footer-info">
        <p>
          {"Mọi thắc mắc vui lòng liên hệ hotline "}<strong>1900 1234</strong>{" hoặc email"}
          <strong> support@medicare.vn</strong>
        </p>
        <p>
          {"Hệ thống sẽ tự động hủy các lịch hẹn chưa được xác nhận trong 15 phút để ưu tiên khung giờ cho"}
          {" bệnh nhân khác."}
        </p>
      </div>
    </div>
  );
}
