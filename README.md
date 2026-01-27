# Hệ thống quản lý đặt lịch khám bệnh cho phòng khám (Clinic Appointment System)

## 1. Thông tin chung
- **Môn học:** Công nghệ phần mềm  
- **Nhóm:** Người Nùng  
- **Vai trò chịu trách nhiệm (Product Owner):** (Trương Minh Trung Huy)  
- **Repository:** https://github.com/TrungHuy242/clinic-appointment-system  
- **Stack dự kiến:** React (JS/HTML/CSS) + Django + PostgreSQL

---

## 2. Vấn đề cần giải quyết
Hiện nay nhiều phòng khám quy mô nhỏ và vừa vẫn thực hiện đặt lịch khám thông qua điện thoại hoặc ghi chép thủ công, dẫn đến các vấn đề như: quá tải khâu tiếp nhận, dễ nhầm lẫn lịch khám, khó quản lý trạng thái bệnh nhân đến khám và tỷ lệ bệnh nhân không đến (no-show).

Bệnh nhân cũng gặp bất tiện trong việc theo dõi lịch sử khám bệnh và đơn thuốc, do thông tin thường được lưu trữ rời rạc hoặc dưới dạng giấy tờ. Vì vậy, cần một hệ thống đặt lịch khám trực tuyến đơn giản, dễ sử dụng, phù hợp với mô hình một phòng khám – một chi nhánh, nhưng vẫn đảm bảo đúng nghiệp vụ thực tế.

---

## 3. Mục tiêu dự án
Xây dựng một website đặt lịch khám bệnh cho một chi nhánh phòng khám, đáp ứng các mục tiêu sau:

- Cho phép bệnh nhân đặt lịch khám không cần tài khoản (guest booking).

- Cung cấp mã lịch hẹn và QR để tra cứu nhanh.

- Yêu cầu bệnh nhân tự xác nhận sẽ đến nhằm giảm lịch hẹn ảo.

- Hỗ trợ Admin quản lý lịch hẹn, check-in, dời/hủy/no-show.

- Hỗ trợ Bác sĩ xem lịch khám, nhập kết quả khám và đơn thuốc.

- Cung cấp “Sổ khám điện tử” cho bệnh nhân có tài khoản để xem lại lịch sử khám và đơn thuốc.

---

## 4. Đối tượng sử dụng (User Roles)
- Bệnh nhân (Patient)

Đặt lịch khám không cần đăng nhập.

Xác nhận lịch hẹn trong thời gian quy định.

Tra cứu lịch hẹn bằng SĐT + mã lịch hẹn.

Đăng ký tài khoản để:

Claim hồ sơ khám

Xem “Sổ khám điện tử” (lịch sử khám, đơn thuốc).

- Bác sĩ (Doctor)

Đăng nhập hệ thống.

Xem lịch khám của mình theo ngày.

Cập nhật trạng thái khám.

Nhập kết quả khám và đơn thuốc cho bệnh nhân.

- Admin

- Quản trị toàn bộ hệ thống.

- Quản lý:

Khoa

Bác sĩ

Loại khám

Khung giờ khám

- Quản lý lịch hẹn:

Check-in bệnh nhân

Dời lịch, hủy lịch, đánh dấu no-show

- Theo dõi báo cáo và nhật ký hệ thống (audit log).
---

## 5. Phạm vi chức năng (MVP đề xuất)
### 5.1 Đặt lịch khám (Public Booking)

- Booking Wizard 4 bước:
Khoa → Bác sĩ → Thời gian/Slot → Thông tin bệnh nhân

- Sinh mã lịch hẹn + QR

- Trạng thái lịch hẹn:

Pending

Confirmed

Checked-in

In-progress

Completed

Cancelled

No-show

- PA1 – Tự xác nhận sẽ đến:

Bệnh nhân phải xác nhận trong 15 phút

Quá hạn → lịch hẹn tự động Cancelled

- Tra cứu lịch hẹn bằng SĐT + mã lịch hẹn

### 5.2 Quản lý lịch hẹn (Admin)

- Danh sách lịch hẹn theo ngày / bác sĩ / trạng thái

- Check-in theo khung giờ (PA4):

Cho phép check-in trong khoảng:
(Giờ hẹn - 15 phút) → (Giờ hẹn + 10 phút)

- Dời lịch / hủy lịch / no-show

- Chỉnh sửa thông tin hành chính bệnh nhân (có audit log)

### 5.3 Bác sĩ

- Xem Lịch khám 

- Các trạng thái:

Checked-in

In-progress

Completed

- Nhập kết quả khám:

Chẩn đoán

Hướng điều trị

- Nhập đơn thuốc:

Tên thuốc – liều dùng – số ngày

### 5.4 Patient Portal – “Sổ khám điện tử”

- Đăng ký / đăng nhập bằng SĐT + mật khẩu

- Claim hồ sơ bằng Mã lịch hẹn + Họ tên

- Xem:

Lịch sử khám bệnh

Chi tiết từng lượt khám

Đơn thuốc đã kê

---

## 6. Ghi chú thiết kế nghiệp vụ (rút gọn)
- **Slot block:** 25 phút (20’ khám + 5’ buffer)  
- **Loại khám:** 15’ = 1 block, 20’ = 1 block, 40’ = 2 block (chiếm 2 slot liên tiếp)  
- **Chống trùng lịch bác sĩ:** trùng theo `doctor_id + time range` kể cả khi bác sĩ thuộc nhiều khoa.

---

## 7. Kế hoạch triển khai (tóm tắt)
- Tuần 1–2: Setup repository, cấu trúc FE/BE, seed data, UI cơ bản

- Tuần 2–4: Chức năng đặt lịch + xác nhận lịch hẹn (PA1)

- Tuần 4–6: Quản lý lịch hẹn (Admin) + chức năng bác sĩ

- Tuần 6+: Patient Portal, audit log, báo cáo

---

## 8. Run project (sẽ cập nhật)
- Frontend: `npm install` → `npm start`
- Backend: `pip install -r requirements.txt` → `python manage.py runserver`
