# ADMIN MVP PLAN

## Mục tiêu
Xây dựng một khu vực Admin hoàn chỉnh, rõ nghiệp vụ, có giao diện nhất quán, và đủ mạnh để quản lý hệ thống phòng khám trong phạm vi MVP.

---

## PHASE 1 - KHUNG ADMIN
### Mục tiêu
Tạo nền tảng chung cho toàn bộ khu vực admin.

### Checklist
- [ ] Tạo AdminLayout
- [ ] Tạo sidebar admin
- [ ] Tạo topbar admin
- [ ] Tạo route guard cho admin
- [ ] Tạo bộ badge trạng thái dùng chung
- [ ] Tạo style chung cho table, form, modal

### Kết quả mong đợi
- Có giao diện admin riêng
- Có điều hướng ổn định
- Có nền tảng để gắn các module sau

---

## PHASE 2 - DASHBOARD
### Mục tiêu
Tạo trang tổng quan để admin nhìn nhanh trạng thái vận hành hệ thống.

### Checklist
- [ ] Stat cards
- [ ] Tổng lịch hẹn hôm nay
- [ ] Số pending / confirmed / checked-in / completed / cancelled / no-show
- [ ] Bảng lịch hẹn gần nhất
- [ ] Cảnh báo lịch sắp đến nhưng chưa check-in
- [ ] Biểu đồ cơ bản

### Kết quả mong đợi
- Admin vào hệ thống là thấy ngay tình trạng hoạt động

---

## PHASE 3 - APPOINTMENT MANAGEMENT
### Mục tiêu
Xây dựng module mạnh nhất của admin.

### Checklist
- [ ] Danh sách lịch hẹn
- [ ] Search theo mã lịch / tên / SĐT
- [ ] Filter theo ngày / bác sĩ / khoa / trạng thái
- [ ] Xem chi tiết lịch hẹn
- [ ] Cập nhật trạng thái theo rule hợp lệ
- [ ] Check-in
- [ ] Cancel
- [ ] No-show
- [ ] Reschedule
- [ ] Modal confirm action
- [ ] Hiển thị lịch sử thay đổi cơ bản

### Rule trạng thái cần tuân thủ
- Pending -> Confirmed
- Confirmed -> Checked-in
- Checked-in -> In-progress
- In-progress -> Completed
- Pending / Confirmed -> Cancelled
- Confirmed / Checked-in -> No-show (tùy nghiệp vụ)
- Không cho phép action không hợp lệ

### Kết quả mong đợi
- Admin quản lý được lịch hẹn đầy đủ trong MVP

---

## PHASE 4 - CATALOG MANAGEMENT
### Mục tiêu
Quản lý dữ liệu nền của hệ thống.

### Checklist
- [ ] CRUD Specialty
- [ ] CRUD Doctor
- [ ] CRUD Visit Type
- [ ] Active / inactive dữ liệu
- [ ] Form modal cho create/update
- [ ] Validate dữ liệu đầu vào

### Kết quả mong đợi
- Admin quản lý được khoa, bác sĩ, loại khám

---

## PHASE 5 - STAFF MANAGEMENT
### Mục tiêu
Quản lý tài khoản staff.

### Checklist
- [ ] Danh sách staff user
- [ ] Tạo user mới
- [ ] Sửa thông tin user
- [ ] Gán role
- [ ] Khóa / mở tài khoản
- [ ] Gán doctor cho tài khoản doctor

### Kết quả mong đợi
- Admin kiểm soát được tài khoản nội bộ

---

## PHASE 6 - AUDIT LOGS + REPORTS
### Mục tiêu
Bổ sung lớp quản trị nâng cao cho admin.

### Checklist
- [ ] Audit log page
- [ ] Filter theo actor / action / date
- [ ] Reports overview
- [ ] Báo cáo theo ngày / tuần / tháng
- [ ] Báo cáo theo trạng thái lịch hẹn
- [ ] Báo cáo theo bác sĩ / khoa

### Kết quả mong đợi
- Admin có thể theo dõi hoạt động và số liệu cơ bản

---

## YÊU CẦU UI/UX CHUNG
- [ ] Có loading state
- [ ] Có empty state
- [ ] Có error state
- [ ] Có confirm modal cho action nguy hiểm
- [ ] Có toast success/error
- [ ] Có pagination hoặc load more
- [ ] Badge trạng thái nhất quán
- [ ] Filter bar dễ dùng

---

## YÊU CẦU KỸ THUẬT
- [ ] Tách page / component / service rõ ràng
- [ ] Không để page gọi API thô nếu đã có service
- [ ] Hạn chế sửa file dùng chung
- [ ] Mỗi task phải có commit nhỏ
- [ ] Sau mỗi task phải cập nhật PROGRESS.md