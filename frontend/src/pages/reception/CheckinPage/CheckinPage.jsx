import React, { useEffect, useState } from "react";
import { CircleCheck, CircleX, Clock3, Search, TriangleAlert } from "lucide-react";
import Badge from "../../../components/Badge/Badge";
import Button from "../../../components/Button/Button";
import Input from "../../../components/Input/Input";
import LoadingSpinner from "../../../components/LoadingSpinner/LoadingSpinner";
import Table from "../../../components/Table/Table";
import { checkinLookup, listTodayAppointments } from "../../../services/receptionApi";
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
    title: "Hợp lý - Check-in thành công",
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
    sub: "Mã hoặc số điện thoại không khớp với lịch hẹn hôm nay.",
    badge: "danger",
  },
};

const RECENT_COLUMNS = [
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

export default function CheckinPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkinResult, setCheckinResult] = useState(null);
  const [todayList, setTodayList] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    setListLoading(true);
    listTodayAppointments(today)
      .then(setTodayList)
      .finally(() => setListLoading(false));
  }, [today]);

  async function handleCheckin(event) {
    event.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setCheckinResult(null);
    try {
      const result = await checkinLookup(query.trim(), today);
      setCheckinResult(result);
      const refreshedList = await listTodayAppointments(today);
      setTodayList(refreshedList);
    } catch {
      setCheckinResult({ state: "not_found", appointment: null });
    } finally {
      setLoading(false);
    }
  }

  const cfg = checkinResult ? STATE_CONFIG[checkinResult.state] : null;
  const ResultIcon = cfg?.icon;

  return (
    <div className="mc-stack-lg checkin-page">
      <div>
        <h1 className="home-hero-title checkin-page__title">Check-in PA4</h1>
        <p className="home-hero-sub">
          Tra cứu bằng mã lịch hẹn hoặc số điện thoại của số check-in: [giờ hẹn - 15p, giờ hẹn + 10p]
        </p>
      </div>

      <div className="ci-layout">
        <div className="mc-stack-md">
          <div className="ci-panel">
            <form onSubmit={handleCheckin} className="mc-stack-md">
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

            {loading && (
              <div className="checkin-page__loading">
                <LoadingSpinner />
              </div>
            )}

            {checkinResult && cfg && (
              <div className={`ci-result ${cfg.cls}`}>
                <div className="ci-result__emoji">{ResultIcon ? <ResultIcon size={28} /> : null}</div>
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
                    {checkinResult.appointment.specialty} · {checkinResult.appointment.doctor} · {checkinResult.appointment.slot}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mc-surface checkin-page__note-card">
            <strong>Dữ liệu lấy trực tiếp từ backend:</strong>
            <ul className="checkin-page__note-list">
              <li>Dùng mã lịch hẹn hoặc Số điện thoại của lịch đã xác nhận trong ngày.</li>
              <li>Check-in hợp lệ trong khoảng từ 15 phút trước đến 10 phút sau giờ hẹn.</li>
              <li>Sau khi check-in hợp lệ, trạng thái sẽ được cập nhật thành <code>CHECKED_IN</code>.</li>
            </ul>
          </div>
        </div>

        <div className="mc-stack-md">
          <div className="ci-recent-title">Lịch hẹn hôm nay</div>
          {listLoading ? (
            <LoadingSpinner />
          ) : (
            <Table columns={RECENT_COLUMNS} data={todayList} emptyMessage="Chưa có lịch hẹn hôm nay." />
          )}
        </div>
      </div>
    </div>
  );
}

