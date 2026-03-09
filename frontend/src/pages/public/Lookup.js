import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import LoadingSpinner from "../../components/common/LoadingSpinner";

import { lookupAppointment } from "../../services/bookingApi";
import "../../styles/pages/booking.css";

const STATUS_MAP = {
  PENDING_PA1: {
    label: "Lịch hẹn đã quá hạn xác nhận (15 phút)",
    subLabel: "Hệ thống đã tự động hủy yêu cầu này. Quý khách vui lòng đặt lịch mới.",
    variant: "warning",
    cls: "pending",
    icon: "📅",
    statusText: "Chờ xác nhận",
    statusClass: "bs-status-pill--warning",
  },
  CONFIRMED: {
    label: "Lịch hẹn đã được xác nhận",
    subLabel: "Bạn sẽ được nhắc 30 phút trước giờ hẹn qua SMS.",
    variant: "success",
    cls: "confirmed",
    icon: "✅",
    statusText: "Đã xác nhận",
    statusClass: "bs-status-pill--success",
  },
  CANCELLED: {
    label: "Lịch hẹn đã bị hủy",
    subLabel: "Bạn có thể đặt lịch mới bất kỳ lúc nào.",
    variant: "danger",
    cls: "expired",
    icon: "❌",
    statusText: "Đã hủy tự động (Quá hạn xác nhận)",
    statusClass: "bs-status-pill--danger",
  },
};

export default function Lookup() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [errors, setErrors] = useState({});

  function validate() {
    const e = {};
    if (!code.trim()) e.code = "Vui lòng nhập mã lịch hẹn.";
    if (!/^0\d{9}$/.test(phone.trim())) e.phone = "Số điện thoại không hợp lệ (10 số).";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleLookup(e) {
    e.preventDefault();
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

  return (
    <div className="lk-v2-wrap mc-stack-lg">
      {/* Header */}
      <div style={{ textAlign: "center" }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: "0 0 8px 0" }}>Tra cứu Lịch hẹn</h1>
        <p style={{ fontSize: 14, color: "var(--color-text-muted)", margin: 0 }}>
          Nhập mã lịch hẹn và số điện thoại để kiểm tra trạng thái
        </p>
      </div>

      {/* Search form */}
      <div className="lk-v2-search-card">
        <form onSubmit={handleLookup} className="lk-v2-search-form">
          <div className="lk-v2-field">
            <label className="lk-v2-label">Mã lịch hẹn</label>
            <div className="lk-v2-input-wrap">
              <span className="lk-v2-input-icon">📋</span>
              <input
                className={`lk-v2-input ${errors.code ? "lk-v2-input--error" : ""}`}
                placeholder="APT-2024-8892"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>
            {errors.code && <span className="lk-v2-error-msg">{errors.code}</span>}
          </div>
          <div className="lk-v2-field">
            <label className="lk-v2-label">Số điện thoại</label>
            <div className="lk-v2-input-wrap">
              <span className="lk-v2-input-icon">📱</span>
              <input
                className={`lk-v2-input ${errors.phone ? "lk-v2-input--error" : ""}`}
                placeholder="0901234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            {errors.phone && <span className="lk-v2-error-msg">{errors.phone}</span>}
          </div>
          <button type="submit" className="lk-v2-search-btn" disabled={loading}>
            🔍 Tra cứu
          </button>
        </form>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: "center", padding: 24 }}>
          <LoadingSpinner />
        </div>
      )}

      {/* Not found with "error" alert */}
      {result === "not_found" && (
        <div className="lk-v2-alert lk-v2-alert--danger">
          <div className="lk-v2-alert-icon">❌</div>
          <div>
            <div className="lk-v2-alert-title">Thông tin không trùng khớp</div>
            <div className="lk-v2-alert-sub">Vui lòng kiểm tra lại Mã lịch hẹn và Họ tên.</div>
          </div>
        </div>
      )}

      {/* Found result */}
      {result && result !== "not_found" && statusInfo && (
        <>
          {/* Status banner */}
          {result.status === "CANCELLED" && (
            <div className="lk-v2-alert lk-v2-alert--danger">
              <div className="lk-v2-alert-icon">📅</div>
              <div style={{ flex: 1 }}>
                <div className="lk-v2-alert-title">{statusInfo.label}</div>
                <div className="lk-v2-alert-sub">{statusInfo.subLabel}</div>
              </div>
              <div className="lk-v2-timer-badge">
                <div className="lk-v2-timer-label">THỜI GIAN HẾT HẠN</div>
                <div className="lk-v2-timer-val">00 : 00</div>
              </div>
            </div>
          )}

          {/* Appointment detail card */}
          <div className="lk-v2-detail-card">
            <div className="lk-v2-detail-left">
              {/* QR placeholder */}
              <div className="lk-v2-qr-box">
                <div style={{ fontSize: 48, lineHeight: 1 }}>📱</div>
                <div style={{ fontSize: 10, color: "var(--color-text-muted)", marginTop: 8 }}>QR Check-in</div>
              </div>
              <div className="lk-v2-status-section">
                <div className="lk-v2-status-label">TRẠNG THÁI</div>
                <span className={`bs-status-pill ${statusInfo.statusClass}`}>
                  {statusInfo.statusText}
                </span>
              </div>
            </div>

            <div className="lk-v2-detail-right">
              <div className="lk-v2-detail-header">
                <div>
                  <h3 className="lk-v2-detail-title">Chi tiết lịch hẹn</h3>
                  <div className="lk-v2-detail-code">#{result.code}</div>
                </div>
              </div>

              <div className="lk-v2-info-grid">
                <div className="lk-v2-info-item">
                  <div className="lk-v2-info-icon">📅</div>
                  <div>
                    <div className="lk-v2-info-label">Ngày & Giờ</div>
                    <div className="lk-v2-info-val">{result.date}</div>
                    <div className="lk-v2-info-sub">{result.slot}</div>
                  </div>
                </div>
                <div className="lk-v2-info-item">
                  <div className="lk-v2-info-icon">👤</div>
                  <div>
                    <div className="lk-v2-info-label">Bác sĩ phụ trách</div>
                    <div className="lk-v2-info-val">{result.doctor}</div>
                    <div className="lk-v2-info-sub">{result.specialty}</div>
                  </div>
                </div>
                <div className="lk-v2-info-item">
                  <div className="lk-v2-info-icon">📍</div>
                  <div>
                    <div className="lk-v2-info-label">Địa điểm</div>
                    <div className="lk-v2-info-val">Chi nhánh Hải Châu</div>
                    <div className="lk-v2-info-sub">123 Nguyễn Văn Linh, Đà Nẵng</div>
                  </div>
                </div>
                <div className="lk-v2-info-item">
                  <div className="lk-v2-info-icon">🏥</div>
                  <div>
                    <div className="lk-v2-info-label">Dịch vụ</div>
                    <div className="lk-v2-info-val">{result.specialty}</div>
                    <div className="lk-v2-info-sub">Phí dịch vụ: 300.000đ</div>
                  </div>
                </div>
              </div>

              <div className="lk-v2-detail-actions">
                <button className="lk-v2-action-secondary" onClick={() => { }}>
                  ❓ Hỗ trợ
                </button>
                {result.status === "PENDING_PA1" && (
                  <button className="lk-v2-action-primary" onClick={() => navigate(`/booking-success/${result.code}`)}>
                    ✅ Xác nhận PA1
                  </button>
                )}
                {result.status === "CONFIRMED" && (
                  <button className="lk-v2-action-primary" onClick={() => navigate(`/booking-success/${result.code}`)}>
                    📋 Xem chi tiết
                  </button>
                )}
                {result.status === "CANCELLED" && (
                  <button className="lk-v2-action-primary" onClick={() => navigate("/book")}>
                    📅 Đặt lịch lại ngay
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Footer info */}
      <div className="lk-v2-footer-info">
        <p>Mọi thắc mắc xin vui lòng liên hệ hotline <strong>1900-1234</strong> hoặc email <strong>support@medicare.com</strong></p>
        <p>Hệ thống tự động hủy các lịch hẹn chưa được xác nhận sau 15 phút để ưu tiên cho bệnh nhân khác.</p>
      </div>
    </div>
  );
}