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
- **Stack:** React 18 (react-scripts) + Django 5.0 REST Framework + PostgreSQL
- **Trạng thái:** Hoàn thành — Docker-ready, 200+ backend tests PASS, sẵn sàng demo

---

## 2. Chạy project với Docker (Khuyến nghị)

### Yêu cầu
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows/Mac) hoặc Docker Engine (Linux)
- [Docker Compose](https://docs.docker.com/compose/install/) (đã có sẵn trong Docker Desktop)

### Chạy nhanh (1 lệnh)

```bash
# Clone repo
git clone https://github.com/TrungHuy242/clinic-appointment-system.git
cd clinic-appointment-system

# Chạy tất cả services (PostgreSQL + Backend + Frontend + Nginx)
docker-compose up -d

# Truy cập
# Frontend: http://localhost
# Backend API: http://localhost/api/
# Health check: http://localhost/api/health/
```

### Tạo dữ liệu demo

```bash
# Chạy container để seed data, rồi restart bình thường
docker-compose exec backend sh -c "python manage.py seed_demo_data --patients 10 --doctors 5"
```

> **Lưu ý:** Đợi ~30 giây sau khi `docker-compose up` để backend khởi tạo xong (migrations + collectstatic).

### Xem logs

```bash
docker-compose logs -f backend   # Backend logs
docker-compose logs -f frontend   # Frontend logs
docker-compose logs -f db        # Database logs
```

### Dừng và xóa

```bash
docker-compose down              # Dừng (giữ data)
docker-compose down -v           # Dừng + xóa data
```

### Rebuild khi code thay đổi

```bash
docker-compose up -d --build     # Rebuild tất cả
docker-compose up -d --build backend  # Chỉ rebuild backend
```

---

## 3. Chạy project (Development Local — không Docker)

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

---

## 4. Chạy Tests

### Backend Tests

```bash
cd backend
pip install -r requirements-test.txt
pytest
```

### Frontend Tests

```bash
cd frontend
npm test
```

---

## 5. Tài khoản demo

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

## 6. Flow demo đề xuất

### Admin — `admin / admin123`
1. Đăng nhập → Dashboard → KPI cards (tổng lịch hẹn, bệnh nhân mới, tỷ lệ hoàn tất)
2. Biểu đồ: phân bổ theo chuyên khoa, lịch hẹn theo kỳ
3. Catalog → Bác sĩ (xem / sửa) → Lễ tân (xem / sửa / tạo)
4. Appointments → Danh sách lịch hẹn → Filter theo ngày / trạng thái
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

### Guest Booking (không cần đăng nhập)
1. Landing page → "Đặt lịch khám ngay" → Booking Wizard
2. Chọn chuyên khoa → Chọn bác sĩ → Chọn ngày + slot → Nhập thông tin
3. Booking success → Nhận mã lịch hẹn + QR code
4. Tra cứu lịch hẹn: `/lookup` → Nhập mã + SĐT

---

## 7. Giới hạn hiện tại & Hướng phát triển

### Giới hạn (đã biết)

| Giới hạn | Mức độ | Ghi chú |
|---|---|---|
| Landing page: Doctor Cards là mock data | **Thấp** | Không kết nối DB; thay bằng API khi cần |
| Reports: Revenue/Doanh thu là ước tính | **Trung bình** | Ghi rõ "Lượt khám hoàn tất ước tính" — chưa có bảng Billing |
| Patient: Chưa có lịch hẹn trong seed data | **Thấp** | Tạo qua booking wizard để test |

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

## 8. Deployment lên Render.com (Miễn phí)

### Bước 1: Push code lên GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/clinic-appointment-system.git
git push -u origin main
```

### Bước 2: Tạo PostgreSQL Database

1. Truy cập [render.com](https://render.com) → Đăng nhập (dùng GitHub)
2. **New** → **PostgreSQL**
3. Name: `clinic-db`, Plan: **Free**
4. Click **Create Database**
5. Copy các giá trị: **Host**, **Database**, **Username**, **Password**

### Bước 3: Deploy Backend

1. **New** → **Web Service**
2. Connect GitHub repo `clinic-appointment-system`
3. Configure:
   - **Name:** `clinic-backend`
   - **Region:** Singapore
   - **Branch:** `main`
   - **Root Directory:** để trống
   - **Runtime:** **Docker**
   - **Plan:** **Free**
4. **Add Environment Variable:**
   - `DB_ENGINE` = `postgresql`
   - `DB_HOST` = (từ Bước 2)
   - `DB_PORT` = `5432`
   - `DB_NAME` = (từ Bước 2)
   - `DB_USER` = (từ Bước 2)
   - `DB_PASSWORD` = (từ Bước 2)
   - `DJANGO_DEBUG` = `false`
   - `DJANGO_ALLOWED_HOSTS` = `clinic-backend.onrender.com`
   - `DJANGO_SECRET_KEY` = (Generate tại https://djecrety.ir/)
   - `JWT_SECRET_KEY` = (Generate tại https://djecrety.ir/)
   - `SEED_DEMO_DATA` = `true`
5. **Deploy**

### Bước 4: Deploy Frontend

1. **New** → **Web Service**
2. Connect GitHub repo
3. Configure:
   - **Name:** `clinic-frontend`
   - **Region:** Singapore
   - **Branch:** `main`
   - **Root Directory:** để trống
   - **Runtime:** **Docker**
   - **Plan:** **Free**
4. **Add Environment Variable:**
   - `REACT_APP_API_BASE_URL` = `https://clinic-backend.onrender.com/api`
5. **Deploy**

### Hoặc dùng Render Blueprint (tự động cấu hình)

Push code lên GitHub, sau đó:
1. Truy cập [render.com/blueprints](https://dashboard.render.com/blueprints)
2. **New Blueprint Instance**
3. Connect repo → Tải lên file `render.yaml` từ repo
4. Render sẽ tự tạo PostgreSQL + Backend + Frontend

> **Lưu ý:** Free tier của Render ngủ sau 15 phút không dùng. Lần đầu truy cập có thể chậm ~30s. Đủ để demo cho thầy.

---

## 9. Cấu trúc project

```
clinic-appointment-system/
├── backend/
│   ├── appointments/      # Models, services, views cho lịch hẹn
│   ├── catalog/           # Models, services, views cho chuyên khoa, bác sĩ
│   ├── common/           # Auth, permissions, response helpers
│   ├── config/            # Django settings, URLs, WSGI
│   ├── portal/           # Auth, patient, doctor, receptionist, admin APIs
│   ├── manage.py
│   ├── requirements.txt   # Production dependencies
│   ├── requirements-test.txt  # Test dependencies
│   ├── pytest.ini        # Pytest configuration
│   ├── conftest.py       # Pytest fixtures
│   └── Dockerfile         # Backend container
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── public/        # Landing, Login, Register, Booking
│   │   │   ├── patient/       # MyAppointments, HealthProfile, Notifications
│   │   │   ├── doctor/        # Schedule, Queue, Visits, VisitPage
│   │   │   ├── reception/     # Dashboard, Checkin, Patients
│   │   │   └── admin/        # Dashboard, Catalog, Reports, Audit
│   │   ├── layouts/           # Layout components
│   │   ├── services/           # apiClient, authService, endpoints
│   │   └── router.jsx        # React Router definitions
│   ├── package.json
│   └── Dockerfile         # Frontend container (React build + Nginx)
├── nginx/
│   └── nginx.conf        # Reverse proxy config
├── docker-compose.yml     # Local development stack
├── render.yaml           # Render.com deployment blueprint
├── .env.example          # Environment variables template
└── README.md
```

---

## 10. Ghi chú kỹ thuật

### Authentication
- Hệ thống dùng **JWT tokens** cho stateless API access và **Django session-based auth** cho staff.
- Staff (admin/reception/doctor): login set JWT token + session cookie.
- Patient: login set JWT token + session cookie.

### API Proxy
- Frontend dùng `setupProxy.js` (http-proxy-middleware) để proxy API calls sang backend (dev).
- Production Docker: Nginx reverse proxy xử lý routing `/api/` → Backend, `/` → Frontend.

### Docker Architecture
```
Browser → Nginx (port 80) → /           → React Static (nginx)
                        → /api/*       → Django Backend (gunicorn)
                        → /static/*    → Django Static (white noise)
                        → /media/*     → Django Media
```

### Database
- Development: SQLite (`db.sqlite3`)
- Production (Docker/Render): PostgreSQL 16
