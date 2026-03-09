// Mock patient data service

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
        avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuBBu457gxLd4hOagPCcYZ9epSpVFQ3Dnm2TAlXH-4Q6qNXaT6IdRjYPWpoBPIFjefe12EQmIILcg1zXicD_OLwJfQDshCjxBWa3HoAeUZJjp074vF4vuA5yWNNmzyvUKTT5MKW-8fweLl91qKHa8Askqrorw3IzyU446-6iRdAD5a04myaETaYQ-k6_6eDrp7DaYm60tnf8dhR1sw1EX8Urfpbk1hVUwaR6a8fdhu3IkN9zGZClIiXKMWcHDAt_DuTLzi9Pce_f4M64",
      },
      location: "Chi nhánh Hải Châu - P.204",
      status: "confirmed", // pending, confirmed, cancelled, completed
      statusLabel: "Đã xác nhận",
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
        avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCaEirNUoZvRTdYIgs27qHbShuKFEqFvh5X8dm2VDPETgZnHgMnwgHb-zmGq5i-yoQa7iCc-9FGqgTHlcIYIgdDSm0_PZGXJ68aGbmUdTkSrmwicKyRbc4dGdMFId6qq-BBxjtzbotrXBdrEusTpeebmMynl_U8fmlz3JYJR8q4HlKZ2Ny92Zf8A12mHPnonQ-vF2y76MiGVkrF-nk-A1txnNqiEfYlgHh0HGQJxdmLNeCPqCiHdpoPoJH3SV7fTjzamum6UUucuf6K",
      },
      location: "Chi nhánh Thanh Khê - P.101",
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
        avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCaEirNUoZvRTdYIgs27qHbShuKFEqFvh5X8dm2VDPETgZnHgMnwgHb-zmGq5i-yoQa7iCc-9FGqgTHlcIYIgdDSm0_PZGXJ68aGbmUdTkSrmwicKyRbc4dGdMFId6qq-BBxjtzbotrXBdrEusTpeebmMynl_U8fmlz3JYJR8q4HlKZ2Ny92Zf8A12mHPnonQ-vF2y76MiGVkrF-nk-A1txnNqiEfYlgHh0HGQJxdmLNeCPqCiHdpoPoJH3SV7fTjzamum6UUucuf6K",
      },
      location: "Chi nhánh Hải Châu - P.204",
      status: "completed",
      statusLabel: "Đã hoàn tất",
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
        name: "BS. Trần Đức B",
        avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuBBu457gxLd4hOagPCcYZ9epSpVFQ3Dnm2TAlXH-4Q6qNXaT6IdRjYPWpoBPIFjefe12EQmIILcg1zXicD_OLwJfQDshCjxBWa3HoAeUZJjp074vF4vuA5yWNNmzyvUKTT5MKW-8fweLl91qKHa8Askqrorw3IzyU446-6iRdAD5a04myaETaYQ-k6_6eDrp7DaYm60tnf8dhR1sw1EX8Urfpbk1hVUwaR6a8fdhu3IkN9zGZClIiXKMWcHDAt_DuTLzi9Pce_f4M64",
      },
      location: "Chi nhánh Hải Châu - P.305",
      status: "cancelled",
      statusLabel: "Đã hủy",
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
}; // will hold user health profile or null

let mockAccountInfo = {
  username: "user123",
  email: "user@example.com",
  name: "Nguyễn Văn A",
};

let mockNotifications = [
  { id: 1, message: "Lịch hẹn của bạn đã được xác nhận.", date: "2024-09-15" },
  { id: 2, message: "Bạn có thông báo mới từ MediCare.", date: "2024-09-20" },
];

const mockRecordDetail = {
  id: "REC-001",
  appointmentCode: "MC-2024-892",
  status: "completed",
  statusLabel: "Đã hoàn tất",
  examDate: "2024-10-15",
  examTime: "09:30",
  location: "MediCare Hải Châu - Phòng khám số 3",
  doctor: {
    name: "BS. Nguyễn Văn A",
    department: "Khoa Nội Tổng Quát",
    branch: "MediCare Hải Châu",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuA671PsZlREDVf_278ekHy8fv5asnqRYsYxQTEZ3GLwpCQeSTRUr6d2tIxaEBHUgrx6TNROnjGUarkAfvke6HD_izG0pSQQTOaNq7u-1a6NS7Pv-G4L5grYzqOsMdLxlasUDlkNZbiVH6i8LCOQBWdGoZgWvb6r-5VK5EMZ_G9bSEWy2__8TUFnQozeSW2OUhNKECx9P5AW99xbrmsyStKB6WhQqm2zGGWmhLbKIDzGgEveBQvxMrz-s2toLgOTwxM76H_Pc3ZMtamm",
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
      label: "Đã xác nhận",
      icon: "check_circle",
      dateTime: "10 Tháng 1, 10:30 SA",
      isCompleted: true,
    },
    {
      status: "checkin",
      label: "Đã check-in",
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

export const appointmentApi = {
  getAppointments: (tab = "upcoming") => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockAppointments[tab] || []);
      }, 300);
    });
  },

  getRecordDetail: (id) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockRecordDetail);
      }, 300);
    });
  },

  // health profile endpoints
  getHealthProfile: () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // mock may return null if empty
        resolve(mockHealthProfile);
      }, 300);
    });
  },

  updateHealthProfile: (payload) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // pretend save and return updated
        mockHealthProfile = { ...payload };
        resolve(mockHealthProfile);
      }, 300);
    });
  },

  // account & notifications skeleton
  getAccountInfo: () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockAccountInfo);
      }, 300);
    });
  },
  changePassword: (payload) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true });
      }, 300);
    });
  },
  getNotifications: () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockNotifications);
      }, 300);
    });
  },
};
