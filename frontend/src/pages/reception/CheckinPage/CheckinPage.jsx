import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeScannerState } from "html5-qrcode";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CircleCheck, CircleX, Clock3, QrCode, Search, Square, TriangleAlert } from "lucide-react";
import Badge from "../../../components/Badge/Badge";
import Button from "../../../components/Button/Button";
import Input from "../../../components/Input/Input";
import LoadingSpinner from "../../../components/LoadingSpinner/LoadingSpinner";
import Table from "../../../components/Table/Table";
import { checkinLookup, listTodayAppointments, receptionApi } from "../../../services/receptionApi";
import "./CheckinPage.css";

const STATE_CONFIG = {
  early: {
    icon: Clock3,
    cls: "early",
    title: "Đến sớm",
    sub: "Chưa đến cửa sổ check-in. Chỉ nhận check-in từ 15 phút trước giờ hẹn.",
    badge: "info",
  },
  valid: {
    icon: CircleCheck,
    cls: "valid",
    title: "Hợp lệ - Check-in thành công",
    sub: "Bệnh nhân đã được ghi nhận vào hàng đợi khám.",
    badge: "success",
  },
  late: {
    icon: TriangleAlert,
    cls: "late",
    title: "Đến muộn",
    sub: "Đã quá cửa sổ check-in (+10 phút). Cần xử lý theo quy trình no-show hoặc dời lịch.",
    badge: "danger",
  },
  not_found: {
    icon: CircleX,
    cls: "late",
    title: "Không tìm thấy",
    sub: "Mã lịch hẹn không khớp với lịch hẹn hôm nay.",
    badge: "danger",
  },
};

const RECENT_COLUMNS = (onMoveToDoctor) => [
  { key: "code", title: "Mã lịch", dataIndex: "code" },
  { key: "patientName", title: "Bệnh nhân", dataIndex: "patientName" },
  { key: "slot", title: "Giờ hẹn", dataIndex: "slot" },
  { key: "checkinAt", title: "Check-in lúc", dataIndex: "checkinAt" },
  {
    key: "status",
    title: "Trạng thái",
    render: (row) => {
      const variant = row.status === "WAITING" ? "warning" : row.status === "CHECKED_IN" ? "success" : "neutral";
      const label = row.status === "WAITING" ? "Đang chờ bác sĩ" : row.status === "CHECKED_IN" ? "Đã check-in" : row.status;
      return <Badge variant={variant}>{label}</Badge>;
    },
  },
  {
    key: "action",
    title: "",
    render: (row) =>
      row.status === "CHECKED_IN" ? (
        <Button size="sm" onClick={() => onMoveToDoctor(row.id)}>Chuyển</Button>
      ) : null,
  },
];

/** Extract appointment code from a scanned QR string.
 *  Expected QR format: MEDICARE|<code>|<phone>|<timestamp>
 *  Falls back to the raw string if it doesn't match the pipe format. */
function extractCodeFromQR(qrString) {
  if (!qrString) return null;
  const trimmed = qrString.trim();
  const parts = trimmed.split("|");
  if (parts.length >= 2) {
    return parts[1].trim();
  }
  return trimmed;
}

export default function CheckinPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkinResult, setCheckinResult] = useState(null);
  const [todayList, setTodayList] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [feedback, setFeedback] = useState(null); // { type: "success"|"error", message: string }

  // QR scan state
  const [scanMode, setScanMode] = useState("manual"); // "manual" | "qr"
  const [scannerError, setScannerError] = useState("");
  const qrScannerRef = useRef(null); // holds Html5Qrcode instance
  const scannerDivRef = useRef(null); // DOM ref for scanner container

  const today = new Date().toISOString().slice(0, 10);

  // Pre-fill query from ?code= param (e.g. from AppointmentsPage)
  useEffect(() => {
    const codeParam = searchParams.get("code");
    if (codeParam) {
      setQuery(codeParam.trim().toUpperCase());
      // Auto-submit check-in after a short delay to let the input render
      const timer = setTimeout(() => {
        performCheckin(codeParam.trim().toUpperCase());
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  // Refresh today's list on mount
  useEffect(() => {
    setListLoading(true);
    listTodayAppointments(today)
      .then(setTodayList)
      .finally(() => setListLoading(false));
  }, [today]);

  // Cleanup scanner on unmount or mode switch
  const stopScanner = async () => {
    if (qrScannerRef.current) {
      try {
        const state = qrScannerRef.current.getState();
        if (state === Html5QrcodeScannerState.SCANNING ||
            state === Html5QrcodeScannerState.PAUSED) {
          await qrScannerRef.current.stop();
        }
      } catch {
        // ignore
      }
      qrScannerRef.current.clear();
      qrScannerRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  // Start camera when switching to QR mode
  useEffect(() => {
    if (scanMode !== "qr") return;
    if (qrScannerRef.current) return; // already started

    const SCANNER_ID = "qr-reader";

    const initScanner = async () => {
      setScannerError("");
      try {
        const scanner = new Html5Qrcode(SCANNER_ID);
        qrScannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            // On successful scan: stop scanner, extract code, check-in
            stopScanner();
            setScanMode("manual");
            const code = extractCodeFromQR(decodedText);
            if (code) {
              performCheckin(code);
            }
          },
          () => {
            // QR detection error — ignore, keep scanning
          }
        );
      } catch (err) {
        setScannerError(
          "Không truy cập được camera. Vui lòng cho phép truy cập camera hoặc dùng nhập tay."
        );
        setScanMode("manual");
      }
    };

    // Small delay to ensure the div is rendered
    const timer = setTimeout(initScanner, 150);
    return () => {
      clearTimeout(timer);
      stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanMode]);

  async function performCheckin(code) {
    setLoading(true);
    setCheckinResult(null);
    try {
      const result = await checkinLookup(code, today);
      setCheckinResult(result);
      const refreshedList = await listTodayAppointments(today);
      setTodayList(refreshedList);
    } catch {
      setCheckinResult({ state: "not_found", appointment: null });
    } finally {
      setLoading(false);
    }
  }

  async function handleMoveToDoctor(id) {
    const appointmentId = id ?? checkinResult?.appointment?.id;
    if (!appointmentId) return;
    try {
      await receptionApi.moveToWaiting(appointmentId);
      const refreshedList = await listTodayAppointments(today);
      setTodayList(refreshedList);
      if (!id) setCheckinResult(null);
      setFeedback({ type: "success", message: "Đã chuyển bệnh nhân sang danh sách khám của bác sĩ." });
    } catch {
      setFeedback({ type: "error", message: "Lỗi khi chuyển bệnh nhân. Vui lòng thử lại." });
    }
  }

  async function handleManualSubmit(event) {
    event.preventDefault();
    if (!query.trim()) return;
    await performCheckin(query.trim());
  }

  function handleQrScanToggle() {
    if (scanMode === "qr") {
      stopScanner();
      setScanMode("manual");
      setScannerError("");
    } else {
      setCheckinResult(null);
      setScanMode("qr");
    }
  }

  const cfg = checkinResult ? STATE_CONFIG[checkinResult.state] : null;
  const ResultIcon = cfg?.icon;

  return (
    <div className="mc-stack-lg checkin-page">
      <div>
        <h1 className="dash-page-title">Check-in bệnh nhân</h1>
        <p className="dash-page-sub">
          Tra cứu lịch hẹn bằng mã hoặc số điện thoại để check-in. Khoảng thời gian check-in: [giờ hẹn - 15 phút, giờ hẹn + 10 phút].
        </p>
      </div>

      <div className="ci-layout">
        <div className="mc-stack-md">
          <div className="ci-panel">

            {/* ── Mode toggle ─────────────────────────────────────── */}
            <div className="ci-mode-toggle">
              <button
                className={`ci-mode-btn ${scanMode === "manual" ? "active" : ""}`}
                onClick={() => scanMode !== "manual" && handleQrScanToggle()}
                type="button"
              >
                <Search size={14} />
                Nhập tay
              </button>
              <button
                className={`ci-mode-btn ${scanMode === "qr" ? "active" : ""}`}
                onClick={() => scanMode !== "qr" && handleQrScanToggle()}
                type="button"
              >
                <QrCode size={14} />
                Quét QR
              </button>
            </div>

            {/* ── QR Scanner ───────────────────────────────────────── */}
            {scanMode === "qr" && (
              <div className="mc-stack-md">
                {scannerError ? (
                  <div className="ci-scanner-error">{scannerError}</div>
                ) : (
                  <>
                    <div id="qr-reader" ref={scannerDivRef} className="ci-qr-viewport" />
                    <div className="ci-scanner-hint">
                      Đưa mã QR vào khung hình để quét. Hệ thống sẽ tự động check-in khi tìm thấy lịch hẹn hợp lệ.
                    </div>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => { stopScanner(); setScanMode("manual"); }}
                    >
                      <Square size={12} /> Dừng quét
                    </Button>
                  </>
                )}
              </div>
            )}

            {/* ── Manual input form ───────────────────────────────── */}
            {scanMode === "manual" && (
              <form onSubmit={handleManualSubmit} className="mc-stack-md">
                <Input
                  label="Mã lịch hẹn hoặc Số điện thoại"
                  placeholder="APT-2026-0001 hoặc 0901234567"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  hint="Nhập mã hoặc số điện thoại của bệnh nhân"
                />
                <Button type="submit" disabled={loading || !query.trim()}>
                  <Search className="mc-icon mc-icon--sm" />
                  {loading ? "Đang tìm..." : "Check-in"}
                </Button>
              </form>
            )}

            {loading && (
              <div className="checkin-page__loading">
                <LoadingSpinner />
              </div>
            )}

            {checkinResult && cfg && (
              <div className={`ci-result ${cfg.cls}`}>
                <div className="ci-result__emoji">
                  {ResultIcon ? <ResultIcon size={28} /> : null}
                </div>
                <div className="ci-result__title">
                  {cfg.title}
                  <Badge className="checkin-page__state-badge" variant={cfg.badge}>
                    {checkinResult.state}
                  </Badge>
                </div>
                <div className="ci-result__sub">{cfg.sub}</div>
                {checkinResult.appointment && (
                  <div className="ci-result__name">{checkinResult.appointment.patientName}</div>
                )}
                {checkinResult.appointment && (
                  <div className="checkin-page__result-meta">
                    {checkinResult.appointment.specialty} · {checkinResult.appointment.doctor} ·{" "}
                    {checkinResult.appointment.slot}
                  </div>
                )}
                {checkinResult.state === "valid" && checkinResult.appointment && (
                  <Button size="sm" onClick={handleMoveToDoctor} style={{ marginTop: "8px" }}>
                    Chuyển sang bác sĩ
                  </Button>
                )}
              </div>
            )}
          </div>

          <div className="mc-surface checkin-page__note-card">
            <strong>Dữ liệu lấy trực tiếp từ backend:</strong>
            <ul className="checkin-page__note-list">
              <li>
                <strong>Nhập tay:</strong> dùng mã lịch hẹn hoặc SĐT của lịch đã xác nhận trong ngày.
              </li>
              <li>
                <strong>Quét QR:</strong> đưa mã QR (trên thẻ hoặc tin nhắn của bệnh nhân) vào khung hình.
              </li>
              <li>Check-in hợp lệ trong khoảng từ 15 phút trước đến 10 phút sau giờ hẹn.</li>
              <li>Sau khi check-in thành công, nhấn <strong>Chuyển sang bác sĩ</strong> để bệnh nhân xuất hiện trong danh sách khám.</li>
              <li>Nút <strong>Chuyển</strong> ở bảng bên dưới cho phép chuyển bệnh nhân đã check-in sang danh sách bác sĩ.</li>
            </ul>
          </div>

          {feedback && (
            <div className={`ci-feedback ci-feedback--${feedback.type}`}>
              {feedback.message}
            </div>
          )}
        </div>

        <div className="mc-stack-md">
          <div className="ci-recent-title">Lịch hẹn hôm nay</div>
          {listLoading ? (
            <LoadingSpinner />
          ) : (
            <Table
              columns={RECENT_COLUMNS(handleMoveToDoctor)}
              data={todayList}
              emptyMessage="Chưa có lịch hẹn hôm nay."
            />
          )}
        </div>
      </div>
    </div>
  );
}
