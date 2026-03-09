import { mockRequest } from "./http";

const SLOT_BLOCK_MINUTES = 25;
const CLINIC_START_MIN = 8 * 60;
const LUNCH_START_MIN = 12 * 60;
const LUNCH_END_MIN = 13 * 60 + 30;
const CLINIC_END_MIN = 17 * 60;
const DOUBLE_BLOCK_VISIT = 40;

const SPECIALTIES = [
  { id: "nhi", name: "Nhi khoa" },
  { id: "da-lieu", name: "Da liễu" },
  { id: "tai-mui-hong", name: "Tai Mũi Họng" },
  { id: "tong-quat", name: "Khám tổng quát" },
  { id: "mat", name: "Mắt" },
];

const DOCTORS = {
  nhi: [
    { id: "dr-sarah", name: "BS. Nguyễn Thị Sarah", avatar: "👩‍⚕️", slotDuration: 25 },
    { id: "dr-minh", name: "BS. Lê Văn Minh", avatar: "👨‍⚕️", slotDuration: 25 },
  ],
  "da-lieu": [
    { id: "dr-emily", name: "BS. Trần Ngọc Emily", avatar: "👩‍⚕️", slotDuration: 40 },
  ],
  "tai-mui-hong": [
    { id: "dr-hung", name: "BS. Phạm Quốc Hùng", avatar: "👨‍⚕️", slotDuration: 25 },
  ],
  "tong-quat": [
    { id: "dr-anh", name: "BS. Nguyễn Văn A", avatar: "👨‍⚕️", slotDuration: 25 },
    { id: "dr-thu", name: "BS. Võ Thị Thu", avatar: "👩‍⚕️", slotDuration: 25 },
  ],
  mat: [
    { id: "dr-phu", name: "BS. Đinh Văn Phú", avatar: "👨‍⚕️", slotDuration: 40 },
  ],
};

const MOCK_CONFLICT_BLOCKS = new Set([2, 5, 8]);
const ALL_DOCTORS = Object.values(DOCTORS).flat();

function pad2(n) {
  return String(n).padStart(2, "0");
}

function minuteToTime(totalMinutes) {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${pad2(h)}:${pad2(m)}`;
}

function getDoctorById(doctorId) {
  return ALL_DOCTORS.find((doctor) => doctor.id === doctorId);
}

function getBaseBlocks() {
  const blocks = [];
  let cursor = CLINIC_START_MIN;
  let blockIdx = 0;

  while (cursor + SLOT_BLOCK_MINUTES <= CLINIC_END_MIN) {
    if (cursor >= LUNCH_START_MIN && cursor < LUNCH_END_MIN) {
      cursor = LUNCH_END_MIN;
      continue;
    }

    const endMin = cursor + SLOT_BLOCK_MINUTES;
    if (cursor < LUNCH_START_MIN && endMin > LUNCH_START_MIN) {
      cursor = LUNCH_END_MIN;
      continue;
    }

    blocks.push({
      blockIdx,
      startMin: cursor,
      endMin,
      start: minuteToTime(cursor),
      end: minuteToTime(endMin),
      status: MOCK_CONFLICT_BLOCKS.has(blockIdx) ? "conflict" : "available",
    });

    cursor += SLOT_BLOCK_MINUTES;
    blockIdx += 1;
  }

  return blocks;
}

function generateSlots(doctorId, date) {
  const doctor = getDoctorById(doctorId);
  const duration = doctor?.slotDuration ?? SLOT_BLOCK_MINUTES;
  const isDouble = duration === DOUBLE_BLOCK_VISIT;
  const baseBlocks = getBaseBlocks();

  if (!isDouble) {
    return baseBlocks.map((block) => ({
      id: `${doctorId}-${date}-${block.blockIdx}`,
      start: block.start,
      end: block.end,
      duration,
      status: block.status,
      occupies: 1,
      blockIndexes: [block.blockIdx],
      primaryBlockIndex: block.blockIdx,
      nextBlockIndex: null,
    }));
  }

  const slots = [];
  for (let i = 0; i < baseBlocks.length - 1; i += 1) {
    const firstBlock = baseBlocks[i];
    const secondBlock = baseBlocks[i + 1];
    const isAdjacent = firstBlock.endMin === secondBlock.startMin;
    const hasConflict =
      !isAdjacent ||
      firstBlock.status === "conflict" ||
      secondBlock.status === "conflict";

    slots.push({
      id: `${doctorId}-${date}-${firstBlock.blockIdx}`,
      start: firstBlock.start,
      end: secondBlock.end,
      duration,
      status: hasConflict ? "conflict" : "available",
      occupies: 2,
      blockIndexes: [firstBlock.blockIdx, secondBlock.blockIdx],
      primaryBlockIndex: firstBlock.blockIdx,
      nextBlockIndex: secondBlock.blockIdx,
    });
  }

  return slots;
}

function cloneBooking(booking) {
  return booking ? { ...booking } : booking;
}

function syncPA1Expiry(booking) {
  if (!booking) return booking;
  if (booking.status !== "PENDING_PA1" || !booking.expiresAt) return booking;

  if (new Date(booking.expiresAt).getTime() <= Date.now()) {
    booking.status = "CANCELLED";
  }
  return booking;
}

const _bookingStore = {};
let _bookingCounter = 8900;

const FIXED_LOOKUP_APPOINTMENTS = {
  "APT-2025-0001": {
    code: "APT-2025-0001",
    patientPhone: "0901234567",
    patientName: "Nguyễn Văn An",
    specialty: "Nhi khoa",
    doctor: "BS. Nguyễn Thị Sarah",
    date: "2025-03-05",
    slot: "09:00 – 09:25",
    status: "PENDING_PA1",
    expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
  },
  "APT-2025-0002": {
    code: "APT-2025-0002",
    patientPhone: "0912345678",
    patientName: "Trần Thị Bình",
    specialty: "Da liễu",
    doctor: "BS. Trần Ngọc Emily",
    date: "2025-03-05",
    slot: "10:00 – 10:40",
    status: "CONFIRMED",
    expiresAt: null,
  },
  "APT-2025-0003": {
    code: "APT-2025-0003",
    patientPhone: "0934567890",
    patientName: "Lê Minh Châu",
    specialty: "Tai Mũi Họng",
    doctor: "BS. Phạm Quốc Hùng",
    date: "2025-03-04",
    slot: "14:00 – 14:25",
    status: "CANCELLED",
    expiresAt: null,
  },
};

export function getSpecialties() {
  return mockRequest({ data: SPECIALTIES, delayMs: 300 });
}

export function getDoctorsBySpecialty(specialtyId) {
  return mockRequest({ data: DOCTORS[specialtyId] ?? [], delayMs: 300 });
}

export function getSlots(doctorId, date) {
  return mockRequest({ data: generateSlots(doctorId, date), delayMs: 400 });
}

export function createGuestBooking(payload) {
  _bookingCounter += 1;
  const code = `APT-2025-${_bookingCounter}`;
  const booking = {
    code,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    status: "PENDING_PA1",
    qrText: `MEDICARE:${code}:HAICHAU`,
    ...payload,
    createdAt: new Date().toISOString(),
  };
  _bookingStore[code] = booking;
  return mockRequest({ data: cloneBooking(booking), delayMs: 600 });
}

export function getBookingByCode(code) {
  const booking = _bookingStore[code];
  if (!booking) {
    return mockRequest({
      data: null,
      shouldFail: true,
      errorMsg: "Không tìm thấy lịch hẹn.",
    });
  }

  syncPA1Expiry(booking);
  return mockRequest({ data: cloneBooking(booking), delayMs: 300 });
}

export function expirePA1(code) {
  const booking = _bookingStore[code];
  if (!booking) {
    return mockRequest({
      data: null,
      shouldFail: true,
      errorMsg: "Không tìm thấy lịch hẹn.",
    });
  }

  syncPA1Expiry(booking);
  if (booking.status === "PENDING_PA1") {
    booking.status = "CANCELLED";
  }

  return mockRequest({
    data: { code: booking.code, status: booking.status },
    delayMs: 220,
  });
}

export function confirmPA1(code) {
  const booking = _bookingStore[code];
  if (!booking) {
    return mockRequest({
      data: null,
      shouldFail: true,
      errorMsg: "Không tìm thấy lịch hẹn.",
    });
  }

  syncPA1Expiry(booking);
  if (booking.status === "CANCELLED") {
    return mockRequest({
      data: null,
      shouldFail: true,
      errorMsg: "PA1_EXPIRED",
      delayMs: 250,
    });
  }

  booking.status = "CONFIRMED";
  return mockRequest({
    data: { code: booking.code, status: booking.status },
    delayMs: 400,
  });
}

export function lookupAppointment(code, phone) {
  const normalizedCode = code.trim().toUpperCase();
  const normalizedPhone = phone.trim();

  const dynamic = Object.values(_bookingStore).find(
    (booking) =>
      booking.code.toUpperCase() === normalizedCode &&
      booking.patientPhone === normalizedPhone
  );

  if (dynamic) {
    syncPA1Expiry(dynamic);
    return mockRequest({ data: cloneBooking(dynamic), delayMs: 400 });
  }

  const fixed = Object.values(FIXED_LOOKUP_APPOINTMENTS).find(
    (booking) =>
      booking.code.toUpperCase() === normalizedCode &&
      booking.patientPhone === normalizedPhone
  );

  if (fixed) {
    syncPA1Expiry(fixed);
    return mockRequest({ data: cloneBooking(fixed), delayMs: 500 });
  }

  return mockRequest({
    data: null,
    shouldFail: true,
    errorMsg: "NOT_FOUND",
    delayMs: 500,
  });
}
