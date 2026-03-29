# PROJECT BRIEF

## 1. Tên dự án
Hệ thống quản lý đặt lịch khám bệnh cho phòng khám  
(Clinic Appointment System)

## 2. Môn học
Công nghệ phần mềm

## 3. Nhóm
Người Nùng

## 4. Thành viên nhóm
- Trương Minh Trung Huy (SM)
- Trương Đình Bắc (PO)
- Trương Thị Kim Ngân (Dev)
- Từ Nguyễn Huyền Trang (Dev)
- Nguyễn Ngọc Quyền (Dev)

## 5. Repository
clinic-appointment-system

## 6. Stack công nghệ
- Frontend: React (JS/HTML/CSS)
- Backend: Django + Django REST Framework
- Database: PostgreSQL

## 7. Mục tiêu dự án
Xây dựng website đặt lịch khám bệnh cho một chi nhánh phòng khám với các mục tiêu:
- Cho phép bệnh nhân đặt lịch không cần tài khoản
- Cung cấp mã lịch hẹn để tra cứu nhanh
- Hỗ trợ xác nhận lịch hẹn nhằm giảm no-show
- Hỗ trợ Admin quản lý lịch hẹn, check-in, hủy, dời lịch, no-show
- Hỗ trợ Bác sĩ xem lịch khám, cập nhật trạng thái, nhập kết quả khám và đơn thuốc
- Cung cấp sổ khám điện tử cho bệnh nhân có tài khoản

## 8. Đối tượng sử dụng
- Guest / Patient
- Doctor
- Admin

## 9. Phạm vi MVP
### Public / Patient
- Booking Wizard 4 bước
- Tra cứu lịch hẹn
- Đăng ký / đăng nhập
- Claim hồ sơ
- Xem lịch sử khám và đơn thuốc

### Doctor
- Xem lịch khám
- Xem hàng đợi
- Cập nhật trạng thái khám
- Nhập kết quả khám
- Kê đơn thuốc

### Admin
- Dashboard tổng quan
- Quản lý lịch hẹn
- Quản lý khoa
- Quản lý bác sĩ
- Quản lý loại khám
- Quản lý staff
- Xem audit log
- Xem báo cáo

## 10. Nghiệp vụ chính
- Slot block: 25 phút (20 phút khám + 5 phút buffer)
- Loại khám:
  - 15 phút = 1 block
  - 20 phút = 1 block
  - 40 phút = 2 block liên tiếp
- Chống trùng lịch bác sĩ theo doctor_id + time range
- Trạng thái lịch hẹn:
  - Pending
  - Confirmed
  - Checked-in
  - In-progress
  - Completed
  - Cancelled
  - No-show

## 11. Các nguyên tắc quan trọng
- Không phá vỡ luồng nghiệp vụ chính khi thêm tính năng mới
- Ưu tiên thay đổi nhỏ, an toàn, dễ kiểm soát
- Không refactor lan rộng khi chưa cần thiết
- Tất cả file tiếng Việt phải dùng UTF-8