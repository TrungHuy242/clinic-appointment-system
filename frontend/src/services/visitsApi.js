import { mockRequest } from "./http";

const VISIT_QUEUE = [
    { code: "APT-2025-8834", patientName: "Trần Thị Bình", slot: "08:00", status: "waiting" },
    { code: "APT-2025-8835", patientName: "Lê Thành Nam", slot: "08:25", status: "in_progress" },
    { code: "APT-2025-8836", patientName: "Phạm Hồng Nhung", slot: "09:00", status: "waiting" },
];

const VISIT_DETAILS = {
    "APT-2025-8834": {
        code: "APT-2025-8834",
        patientName: "Trần Thị Bình",
        dob: "1990-05-20",
        gender: "Nữ",
        phone: "0912345678",
        specialty: "Da liễu",
        slot: "08:00 – 08:40",
        chiefComplaint: "Ngứa da, nổi mẩn đỏ ở cánh tay khoảng 3 ngày.",
        history: [
            { date: "2024-11-10", diagnosis: "Viêm da tiếp xúc", doctor: "BS. Trần Ngọc Emily" },
            { date: "2024-07-22", diagnosis: "Nấm da", doctor: "BS. Trần Ngọc Emily" },
        ],
        draft: null,
    },
    "APT-2025-8835": {
        code: "APT-2025-8835",
        patientName: "Lê Thành Nam",
        dob: "1985-12-01",
        gender: "Nam",
        phone: "0901111111",
        specialty: "Nhi khoa",
        slot: "08:25 – 08:50",
        chiefComplaint: "Sốt 38.5°C, ho, sổ mũi 2 ngày.",
        history: [],
        draft: null,
    },
};

const _drafts = {};

export function getVisitQueue() {
    return mockRequest({ data: VISIT_QUEUE, delayMs: 300 });
}

export function getVisitDetail(code) {
    const detail = VISIT_DETAILS[code] ?? {
        code,
        patientName: "Bệnh nhân " + code,
        dob: "N/A",
        gender: "N/A",
        phone: "N/A",
        specialty: "N/A",
        slot: "N/A",
        chiefComplaint: "",
        history: [],
        draft: null,
    };
    if (_drafts[code]) detail.draft = _drafts[code];
    return mockRequest({ data: detail, delayMs: 350 });
}

export function saveDraft(code, data) {
    _drafts[code] = { ...data, savedAt: new Date().toISOString() };
    return mockRequest({ data: { ok: true }, delayMs: 400 });
}

export function completeVisit(code, data) {
    _drafts[code] = { ...data, completed: true, completedAt: new Date().toISOString() };
    const idx = VISIT_QUEUE.findIndex((q) => q.code === code);
    if (idx !== -1) VISIT_QUEUE[idx].status = "done";
    return mockRequest({ data: { ok: true, code }, delayMs: 600 });
}
