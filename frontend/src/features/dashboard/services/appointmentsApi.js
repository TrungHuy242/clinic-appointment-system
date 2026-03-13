import { mockRequest } from "../../../shared/services/apiClient";

const CHECKIN_OPEN_OFFSET_MIN = 15;
const CHECKIN_CLOSE_OFFSET_MIN = 10;

const TODAY_APPOINTMENTS = [
  {
    id: 1,
    code: "APT-2025-8834",
    patientName: "Trần Thị Bình",
    phone: "0912345678",
    specialty: "Da liễu",
    doctor: "BS. Trần Ngọc Emily",
    slot: "08:00",
    status: "CONFIRMED",
    checkinAt: null,
  },
  {
    id: 2,
    code: "APT-2025-8835",
    patientName: "Lê Thành Nam",
    phone: "0901111111",
    specialty: "Nhi khoa",
    doctor: "BS. Nguyễn Thị Sarah",
    slot: "08:25",
    status: "CONFIRMED",
    checkinAt: null,
  },
  {
    id: 3,
    code: "APT-2025-8836",
    patientName: "Phạm Hồng Nhung",
    phone: "0922222222",
    specialty: "Tổng quát",
    doctor: "BS. Nguyễn Văn A",
    slot: "09:00",
    status: "CONFIRMED",
    checkinAt: null,
  },
  {
    id: 4,
    code: "APT-2025-8837",
    patientName: "Nguyễn Văn Cường",
    phone: "0933333333",
    specialty: "Tai Mũi Họng",
    doctor: "BS. Phạm Quốc Hùng",
    slot: "09:25",
    status: "CHECKED_IN",
    checkinAt: "08:55",
  },
  {
    id: 5,
    code: "APT-2025-8838",
    patientName: "Võ Thị Thu Hà",
    phone: "0944444444",
    specialty: "Mắt",
    doctor: "BS. Đinh Văn Phú",
    slot: "10:00",
    status: "CHECKED_IN",
    checkinAt: "09:40",
  },
];

const _checkinLog = [];

function pad2(value) {
  return String(value).padStart(2, "0");
}

function timeToMinutes(timeText) {
  const [h, m] = timeText.split(":").map(Number);
  return h * 60 + m;
}

export function listTodayAppointments() {
  const merged = [
    ...TODAY_APPOINTMENTS,
    ..._checkinLog.filter(
      (entry) => !TODAY_APPOINTMENTS.find((appointment) => appointment.code === entry.code)
    ),
  ];
  return mockRequest({ data: merged.map((row) => ({ ...row })), delayMs: 400 });
}

export function checkinLookup(query) {
  const normalizedQuery = query.trim();
  const qUpper = normalizedQuery.toUpperCase();
  const found = TODAY_APPOINTMENTS.find(
    (appointment) =>
      appointment.code.toUpperCase() === qUpper || appointment.phone === normalizedQuery
  );

  if (!found) {
    return mockRequest({
      data: { state: "not_found", appointment: null },
      delayMs: 400,
    });
  }

  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const slotMin = timeToMinutes(found.slot);
  const diffMin = nowMin - slotMin;

  let state = "valid";
  if (diffMin < -CHECKIN_OPEN_OFFSET_MIN) {
    state = "early";
  } else if (diffMin > CHECKIN_CLOSE_OFFSET_MIN) {
    state = "late";
  }

  if (state === "valid") {
    found.checkinAt = `${pad2(now.getHours())}:${pad2(now.getMinutes())}`;
    found.status = "CHECKED_IN";
    const alreadyLogged = _checkinLog.find((row) => row.code === found.code);
    if (!alreadyLogged) {
      _checkinLog.push({ ...found, checkinState: state });
    }
  }

  return mockRequest({
    data: { state, appointment: { ...found } },
    delayMs: 500,
  });
}
