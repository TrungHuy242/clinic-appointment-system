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
    title: "Ð?n s?m",
    sub: "Chua d?n c?a s? check-in. Ch? nh?n check-in t? -15 phút tru?c gi? h?n.",
    badge: "info",
  },
  valid: {
    icon: CircleCheck,
    cls: "valid",
    title: "H?p l? - Check-in thành công",
    sub: "B?nh nhân dã du?c ghi nh?n vào hàng d?i khám.",
    badge: "success",
  },
  late: {
    icon: TriangleAlert,
    cls: "late",
    title: "Ð?n mu?n",
    sub: "Ðã quá c?a s? check-in (+10 phút). C?n x? lý theo quy trình no-show ho?c d?i l?ch.",
    badge: "danger",
  },
  not_found: {
    icon: CircleX,
    cls: "late",
    title: "Không tìm th?y",
    sub: "Mã ho?c SÐT không kh?p v?i l?ch h?n hôm nay.",
    badge: "danger",
  },
};

const RECENT_COLUMNS = [
  { key: "code", title: "Mã l?ch", dataIndex: "code" },
  { key: "patientName", title: "B?nh nhân", dataIndex: "patientName" },
  { key: "slot", title: "Gi? h?n", dataIndex: "slot" },
  { key: "checkinAt", title: "Check-in lúc", dataIndex: "checkinAt" },
  {
    key: "status",
    title: "Tr?ng thái",
    render: (row) => (
      <Badge variant={row.status === "CHECKED_IN" ? "success" : "neutral"}>
        {row.status === "CHECKED_IN" ? "Ðã check-in" : row.status}
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
          Tra c?u b?ng mã l?ch h?n ho?c s? di?n tho?i • c?a s? check-in: [gi? h?n - 15p, gi? h?n + 10p]
        </p>
      </div>

      <div className="ci-layout">
        <div className="mc-stack-md">
          <div className="ci-panel">
            <form onSubmit={handleCheckin} className="mc-stack-md">
              <Input
                label="Mã l?ch h?n ho?c SÐT"
                placeholder="APT-2026-0001 ho?c 0901234567"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                hint="Nh?p mã ho?c s? di?n tho?i c?a b?nh nhân"
              />
              <Button type="submit" disabled={loading || !query.trim()}>
                <Search className="mc-icon mc-icon--sm" />
                {loading ? "Ðang tìm..." : "Check-in"}
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
            <strong>D? li?u l?y tr?c ti?p t? backend:</strong>
            <ul className="checkin-page__note-list">
              <li>Dùng mã l?ch h?n ho?c SÐT c?a l?ch dã xác nh?n trong ngày.</li>
              <li>Check-in h?p l? trong kho?ng t? 15 phút tru?c d?n 10 phút sau gi? h?n.</li>
              <li>Sau khi check-in h?p l?, tr?ng thái s? c?p nh?t thành <code>CHECKED_IN</code>.</li>
            </ul>
          </div>
        </div>

        <div className="mc-stack-md">
          <div className="ci-recent-title">L?ch h?n hôm nay</div>
          {listLoading ? (
            <LoadingSpinner />
          ) : (
            <Table columns={RECENT_COLUMNS} data={todayList} emptyMessage="Chua có l?ch h?n hôm nay." />
          )}
        </div>
      </div>
    </div>
  );
}
