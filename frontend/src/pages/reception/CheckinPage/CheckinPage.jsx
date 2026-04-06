import React, { useEffect, useState } from "react";
import { CircleCheck, CircleX, Clock3, Search, TriangleAlert } from "lucide-react";
import Badge from "../../../components/Badge/Badge";
import Button from "../../../components/Button/Button";
import Input from "../../../components/Input/Input";
import LoadingSpinner from "../../../components/LoadingSpinner/LoadingSpinner";
import Table from "../../../components/Table/Table";
import "./CheckinPage.css";
import { checkinLookup, listTodayAppointments, receptionApi } from "../../../services/receptionApi";

const STATE_CONFIG = {
  early: {
    icon: Clock3,
    cls: "early",
    title: "Den som",
    sub: "Chua den cua so check-in. Chi nhan check-in tu 15 phut truoc gio hen.",
    badge: "info",
  },
  valid: {
    icon: CircleCheck,
    cls: "valid",
    title: "Hop le - Check-in thanh cong",
    sub: "Benh nhan da duoc ghi nhan vao hang doi kham.",
    badge: "success",
  },
  late: {
    icon: TriangleAlert,
    cls: "late",
    title: "Den muon",
    sub: "Da qua cua so check-in (+10 phut). Can xu ly theo quy trinh no-show hoac doi lich.",
    badge: "danger",
  },
  not_found: {
    icon: CircleX,
    cls: "late",
    title: "Khong tim thay",
    sub: "Ma hoac so dien thoai khong khop voi lich hen hom nay.",
    badge: "danger",
  },
};

const APPOINTMENT_STATUS_CONFIG = {
  CHECKED_IN: { label: "Da check-in", variant: "success" },
  WAITING: { label: "Dang cho bac si", variant: "warning" },
  CONFIRMED: { label: "Da xac nhan", variant: "neutral" },
};

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

  async function handleMoveToDoctor(id) {
    try {
      await receptionApi.moveToWaiting(id);
      const refreshedList = await listTodayAppointments(today);
      setTodayList(refreshedList);
      alert("Da chuyen benh nhan sang bac si");
    } catch {
      alert("Loi khi chuyen benh nhan");
    }
  }

  const recentColumns = [
    { key: "code", title: "Ma lich", dataIndex: "code" },
    { key: "patientName", title: "Benh nhan", dataIndex: "patientName" },
    { key: "slot", title: "Gio hen", dataIndex: "slot" },
    { key: "checkinAt", title: "Check-in luc", dataIndex: "checkinAt" },
    {
      key: "status",
      title: "Trang thai",
      render: (row) => {
        const cfg = APPOINTMENT_STATUS_CONFIG[row.status] ?? { label: row.status, variant: "neutral" };
        return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
      },
    },
    {
      key: "action",
      title: "Chuyen sang bac si",
      render: (row) =>
        row.status === "CHECKED_IN" ? (
          <Button size="sm" onClick={() => handleMoveToDoctor(row.id)}>
            Chuyen
          </Button>
        ) : null,
    },
  ];

  const stateKey = checkinResult?.state?.toLowerCase();
  const cfg = stateKey ? STATE_CONFIG[stateKey] : null;
  const ResultIcon = cfg?.icon;

  return (
    <div className="mc-stack-lg checkin-page">
      <div>
        <h1 className="home-hero-title checkin-page__title">Check-in PA4</h1>
        <p className="home-hero-sub">
          Tra cuu bang ma lich hen hoac so dien thoai trong cua so check-in: [gio hen - 15p, gio hen + 10p]
        </p>
      </div>

      <div className="ci-layout">
        <div className="mc-stack-md">
          <div className="ci-panel">
            <form onSubmit={handleCheckin} className="mc-stack-md">
              <Input
                label="Ma lich hen hoac so dien thoai"
                placeholder="APT-2026-0001 hoac 0901234567"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                hint="Nhap ma hoac so dien thoai cua benh nhan"
              />
              <Button type="submit" disabled={loading || !query.trim()}>
                <Search className="mc-icon mc-icon--sm" />
                {loading ? "Dang tim..." : "Check-in"}
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
                {checkinResult.message && (
                  <div className={`ci-result__message ${checkinResult.state}`}>
                    {checkinResult.message}
                  </div>
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
            <strong>Du lieu lay truc tiep tu backend:</strong>
            <ul className="checkin-page__note-list">
              <li>Nhap ma lich hen hoac so dien thoai cua lich da xac nhan trong ngay.</li>
              <li>Check-in hop le trong khoang tu 15 phut truoc den 10 phut sau gio hen.</li>
              <li>Sau khi check-in hop le, trang thai se duoc cap nhat thanh <code>CHECKED_IN</code>.</li>
              <li>Nut Chuyen se doi trang thai sang <code>WAITING</code> de ban giao cho bac si.</li>
            </ul>
          </div>
        </div>

        <div className="mc-stack-md">
          <div className="ci-recent-title">Lich hen hom nay</div>
          {listLoading ? (
            <LoadingSpinner />
          ) : (
            <Table
              columns={recentColumns}
              data={todayList}
              emptyMessage="Chua co lich hen hom nay."
            />
          )}
        </div>
      </div>
    </div>
  );
}
