# ARCHITECTURE

## 1. Tổng quan kiến trúc
Dự án sử dụng kiến trúc tách riêng:
- Frontend React
- Backend Django REST API
- Database PostgreSQL

Frontend gọi API từ backend qua service layer.

## 2. Cấu trúc backend

backend/
├── config/          # cấu hình Django
├── catalog/         # Specialty, Doctor, VisitType (nếu có)
├── appointments/    # Appointment, AppointmentBlock, trạng thái lịch
├── portal/          # User, PatientProfile, MedicalRecord, Notification
└── common/          # tiện ích chung, seed, helpers, audit utilities
## 3. Cấu trúc frontend
frontend/src/
├── pages/
│   ├── public/
│   ├── patient/
│   ├── doctor/
│   ├── reception/   
│   └── admin/
├── layouts/
├── components/
├── services/
└── router.jsx

## 4. Các app backend chính
- catalog 
    + Quản lý : 
        - Specialty
        - Doctor
        - VisitType
- appointments
    + Quản lý : 
        - Appointment
        - AppointmentBlock
        - logic trạng thái lịch hẹn
        - checkin
        - reschedule
        - no-show
        - lookup lịch hẹn
- portal
    + Quản lý : 
        - User
        - PatientProfile
        - MedicalRecord
        - PatientNotification
- common 
    + Quản lý: 
        - helper dùng chung
        - seed data
        - audi log utilities
        - constants dùng chung

## 5. Kiến trúc frontend theo vai trò
- public :
    + Landing page
    + Booking wizard
    + Booking success
    + Lookup page
- patient : 
    +  My appointments
    + Health profile
    + Record details
    + Notifications
    + Account
- doctor : 
    + Schedule
    + Queue
    + Visits
    + Visit detail
- admin : 
    + Dashboard
    + Appointments management
    + Catalog management
    + Staff management
    + Audit log
    + Report

## 6. Tầng servicec frontend
- Service layer phải gom API theo nhóm: 
    + apiClient.js
    + endpoints.js
    + adminApi.js
    + doctorApi.js
    + patientApi.js
    + authService.js
- Nguyên tắc: 
    + page không gọi fetch.axios trực tiếp nếu đã có service
    + response cần normalize ổn định
    + tránh contract API toàn cục nếu chưa có kế hoạch

## 7. Nguyên tắc an toàn kiến trúc
    - Không sửa router toàn cục nếu chưa cần
    - Không sửa layout dùng chung nếu chưa đánh giá tác động
    - Mọi thay đổi file dùng chung phải đi kèm với risk note
    - Các thay đổi phải ưu tiên backward-compatible