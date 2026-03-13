import { repairMojibakeDeep, repairMojibakeText } from "../../../shared/utils/text";

// Mock patient data service

function clone(data) {
  if (data === null || data === undefined) return data;
  return repairMojibakeDeep(JSON.parse(JSON.stringify(data)));
}

function resolveLater(data, delayMs = 300) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(clone(data)), delayMs);
  });
}

function rejectLater(errorMsg, delayMs = 300) {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(repairMojibakeText(errorMsg))), delayMs);
  });
}

function normalizeText(value = "") {
  return repairMojibakeText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}
const mockAppointments = {
  upcoming: [
    {
      id: "APT-892",
      code: "MC-2024-892",
      date: "2024-10-24",
      day: "Thứ Năm",
      timeStart: "09:30",
      timeEnd: "10:00",
      service: "Tái khám Nhi khoa",
      doctor: {
        name: "BS. Nguyễn Thị Sarah",
        avatar:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuBBu457gxLd4hOagPCcYZ9epSpVFQ3Dnm2TAlXH-4Q6qNXaT6IdRjYPWpoBPIFjefe12EQmIILcg1zXicD_OLwJfQDshCjxBWa3HoAeUZJjp074vF4vuA5yWNNmzyvUKTT5MKW-8fweLl91qKHa8Askqrorw3IzyU446-6iRdAD5a04myaETaYQ-k6_6eDrp7DaYm60tnf8dhR1sw1EX8Urfpbk1hVUwaR6a8fdhu3IkN9zGZClIiXKMWcHDAt_DuTLzi9Pce_f4M64",
      },
      location: "Cơ sở Hải Châu - P.204",
      status: "confirmed",
      statusLabel: "Äã xác nhận",
    },
    {
      id: "APT-905",
      code: "MC-2024-905",
      date: "2024-11-02",
      day: "Thứ Bảy",
      timeStart: "14:00",
      timeEnd: "14:30",
      service: "Khám tổng quát Da liễu",
      doctor: {
        name: "BS. Nguyễn Văn A",
        avatar:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuCaEirNUoZvRTdYIgs27qHbShuKFEqFvh5X8dm2VDPETgZnHgMnwgHb-zmGq5i-yoQa7iCc-9FGqgTHlcIYIgdDSm0_PZGXJ68aGbmUdTkSrmwicKyRbc4dGdMFId6qq-BBxjtzbotrXBdrEusTpeebmMynl_U8fmlz3JYJR8q4HlKZ2Ny92Zf8A12mHPnonQ-vF2y76MiGVkrF-nk-A1txnNqiEfYlgHh0HGQJxdmLNeCPqCiHdpoPoJH3SV7fTjzamum6UUucuf6K",
      },
      location: "Cơ sở Hải Châu - P.101",
      status: "pending",
      statusLabel: "Chờ xác nhận",
    },
  ],
  history: [
    {
      id: "APT-552",
      code: "MC-2023-552",
      date: "2023-12-15",
      day: "Thứ Năm",
      timeStart: "10:00",
      timeEnd: "10:30",
      service: "Khám tổng quát",
      doctor: {
        name: "BS. Nguyễn Văn A",
        avatar:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuCaEirNUoZvRTdYIgs27qHbShuKFEqFvh5X8dm2VDPETgZnHgMnwgHb-zmGq5i-yoQa7iCc-9FGqgTHlcIYIgdDSm0_PZGXJ68aGbmUdTkSrmwicKyRbc4dGdMFId6qq-BBxjtzbotrXBdrEusTpeebmMynl_U8fmlz3JYJR8q4HlKZ2Ny92Zf8A12mHPnonQ-vF2y76MiGVkrF-nk-A1txnNqiEfYlgHh0HGQJxdmLNeCPqCiHdpoPoJH3SV7fTjzamum6UUucuf6K",
      },
      location: "Cơ sở Hải Châu - P.204",
      status: "completed",
      statusLabel: "Äã hoàn tất",
    },
  ],
  cancelled: [
    {
      id: "APT-891",
      code: "MC-2024-891",
      date: "2024-10-10",
      day: "Thứ Tư",
      timeStart: "15:00",
      timeEnd: "15:30",
      service: "Khám tim mạch",
      doctor: {
        name: "BS. Trần Äức B",
        avatar:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuBBu457gxLd4hOagPCcYZ9epSpVFQ3Dnm2TAlXH-4Q6qNXaT6IdRjYPWpoBPIFjefe12EQmIILcg1zXicD_OLwJfQDshCjxBWa3HoAeUZJjp074vF4vuA5yWNNmzyvUKTT5MKW-8fweLl91qKHa8Askqrorw3IzyU446-6iRdAD5a04myaETaYQ-k6_6eDrp7DaYm60tnf8dhR1sw1EX8Urfpbk1hVUwaR6a8fdhu3IkN9zGZClIiXKMWcHDAt_DuTLzi9Pce_f4M64",
      },
      location: "Cơ sở Hải Châu - P.305",
      status: "cancelled",
      statusLabel: "Äã hủy",
    },
  ],
};

let mockHealthProfile = {
  name: "Nguyễn Văn A",
  phone: "0909123456",
  dob: "1990-05-20",
  gender: "male",
  allergies: "Penicillin",
  notes: "Không có ghi chú đặc biệt.",
  emergency: {
    name: "Nguyễn Thị B",
    phone: "0909876543",
  },
};

let mockAccountInfo = {
  username: "user123",
  email: "user@example.com",
  name: "Nguyễn Văn A",
};

let mockNotifications = [
  { id: 1, message: "Lịch hẹn của bạn đã được xác nhận.", date: "2024-09-15" },
  { id: 2, message: "Bạn có thông báo mới từ MediCare.", date: "2024-09-20" },
];

const baseRecordDetail = {
  id: "REC-001",
  appointmentCode: "MC-2024-892",
  status: "completed",
  statusLabel: "Äã hoàn tất",
  examDate: "2024-10-15",
  examTime: "09:30",
  location: "Cơ sở Hải Châu - Phòng khám số 3",
  doctor: {
    name: "BS. Nguyễn Văn A",
    department: "Khoa Nội Tổng Quát",
    branch: "Cơ sở Hải Châu",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuA671PsZlREDVf_278ekHy8fv5asnqRYsYxQTEZ3GLwpCQeSTRUr6d2tIxaEBHUgrx6TNROnjGUarkAfvke6HD_izG0pSQQTOaNq7u-1a6NS7Pv-G4L5grYzqOsMdLxlasUDlkNZbiVH6i8LCOQBWdGoZgWvb6r-5VK5EMZ_G9bSEWy2__8TUFnQozeSW2OUhNKECx9P5AW99xbrmsyStKB6WhQqm2zGGWmhLbKIDzGgEveBQvxMrz-s2toLgOTwxM76H_Pc3ZMtamm",
  },
  timeline: [
    {
      status: "scheduled",
      label: "Chờ xác nhận",
      icon: "schedule",
      dateTime: "10 Tháng 1, 09:00 SA",
      isCompleted: true,
    },
    {
      status: "confirmed",
      label: "Äã xác nhận",
      icon: "check_circle",
      dateTime: "10 Tháng 1, 10:30 SA",
      isCompleted: true,
    },
    {
      status: "checkin",
      label: "Äã check-in",
      icon: "where_to_vote",
      dateTime: "15 Tháng 1, 08:45 SA",
      isCompleted: true,
    },
    {
      status: "completed",
      label: "Hoàn thành",
      icon: "assignment_turned_in",
      dateTime: "15 Tháng 1, 09:30 SA",
      isCompleted: true,
    },
  ],
  diagnosis: {
    name: "Viêm phế quản cấp tính kèm khò khè nhẹ",
    icdCode: "J20.9",
  },
  clinicalNotes:
    "Bệnh nhân có biểu hiện ho dai dẳng kéo dài 5 ngày, kèm theo khó chịu nhẹ ở ngực. Không sốt trong 24 giờ qua. Nghe phổi có tiếng rít nhẹ ở vùng phổi trái dưới.\n\nKhuyến nghị nghỉ ngơi và uống nhiều nước. Bệnh nhân được khuyên theo dõi nhiệt độ hàng ngày và quay lại nếu các triệu chứng trở nên tồi tệ hơn hoặc sốt trên 38,5°C.",
  medicines: [
    {
      id: 1,
      name: "Paracetamol",
      dosage: "500mg",
      duration: "7 ngày",
      usage: "Uống 1 viên, mỗi ngày 2-3 lần",
    },
    {
      id: 2,
      name: "Ambroxol",
      dosage: "30mg",
      duration: "5 ngày",
      usage: "Uống 1 viên, mỗi ngày 3 lần",
    },
    {
      id: 3,
      name: "Vitamin C",
      dosage: "1000mg",
      duration: "14 ngày",
      usage: "Uống 1 viên, mỗi ngày 1 lần",
    },
  ],
};

let mockRecordDetails = {
  [baseRecordDetail.id]: clone(baseRecordDetail),
};

const CLAIMABLE_PROFILES = [
  {
    patientName: "Trần Thị Bình",
    healthProfile: {
      name: "Trần Thị Bình",
      phone: "0912345678",
      dob: "1985-06-15",
      gender: "female",
      allergies: "Dị ứng nhẹ với hải sản",
      notes: "Äã khám da liễu định kỳ tại Cơ sở Hải Châu.",
      emergency: {
        name: "Trần Văn Minh",
        phone: "0912000111",
      },
    },
    appointments: {
      upcoming: [
        {
          id: "CLM-APT-1001",
          code: "APT-2026-1001",
          date: "2026-03-18",
          day: "Thứ Tư",
          timeStart: "08:30",
          timeEnd: "08:55",
          service: "Tái khám Da liễu",
          doctor: {
            name: "BS. Trần Ngọc Emily",
            avatar:
              "https://lh3.googleusercontent.com/aida-public/AB6AXuBBu457gxLd4hOagPCcYZ9epSpVFQ3Dnm2TAlXH-4Q6qNXaT6IdRjYPWpoBPIFjefe12EQmIILcg1zXicD_OLwJfQDshCjxBWa3HoAeUZJjp074vF4vuA5yWNNmzyvUKTT5MKW-8fweLl91qKHa8Askqrorw3IzyU446-6iRdAD5a04myaETaYQ-k6_6eDrp7DaYm60tnf8dhR1sw1EX8Urfpbk1hVUwaR6a8fdhu3IkN9zGZClIiXKMWcHDAt_DuTLzi9Pce_f4M64",
          },
          location: "Cơ sở Hải Châu - P.204",
          status: "confirmed",
          statusLabel: "Äã xác nhận",
        },
      ],
      history: [
        {
          id: "CLM-APT-0940",
          code: "APT-2026-0940",
          date: "2026-02-26",
          day: "Thứ Năm",
          timeStart: "09:10",
          timeEnd: "09:35",
          service: "Khám Da liễu",
          doctor: {
            name: "BS. Trần Ngọc Emily",
            avatar:
              "https://lh3.googleusercontent.com/aida-public/AB6AXuBBu457gxLd4hOagPCcYZ9epSpVFQ3Dnm2TAlXH-4Q6qNXaT6IdRjYPWpoBPIFjefe12EQmIILcg1zXicD_OLwJfQDshCjxBWa3HoAeUZJjp074vF4vuA5yWNNmzyvUKTT5MKW-8fweLl91qKHa8Askqrorw3IzyU446-6iRdAD5a04myaETaYQ-k6_6eDrp7DaYm60tnf8dhR1sw1EX8Urfpbk1hVUwaR6a8fdhu3IkN9zGZClIiXKMWcHDAt_DuTLzi9Pce_f4M64",
          },
          location: "Cơ sở Hải Châu - P.204",
          status: "completed",
          statusLabel: "Äã hoàn tất",
        },
      ],
      cancelled: [],
    },
    records: [
      {
        id: "REC-CLM-0940",
        appointmentCode: "APT-2026-0940",
        status: "completed",
        statusLabel: "Äã hoàn tất",
        examDate: "2026-02-26",
        examTime: "09:10",
        location: "Cơ sở Hải Châu - Phòng khám số 4",
        doctor: {
          name: "BS. Trần Ngọc Emily",
          department: "Khoa Da liễu",
          branch: "Cơ sở Hải Châu",
          avatar:
            "https://lh3.googleusercontent.com/aida-public/AB6AXuBBu457gxLd4hOagPCcYZ9epSpVFQ3Dnm2TAlXH-4Q6qNXaT6IdRjYPWpoBPIFjefe12EQmIILcg1zXicD_OLwJfQDshCjxBWa3HoAeUZJjp074vF4vuA5yWNNmzyvUKTT5MKW-8fweLl91qKHa8Askqrorw3IzyU446-6iRdAD5a04myaETaYQ-k6_6eDrp7DaYm60tnf8dhR1sw1EX8Urfpbk1hVUwaR6a8fdhu3IkN9zGZClIiXKMWcHDAt_DuTLzi9Pce_f4M64",
        },
        timeline: [
          {
            status: "scheduled",
            label: "Chờ xác nhận",
            icon: "schedule",
            dateTime: "25 Tháng 2, 04:00 CH",
            isCompleted: true,
          },
          {
            status: "confirmed",
            label: "Äã xác nhận",
            icon: "check_circle",
            dateTime: "25 Tháng 2, 04:10 CH",
            isCompleted: true,
          },
          {
            status: "checkin",
            label: "Äã check-in",
            icon: "where_to_vote",
            dateTime: "26 Tháng 2, 08:55 SA",
            isCompleted: true,
          },
          {
            status: "completed",
            label: "Hoàn thành",
            icon: "assignment_turned_in",
            dateTime: "26 Tháng 2, 09:40 SA",
            isCompleted: true,
          },
        ],
        diagnosis: {
          name: "Viêm da tiếp xúc dị ứng",
          icdCode: "L23.9",
        },
        clinicalNotes:
          "Vùng da cẳng tay đỏ và ngứa kéo dài 4 ngày. Không ghi nhận nhiễm trùng thứ phát. Bệnh nhân được hướng dẫn tránh tác nhân kích ứng và tái khám sau 3 tuần.",
        medicines: [
          {
            id: 1,
            name: "Cetirizine",
            dosage: "10mg",
            duration: "7 ngày",
            usage: "Uống 1 viên vào buổi tối",
          },
          {
            id: 2,
            name: "Kem Hydrocortisone",
            dosage: "1%",
            duration: "5 ngày",
            usage: "Bôi lớp mỏng 2 lần/ngày",
          },
        ],
      },
    ],
  },
  {
    patientName: "Nguyễn Văn An",
    healthProfile: {
      name: "Nguyễn Văn An",
      phone: "0901234567",
      dob: "1990-01-01",
      gender: "male",
      allergies: "Không ghi nhận",
      notes: "Đã từng khám tổng quát và nội soi tai mũi họng.",
      emergency: {
        name: "Nguyễn Thị Hồng",
        phone: "0901000222",
      },
    },
    appointments: {
      upcoming: [
        {
          id: "CLM-APT-1015",
          code: "APT-2026-1015",
          date: "2026-03-21",
          day: "Thứ Bảy",
          timeStart: "10:00",
          timeEnd: "10:25",
          service: "Tái khám Tai Mũi Họng",
          doctor: {
            name: "BS. Phạm Quốc Hùng",
            avatar:
              "https://lh3.googleusercontent.com/aida-public/AB6AXuCaEirNUoZvRTdYIgs27qHbShuKFEqFvh5X8dm2VDPETgZnHgMnwgHb-zmGq5i-yoQa7iCc-9FGqgTHlcIYIgdDSm0_PZGXJ68aGbmUdTkSrmwicKyRbc4dGdMFId6qq-BBxjtzbotrXBdrEusTpeebmMynl_U8fmlz3JYJR8q4HlKZ2Ny92Zf8A12mHPnonQ-vF2y76MiGVkrF-nk-A1txnNqiEfYlgHh0HGQJxdmLNeCPqCiHdpoPoJH3SV7fTjzamum6UUucuf6K",
          },
          location: "Cơ sở Hải Châu - P.305",
          status: "confirmed",
          statusLabel: "Äã xác nhận",
        },
      ],
      history: [
        {
          id: "CLM-APT-0981",
          code: "APT-2026-0981",
          date: "2026-02-11",
          day: "Thứ Tư",
          timeStart: "15:20",
          timeEnd: "15:45",
          service: "Khám Tai Mũi Họng",
          doctor: {
            name: "BS. Phạm Quốc Hùng",
            avatar:
              "https://lh3.googleusercontent.com/aida-public/AB6AXuCaEirNUoZvRTdYIgs27qHbShuKFEqFvh5X8dm2VDPETgZnHgMnwgHb-zmGq5i-yoQa7iCc-9FGqgTHlcIYIgdDSm0_PZGXJ68aGbmUdTkSrmwicKyRbc4dGdMFId6qq-BBxjtzbotrXBdrEusTpeebmMynl_U8fmlz3JYJR8q4HlKZ2Ny92Zf8A12mHPnonQ-vF2y76MiGVkrF-nk-A1txnNqiEfYlgHh0HGQJxdmLNeCPqCiHdpoPoJH3SV7fTjzamum6UUucuf6K",
          },
          location: "Cơ sở Hải Châu - P.305",
          status: "completed",
          statusLabel: "Äã hoàn tất",
        },
      ],
      cancelled: [],
    },
    records: [
      {
        id: "REC-CLM-0981",
        appointmentCode: "APT-2026-0981",
        status: "completed",
        statusLabel: "Äã hoàn tất",
        examDate: "2026-02-11",
        examTime: "15:20",
        location: "Cơ sở Hải Châu - Phòng khám số 5",
        doctor: {
          name: "BS. Phạm Quốc Hùng",
          department: "Khoa Tai Mũi Họng",
          branch: "Cơ sở Hải Châu",
          avatar:
            "https://lh3.googleusercontent.com/aida-public/AB6AXuCaEirNUoZvRTdYIgs27qHbShuKFEqFvh5X8dm2VDPETgZnHgMnwgHb-zmGq5i-yoQa7iCc-9FGqgTHlcIYIgdDSm0_PZGXJ68aGbmUdTkSrmwicKyRbc4dGdMFId6qq-BBxjtzbotrXBdrEusTpeebmMynl_U8fmlz3JYJR8q4HlKZ2Ny92Zf8A12mHPnonQ-vF2y76MiGVkrF-nk-A1txnNqiEfYlgHh0HGQJxdmLNeCPqCiHdpoPoJH3SV7fTjzamum6UUucuf6K",
        },
        timeline: [
          {
            status: "scheduled",
            label: "Chờ xác nhận",
            icon: "schedule",
            dateTime: "10 Tháng 2, 08:15 SA",
            isCompleted: true,
          },
          {
            status: "confirmed",
            label: "Äã xác nhận",
            icon: "check_circle",
            dateTime: "10 Tháng 2, 08:20 SA",
            isCompleted: true,
          },
          {
            status: "checkin",
            label: "Äã check-in",
            icon: "where_to_vote",
            dateTime: "11 Tháng 2, 03:10 CH",
            isCompleted: true,
          },
          {
            status: "completed",
            label: "Hoàn thành",
            icon: "assignment_turned_in",
            dateTime: "11 Tháng 2, 03:50 CH",
            isCompleted: true,
          },
        ],
        diagnosis: {
          name: "Viêm họng cấp",
          icdCode: "J02.9",
        },
        clinicalNotes:
          "Niêm mạc họng đỏ, đau tăng khi nuốt, không ghi nhận biến chứng. Đã kê thuốc giảm viêm và hướng dẫn tái khám nếu sốt kéo dài.",
        medicines: [
          {
            id: 1,
            name: "Alpha Choay",
            dosage: "4200 IU",
            duration: "5 ngày",
            usage: "Uống 2 viên/lần, ngày 3 lần",
          },
          {
            id: 2,
            name: "Paracetamol",
            dosage: "500mg",
            duration: "3 ngày",
            usage: "Uống khi sốt trên 38.5°C",
          },
        ],
      },
    ],
  },
];

function getClaimCodes(profile) {
  return ["upcoming", "history", "cancelled"].flatMap((tab) =>
    (profile.appointments[tab] || []).map((appointment) => appointment.code.toUpperCase())
  );
}

function pushNotification(message) {
  const nextId =
    mockNotifications.reduce((max, notification) => Math.max(max, notification.id), 0) + 1;

  mockNotifications = [
    {
      id: nextId,
      message,
      date: new Date().toISOString().slice(0, 10),
    },
    ...mockNotifications,
  ];
}

function upsertAppointment(tab, appointment) {
  const bucket = mockAppointments[tab] || [];
  const exists = bucket.some((item) => item.code === appointment.code);

  if (!exists) {
    mockAppointments[tab] = [clone(appointment), ...bucket];
    return 1;
  }

  return 0;
}

function upsertRecord(record) {
  const exists = Boolean(mockRecordDetails[record.id]);
  mockRecordDetails[record.id] = clone(record);
  return exists ? 0 : 1;
}

function attachClaimedProfile(profile) {
  let linkedAppointments = 0;
  let linkedRecords = 0;

  ["upcoming", "history", "cancelled"].forEach((tab) => {
    (profile.appointments[tab] || []).forEach((appointment) => {
      linkedAppointments += upsertAppointment(tab, appointment);
    });
  });

  (profile.records || []).forEach((record) => {
    linkedRecords += upsertRecord(record);
  });

  mockAccountInfo = {
    ...mockAccountInfo,
    name: profile.patientName,
  };

  mockHealthProfile = {
    ...(mockHealthProfile || {}),
    ...clone(profile.healthProfile),
  };

  if (linkedAppointments > 0 || linkedRecords > 0) {
    pushNotification(
      `Äã liên kết hồ sơ ${profile.patientName} với ${linkedAppointments} lịch hẹn và ${linkedRecords} hồ sơ khám.`
    );
  }

  return {
    linkedAppointments,
    linkedRecords,
    alreadyClaimed: linkedAppointments === 0 && linkedRecords === 0,
  };
}

export const appointmentApi = {
  getAppointments: (tab = "upcoming") => {
    return resolveLater(mockAppointments[tab] || []);
  },

  getRecordDetail: (id) => {
    const record =
      mockRecordDetails[id] ||
      Object.values(mockRecordDetails).find((item) => item.appointmentCode === id) ||
      Object.values(mockRecordDetails)[0] ||
      null;

    return resolveLater(record);
  },

  claimProfile: (appointmentCode, fullName) => {
    const normalizedCode = appointmentCode.trim().toUpperCase();
    const profile = CLAIMABLE_PROFILES.find((item) =>
      getClaimCodes(item).includes(normalizedCode)
    );

    if (!profile) {
      return rejectLater("CLAIM_NOT_FOUND", 350);
    }

    if (normalizeText(profile.patientName) !== normalizeText(fullName)) {
      return rejectLater("CLAIM_NAME_MISMATCH", 350);
    }

    const result = attachClaimedProfile(profile);
    return resolveLater(
      {
        patientName: profile.patientName,
        appointmentCode: normalizedCode,
        linkedAppointments: result.linkedAppointments,
        linkedRecords: result.linkedRecords,
        alreadyClaimed: result.alreadyClaimed,
      },
      350
    );
  },

  getHealthProfile: () => {
    return resolveLater(mockHealthProfile);
  },

  updateHealthProfile: (payload) => {
    mockHealthProfile = { ...payload };
    return resolveLater(mockHealthProfile);
  },

  getAccountInfo: () => {
    return resolveLater(mockAccountInfo);
  },

  changePassword: () => {
    return resolveLater({ success: true });
  },

  getNotifications: () => {
    return resolveLater(mockNotifications);
  },
};
