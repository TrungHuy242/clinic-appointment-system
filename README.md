# Hệ thống quản lý đặt lịch khám bệnh cho phòng khám (Clinic Appointment System)

## 1. Thông tin chung
- **Môn học:** Công nghệ phần mềm
- **Nhóm:** Người Nùng
- **Thành viên nhóm:**
  - Trương Minh Trung Huy (SM)
  - Trương Đình Bắc (PO)
  - Trương Thị Kim Ngân (Dev)
  - Từ Nguyễn Huyền Trang (Dev)
  - Nguyễn Ngọc Quyền (Dev)
- **Repository:** https://github.com/TrungHuy242/clinic-appointment-system
- **Stack:** React (react-scripts) + Django REST Framework + SQLite (dev) / PostgreSQL (prod)
- **Trạng thái:** Đã hoàn thành — 35/35 E2E tests PASS, sẵn sàng demo

---

## 2. Cách chạy project

### Yêu cầu
- Python 3.10+
- Node.js 18+
- npm

### Backend

```bash
cd backend

# Tạo virtual environment (khuyến nghị)
python -m venv venv
.\venv\Scripts\activate   # Windows
# source venv/bin/activate  # Linux/Mac

# Cài đặt dependencies
pip install -r requirements.txt

# Chạy migrations (SQLite mặc định)
python manage.py migrate

# Seed demo data (tùy chọn)
python manage.py seed_demo_data

# Chạy server
python manage.py runserver 8000
```

> **Lưu ý:** Backend chạy tại `http://localhost:8000`. File `.env` chứa secrets (không commit). Copy `.env.example` → `.env` và điền credentials khi dùng PostgreSQL.

### Frontend

```bash
cd frontend

# Cài đặt dependencies
npm install

# Chạy dev server
npm start
```

> **Lưu ý:** Frontend chạy tại `http://localhost:3000` và proxy API sang backend `localhost:8000`.
> File `.env` chứa `VITE_API_BASE_URL=` (trống = dùng proxy, mặc định dev).

### Chạy E2E tests

```bash
cd backend
python test_all_flows.py
```

---

## 3. Tài khoản demo

| Username / SĐT | Password | Vai trò | Ghi chú |
|---|---|---|---|
| `admin` | `admin123` | Admin | Quản lý toàn bộ hệ thống |
| `reception` | `reception123` | Receptionist | Tiếp nhận, check-in bệnh nhân |
| `doctor1` | `doctor123` | Doctor | BS. Nguyễn Thị Sarah — Nhi khoa |
| `doctor2` | `doctor123` | Doctor | BS. Trần Ngọc Emily — Da liễu |
| `doctor3` | `doctor123` | Doctor | BS. Phạm Quốc Hùng — Tai Mũi Họng |
| `doctor4` | `doctor123` | Doctor | BS. Lê Minh Khoa — Khám tổng quát |
| `doctor5` | `doctor123` | Doctor | BS. Hoàng Thu Hà — Nhi khoa |
| `doctor6` | `doctor123` | Doctor | BS. Vũ Ngọc Mai — Da liễu |
| `0912345678` | `huy0610` | Patient | Trần Thị Bình |

---

## 4. Flow demo đề xuất

### Admin — `admin / admin123`
1. Đăng nhập → Dashboard → KPI cards (tổng lịch hẹn, bệnh nhân mới, tỷ lệ hoàn tất)
2. Biểu đồ: phân bổ theo chuyên khoa, lịch hẹn theo kỳ
3. Catalog → Bác sĩ (xem / sửa) → Lễ tân (xem / sửa / tạo)
4. Appointments → Danh sách lịch hẹn (30 items) → Filter theo ngày / trạng thái
5. Reports → Export CSV báo cáo
6. Audit → Xem lịch sử thao tác nhân viên

### Receptionist — `reception / reception123`
1. Đăng nhập → Dashboard → Stats + 8 lịch hẹn sắp tới trong ngày
2. Appointments → Danh sách → Check-in bằng mã `APT-2026-1702`
3. Check-in page → Confirm → Bệnh nhân chuyển sang trạng thái `CHECKED_IN`
4. Patients → Xem hồ sơ bệnh nhân
5. Profile → Đổi thông tin cá nhân

### Doctor — `doctor2 / doctor123` (BS. Emily — Da liễu)
1. Đăng nhập → Queue → Bệnh nhân đang chờ khám
2. Chọn bệnh nhân → Visit page → Bấm "Bắt đầu khám" → Nhập chẩn đoán → Hoàn tất
3. Visits → Phiếu khám đã hoàn tất
4. Schedule → Lịch làm việc theo ngày
5. Profile → Đổi thông tin bio

### Patient — `0912345678 / huy0610`
1. Đăng nhập bằng SĐT → Redirect đến Patient Portal
2. My Appointments → Lịch hẹn sắp tới (tạo mới qua booking wizard nếu cần)
3. Health Profile → Thông tin sức khỏe, dị ứng
4. Notifications → Tin nhắn xác nhận lịch hẹn
5. Refresh page → Session vẫn giữ (đã xác minh 35/35 tests PASS)

### Guest Booking (không cần đăng nhập)
1. Landing page → "Đặt lịch khám ngay" → Booking Wizard
2. Chọn chuyên khoa → Chọn bác sĩ → Chọn ngày + slot → Nhập thông tin
3. Booking success → Nhận mã lịch hẹn + QR code
4. Tra cứu lịch hẹn: `/lookup` → Nhập mã + SĐT

---

## 5. Giới hạn hiện tại & Hướng phát triển

### Giới hạn (đã biết)

| Giới hạn | Mức độ | Ghi chú |
|---|---|---|
| Landing page: Doctor Cards là mock data | **Thấp** | Không kết nối DB; thay bằng API khi cần |
| Landing page: Stats là mock data | **Thấp** | Ghi rõ "Demo — giá trị giả lập" |
| Reports: Revenue/Doanh thu là ước tính | **Trung bình** | Ghi rõ "Lượt khám hoàn tất ước tính" — chưa có bảng Billing |
| Patient: Chưa có lịch hẹn trong seed data | **Thấp** | Tạo qua booking wizard để test |
| Patient: Record detail cần có MedicalRecord hợp lệ | **Thấp** | Seed có 6 MedicalRecord gán cho bệnh nhân khác |
| Doctor queue/visits: Phụ thuộc seed data | **Thấp** | Seed có đủ dữ liệu CHECKED_IN và COMPLETED |

### Hướng phát triển (production)

| Ưu tiên | Tính năng |
|---|---|
| Cao | Thêm bảng Billing/Payment để track doanh thu thực |
| Cao | Thêm xác thực email/SMS cho patient registration |
| Trung bình | Gửi email/SMS notification khi có thay đổi lịch hẹn |
| Trung bình | Xem lịch bác sĩ theo tuần (calendar view) |
| Trung bình | Đổi mật khẩu cho patient account |
| Thấp | Giao diện mobile responsive đầy đủ |
| Thấp | Export PDF phiếu khám / đơn thuốc |

---

## 6. Môi trường & Database

| Thành phần | Trạng thái |
|---|---|
| Database | **SQLite** (`db.sqlite3`) mặc định dev; hỗ trợ PostgreSQL |
| `.env` backend | Chứa secrets, không commit |
| `.env` frontend | Chứa `VITE_API_BASE_URL`, đã có `.env.example` |
| Migrations | Tất cả applied, 0 unapplied |
| Test suite | **35/35 E2E tests PASS** (`backend/test_all_flows.py`) |

---

## 7. Cấu trúc project

```
clinic-appointment-system/
├── backend/
│   ├── appointments/      # Models, services, views cho lịch hẹn
│   ├── catalog/           # Models, services, views cho chuyên khoa, bác sĩ
│   ├── common/           # Auth, permissions, response helpers
│   ├── config/           # Django settings, URLs
│   ├── portal/           # Auth, patient, doctor, receptionist, admin APIs
│   ├── manage.py
│   ├── test_all_flows.py # E2E test suite
│   └── db.sqlite3        # SQLite dev DB
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── public/        # Landing, Login, Register, Booking
│   │   │   ├── patient/       # MyAppointments, HealthProfile, Notifications
│   │   │   ├── doctor/        # Schedule, Queue, Visits, VisitPage
│   │   │   ├── reception/     # Dashboard, Checkin, Patients
│   │   │   └── admin/         # Dashboard, Catalog, Reports, Audit
│   │   ├── layouts/           # PublicLayout, PatientLayout, StaffLayout, AdminLayout
│   │   ├── services/          # apiClient, authService, endpoints, bookingApi
│   │   └── router.jsx        # React Router definitions
│   ├── .env                   # API config
│   └── package.json
└── docs/
    └── PROGRESS.md             # Chi tiết bugs, test results, data sources
```

---

## 8. Ghi chú kỹ thuật

### Authentication
- Hệ thống dùng **Django session-based auth** qua `SessionUserAuthentication`.
- Staff (admin/reception/doctor): login set `SESSION_USER_KEY` vào Django session.
- Patient: login set cả `SESSION_USER_KEY` và `patient_profile_id`.
- Frontend lưu user info vào `localStorage` để `AuthContext` render đúng UI.

### API Proxy
- Frontend dùng `setupProxy.js` (http-proxy-middleware) để proxy API calls sang backend.
- `apiClient.js` xử lý base URL: nếu `VITE_API_BASE_URL` trống → dùng `window.location.origin` → proxy handle.
- Production: đặt `VITE_API_BASE_URL=http://localhost:8000` để gọi trực tiếp.

### Session & CORS
- `credentials: "include"` trong mọi fetch call → gửi session cookie.
- Django `CORS_ALLOW_ALL_ORIGINS = True` và `CSRF_COOKIE_SAMESITE = None` cho dev.

### Encoding
- Tất cả file chứa tiếng Việt: UTF-8.
- Backend settings: `DEFAULT_CHARSET = 'utf-8'`.
- Windows console: output encoding có thể gây lỗi `charmap codec can't encode` — dùng `sys.stdout.reconfigure(encoding='utf-8')` khi cần.
