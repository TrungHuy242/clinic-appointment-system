# API CONTRACT

## 1. Mục đích
Tài liệu này mô tả contract API định hướng để frontend và backend làm việc thống nhất, tránh viết lệch nhau trong quá trình phát triển.

## 2. Nguyên tắc chung
- Ưu tiên giữ contract API ổn định.
- Không thay đổi response đang dùng bởi role khác nếu chưa đánh giá tác động.
- Nếu backend chưa hoàn thiện endpoint thật, frontend có thể mock tạm nhưng phải ghi rõ.
- Mọi endpoint admin nên nằm dưới prefix `/api/admin/`.
- Dữ liệu trả về cần nhất quán để frontend dễ render table, form, badge trạng thái và filter.

## 3. Chuẩn response đề xuất

### 3.1 Thành công
Response thành công nên có dạng nhất quán:

{
  "success": true,
  "message": "OK",
  "data": {}
}

### 3.2 Lỗi
Response lỗi nên có dạng:

{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "field_name": [
      "This field is required."
    ]
  }
}

## 4. Module Dashboard Admin

### 4.1 GET /api/admin/dashboard/overview/
Mục đích:
- Lấy dữ liệu tổng quan cho trang dashboard admin.

Dữ liệu trả về:
- appointments_today
- pending_count
- confirmed_count
- checked_in_count
- completed_count
- cancelled_count
- no_show_count
- active_doctors_today
- recent_appointments
- alerts

Ví dụ response:

{
  "success": true,
  "message": "Dashboard overview fetched successfully",
  "data": {
    "appointments_today": 28,
    "pending_count": 4,
    "confirmed_count": 7,
    "checked_in_count": 6,
    "completed_count": 8,
    "cancelled_count": 2,
    "no_show_count": 1,
    "active_doctors_today": 5,
    "recent_appointments": [],
    "alerts": []
  }
}

## 5. Module Appointment Management

### 5.1 GET /api/admin/appointments/
Mục đích:
- Lấy danh sách lịch hẹn cho admin.

Query params hỗ trợ:
- search
- date
- doctor_id
- specialty_id
- status
- page
- page_size

Ví dụ:
- /api/admin/appointments/?search=0901
- /api/admin/appointments/?date=2026-03-19&status=CONFIRMED
- /api/admin/appointments/?doctor_id=2&page=1

Ví dụ response:

{
  "success": true,
  "message": "Appointments fetched successfully",
  "data": {
    "count": 120,
    "next": null,
    "previous": null,
    "results": [
      {
        "id": 1,
        "code": "APT-2026-0001",
        "patient_name": "Nguyen Van A",
        "patient_phone": "0901234567",
        "doctor_id": 2,
        "doctor_name": "Dr. Tran Minh",
        "specialty_id": 1,
        "specialty_name": "Noi tong quat",
        "visit_type": "Kham thuong",
        "scheduled_start": "2026-03-19T09:00:00",
        "scheduled_end": "2026-03-19T09:25:00",
        "status": "CONFIRMED"
      }
    ]
  }
}

### 5.2 GET /api/admin/appointments/:id/
Mục đích:
- Lấy chi tiết một lịch hẹn.

Ví dụ response:

{
  "success": true,
  "message": "Appointment detail fetched successfully",
  "data": {
    "id": 1,
    "code": "APT-2026-0001",
    "patient_name": "Nguyen Van A",
    "patient_phone": "0901234567",
    "doctor_id": 2,
    "doctor_name": "Dr. Tran Minh",
    "specialty_id": 1,
    "specialty_name": "Noi tong quat",
    "visit_type": "Kham thuong",
    "scheduled_start": "2026-03-19T09:00:00",
    "scheduled_end": "2026-03-19T09:25:00",
    "status": "CONFIRMED",
    "notes": "",
    "created_at": "2026-03-18T20:00:00",
    "updated_at": "2026-03-18T21:00:00"
  }
}

### 5.3 PATCH /api/admin/appointments/:id/status/
Mục đích:
- Cập nhật trạng thái lịch hẹn theo rule hợp lệ.

Request body:

{
  "status": "CONFIRMED"
}

Rule trạng thái đề xuất:
- Pending -> Confirmed
- Confirmed -> Checked-in
- Checked-in -> In-progress
- In-progress -> Completed
- Pending / Confirmed -> Cancelled
- Confirmed / Checked-in -> No-show

Ví dụ response:

{
  "success": true,
  "message": "Appointment status updated successfully",
  "data": {
    "id": 1,
    "status": "CONFIRMED"
  }
}

### 5.4 POST /api/admin/appointments/:id/checkin/
Mục đích:
- Check-in bệnh nhân tại quầy.

Request body:

{
  "checked_in_at": "2026-03-19T08:45:00"
}

Ví dụ response:

{
  "success": true,
  "message": "Patient checked in successfully",
  "data": {
    "id": 1,
    "status": "CHECKED_IN",
    "checked_in_at": "2026-03-19T08:45:00"
  }
}

### 5.5 POST /api/admin/appointments/:id/cancel/
Mục đích:
- Hủy lịch hẹn.

Request body:

{
  "reason": "Patient requested cancel"
}

Ví dụ response:

{
  "success": true,
  "message": "Appointment cancelled successfully",
  "data": {
    "id": 1,
    "status": "CANCELLED",
    "reason": "Patient requested cancel"
  }
}

### 5.6 POST /api/admin/appointments/:id/no-show/
Mục đích:
- Đánh dấu bệnh nhân không đến.

Request body:

{
  "reason": "Patient did not arrive"
}

Ví dụ response:

{
  "success": true,
  "message": "Appointment marked as no-show",
  "data": {
    "id": 1,
    "status": "NO_SHOW",
    "reason": "Patient did not arrive"
  }
}

### 5.7 POST /api/admin/appointments/:id/reschedule/
Mục đích:
- Dời lịch hẹn sang thời gian khác.

Request body:

{
  "new_doctor_id": 2,
  "new_start_time": "2026-03-20T09:00:00",
  "new_end_time": "2026-03-20T09:25:00"
}

Ví dụ response:

{
  "success": true,
  "message": "Appointment rescheduled successfully",
  "data": {
    "id": 1,
    "doctor_id": 2,
    "scheduled_start": "2026-03-20T09:00:00",
    "scheduled_end": "2026-03-20T09:25:00",
    "status": "CONFIRMED"
  }
}

## 6. Module Catalog Management

## 6.1 Specialty

### GET /api/admin/specialties/
Mục đích:
- Lấy danh sách khoa.

### POST /api/admin/specialties/
Mục đích:
- Tạo khoa mới.

Request body:

{
  "name": "Noi tong quat",
  "description": "Kham va dieu tri tong quat",
  "is_active": true
}

### PATCH /api/admin/specialties/:id/
Mục đích:
- Cập nhật khoa.

### DELETE /api/admin/specialties/:id/
Mục đích:
- Xóa hoặc deactivate khoa tùy rule hệ thống.

## 6.2 Doctor

### GET /api/admin/doctors/
Mục đích:
- Lấy danh sách bác sĩ.

### POST /api/admin/doctors/
Mục đích:
- Tạo bác sĩ mới.

Request body:

{
  "full_name": "Dr. Nguyen Van B",
  "phone": "0909000000",
  "email": "doctorb@example.com",
  "specialty_id": 1,
  "bio": "Bac si chuyen khoa noi",
  "is_active": true
}

### PATCH /api/admin/doctors/:id/
Mục đích:
- Cập nhật thông tin bác sĩ.

### POST /api/admin/doctors/:id/toggle-active/
Mục đích:
- Khóa / mở trạng thái hoạt động của bác sĩ thay vì xóa cứng.

## 6.3 Visit Type

### GET /api/admin/visit-types/
Mục đích:
- Lấy danh sách loại khám.

### POST /api/admin/visit-types/
Mục đích:
- Tạo loại khám mới.

Request body:

{
  "name": "Kham thuong",
  "duration_minutes": 20,
  "block_count": 1,
  "description": "Loai kham thong thuong",
  "is_active": true
}

### PATCH /api/admin/visit-types/:id/
Mục đích:
- Cập nhật loại khám.

## 7. Module Staff Management

### 7.1 GET /api/admin/staff-users/
Mục đích:
- Lấy danh sách user staff.

### 7.2 POST /api/admin/staff-users/
Mục đích:
- Tạo user staff mới.

Request body:

{
  "username": "admin01",
  "password": "123456",
  "full_name": "Tran Minh Huy",
  "role": "ADMIN",
  "doctor_id": null,
  "is_active": true
}

### 7.3 PATCH /api/admin/staff-users/:id/
Mục đích:
- Sửa thông tin user staff.

### 7.4 POST /api/admin/staff-users/:id/reset-password/
Mục đích:
- Reset mật khẩu cho user staff.

Request body:

{
  "new_password": "12345678"
}

### 7.5 POST /api/admin/staff-users/:id/toggle-active/
Mục đích:
- Khóa / mở tài khoản staff.

## 8. Module Audit Logs

### 8.1 GET /api/admin/audit-logs/
Mục đích:
- Lấy nhật ký thao tác hệ thống.

Query params hỗ trợ:
- actor
- action
- start_date
- end_date
- target_type
- page

Ví dụ response:

{
  "success": true,
  "message": "Audit logs fetched successfully",
  "data": {
    "count": 30,
    "results": [
      {
        "id": 1,
        "actor": "admin01",
        "action": "UPDATE_APPOINTMENT_STATUS",
        "target_type": "Appointment",
        "target_id": 12,
        "description": "Changed status from CONFIRMED to CANCELLED",
        "created_at": "2026-03-19T10:20:00"
      }
    ]
  }
}

## 9. Module Reports

### 9.1 GET /api/admin/reports/overview/
Mục đích:
- Lấy số liệu tổng quan báo cáo.

### 9.2 GET /api/admin/reports/appointments-by-status/
Mục đích:
- Lấy thống kê theo trạng thái lịch hẹn.

### 9.3 GET /api/admin/reports/appointments-by-doctor/
Mục đích:
- Lấy thống kê theo bác sĩ.

### 9.4 GET /api/admin/reports/appointments-by-specialty/
Mục đích:
- Lấy thống kê theo khoa.

### 9.5 GET /api/admin/reports/trends/?range=weekly
Mục đích:
- Lấy xu hướng theo tuần, tháng, quý hoặc năm.

Giá trị range hỗ trợ:
- weekly
- monthly
- quarterly
- yearly

## 10. Ghi chú triển khai
- Frontend nên gom các endpoint admin vào `adminApi.js`.
- Các action nguy hiểm như cancel, no-show, reset-password nên có confirm modal ở UI.
- Nếu backend chưa hỗ trợ đầy đủ, frontend được phép mock tạm nhưng phải ghi chú rõ trong `PROGRESS.md`.
- Khi endpoint liên quan file dùng chung hoặc logic toàn hệ thống, phải đánh giá impact trước khi sửa.