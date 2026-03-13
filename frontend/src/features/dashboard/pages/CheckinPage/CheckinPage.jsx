import React, { useEffect, useState } from "react";
import { CircleCheck, CircleX, Clock3, Search, TriangleAlert } from "lucide-react";
import Badge from "../../../../shared/components/Badge/Badge";
import Button from "../../../../shared/components/Button/Button";
import Input from "../../../../shared/components/Input/Input";
import LoadingSpinner from "../../../../shared/components/LoadingSpinner/LoadingSpinner";
import Table from "../../../../shared/components/Table/Table";
import { checkinLookup, listTodayAppointments } from "../../services/appointmentsApi";
import "./CheckinPage.css";

const STATE_CONFIG = {
  early: {
    icon: Clock3,
    cls: "early",
    title: "Đến sớm",
    sub: "Chưa đến cửa sổ check-in. Chỉ nhận check-in từ -15 phút trước giờ hẹn.",
    badge: "info",
  },
  valid: {
    icon: CircleCheck,
    cls: "valid",
    title: "Hợp lệ - Check-in thành công",
    sub: "Bệnh nhân nằm trong cửa sổ check-in và đã được ghi nhận vào hàng đợi khám.",
    badge: "success",
  },
  late: {
    icon: TriangleAlert,
    cls: "late",
    title: "Đến muộn (No-show risk)",
    sub: "Đã quá cửa sổ check-in (+10 phút). Cần xử lý theo quy trình no-show hoặc dời lịch.",
    badge: "danger",
  },
  not_found: {
    icon: CircleX,
    cls: "late",
    title: "Không tìm thấy",
    sub: "Mã hoặc SĐT không khớp với lịch hẹn hôm nay.",
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

  useEffect(() => {
    setListLoading(true);
    listTodayAppointments()
      .then(setTodayList)
      .finally(() => setListLoading(false));
  }, []);

  async function handleCheckin(event) {
    event.preventDefault();
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
  const ResultIcon = cfg?.icon;

  return (
    <div className="mc-stack-lg checkin-page">
      <div>
        <h1 className="home-hero-title checkin-page__title">Check-in PA4</h1>
        <p className="home-hero-sub">
          Tra cứu bằng mã lịch hẹn hoặc số điện thoại • cửa sổ check-in: [giờ hẹn - 15p, giờ hẹn + 10p]
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
            <strong>Mock data để test:</strong>
            <ul className="checkin-page__note-list">
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
            <Table columns={RECENT_COLUMNS} data={todayList} emptyMessage="Chưa có lịch hẹn hôm nay." />
          )}
        </div>
      </div>
    </div>
  );
}