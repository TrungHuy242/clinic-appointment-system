import React, { useEffect, useState } from "react";
import Badge from "../../../components/common/Badge";
import Button from "../../../components/common/Button";
import Input from "../../../components/common/Input";
import LoadingSpinner from "../../../components/common/LoadingSpinner";
import Table from "../../../components/common/Table";
import { checkinLookup, listTodayAppointments } from "../../../services/appointmentsApi";
import "../../../styles/pages/dashboard.css";

const STATE_CONFIG = {
  early: {
    emoji: "🕐",
    cls: "early",
    title: "Đến sớm",
    sub: "Chưa đến cửa sổ check-in. Chỉ nhận check-in từ -15 phút trước giờ hẹn.",
    badge: "info",
  },
  valid: {
    emoji: "✅",
    cls: "valid",
    title: "Hợp lệ – Check-in thành công",
    sub: "Bệnh nhân nằm trong cửa sổ check-in và đã được ghi nhận vào hàng đợi khám.",
    badge: "success",
  },
  late: {
    emoji: "⚠️",
    cls: "late",
    title: "Đến muộn (No-show risk)",
    sub: "Đã quá cửa sổ check-in (+10 phút). Cần xử lý theo quy trình no-show/dời lịch.",
    badge: "danger",
  },
  not_found: {
    emoji: "❓",
    cls: "late",
    title: "Không tìm thấy",
    sub: "Mã hoặc SĐT không khớp với lịch hẹn hôm nay.",
    badge: "danger",
  },
};

const RECENT_COLS = [
  { key: "code", title: "Mã lịch", dataIndex: "code" },
  { key: "patientName", title: "Bệnh nhân", dataIndex: "patientName" },
  { key: "slot", title: "Giờ hẹn", dataIndex: "slot" },
  { key: "checkinAt", title: "Check-in lúc", dataIndex: "checkinAt" },
  {
    key: "status",
    title: "Trạng thái",
    render: (row) => (
      <Badge variant={row.status === "CHECKED_IN" ? "success" : "neutral"}>
        {row.status === "CHECKED_IN" ? "Đã check-in" : row.status}
      </Badge>
    ),
  },
];

export default function Checkin() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkinResult, setCheckinResult] = useState(null);
  const [todayList, setTodayList] = useState([]);
  const [listLoading, setListLoading] = useState(true);

  useEffect(() => {
    setListLoading(true);
    listTodayAppointments()
      .then(setTodayList)
      .finally(() => setListLoading(false));
  }, []);

  async function handleCheckin(e) {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setCheckinResult(null);
    try {
      const result = await checkinLookup(query.trim());
      setCheckinResult(result);
      listTodayAppointments().then(setTodayList);
    } catch {
      setCheckinResult({ state: "not_found", appointment: null });
    } finally {
      setLoading(false);
    }
  }

  const cfg = checkinResult ? STATE_CONFIG[checkinResult.state] : null;

  return (
    <div className="mc-stack-lg">
      <div>
        <h1 className="home-hero-title" style={{ fontSize: 20 }}>
          Check-in PA4
        </h1>
        <p className="home-hero-sub">
          Tra cứu bằng mã lịch hẹn hoặc số điện thoại • cửa sổ check-in: [giờ hẹn - 15p, giờ
          hẹn + 10p]
        </p>
      </div>

      <div className="ci-layout">
        <div className="mc-stack-md">
          <div className="ci-panel">
            <form onSubmit={handleCheckin} className="mc-stack-md">
              <Input
                label="Mã lịch hẹn hoặc SĐT"
                placeholder="APT-2025-8834 hoặc 0912345678"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                hint="Nhập mã hoặc SĐT của bệnh nhân"
              />
              <Button type="submit" disabled={loading || !query.trim()}>
                {loading ? "Đang tìm..." : "🔍 Check-in"}
              </Button>
            </form>

            {loading && (
              <div style={{ textAlign: "center", paddingTop: 16 }}>
                <LoadingSpinner />
              </div>
            )}

            {checkinResult && cfg && (
              <div className={`ci-result ${cfg.cls}`}>
                <div className="ci-result__emoji">{cfg.emoji}</div>
                <div className="ci-result__title">
                  {cfg.title}
                  <Badge variant={cfg.badge} style={{ marginLeft: 8 }}>
                    {checkinResult.state}
                  </Badge>
                </div>
                <div className="ci-result__sub">{cfg.sub}</div>
                {checkinResult.appointment && (
                  <div className="ci-result__name">{checkinResult.appointment.patientName}</div>
                )}
                {checkinResult.appointment && (
                  <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 6 }}>
                    {checkinResult.appointment.specialty} · {checkinResult.appointment.doctor} ·{" "}
                    {checkinResult.appointment.slot}
                  </div>
                )}
              </div>
            )}
          </div>

          <div
            className="mc-surface"
            style={{ padding: 14, fontSize: 12, color: "var(--color-text-muted)" }}
          >
            <strong>Mock data để test:</strong>
            <ul style={{ marginTop: 4, paddingLeft: 16, lineHeight: 1.8 }}>
              <li>
                <code>APT-2025-8834</code> hoặc <code>0912345678</code>
              </li>
              <li>
                <code>APT-2025-8835</code> hoặc <code>0901111111</code>
              </li>
              <li>Hợp lệ chỉ trong khoảng [-15p, +10p] so với giờ hẹn</li>
            </ul>
          </div>
        </div>

        <div className="mc-stack-md">
          <div className="ci-recent-title">Lịch hẹn hôm nay</div>
          {listLoading ? (
            <LoadingSpinner />
          ) : (
            <Table columns={RECENT_COLS} data={todayList} emptyMessage="Chưa có lịch hẹn hôm nay." />
          )}
        </div>
      </div>
    </div>
  );
}
