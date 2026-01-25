# Hệ thống quản lý đặt lịch khám bệnh cho phòng khám (Clinic Appointment System)

## 1. Thông tin chung
- **Môn học:** Công nghệ phần mềm  
- **Nhóm:** Người Nùng  
- **Vai trò chịu trách nhiệm (Product Owner):** (Trương Minh Trung Huy)  
- **Repository:** https://github.com/TrungHuy242/clinic-appointment-system  
- **Stack dự kiến:** React (JS/HTML/CSS) + Django + PostgreSQL

---

## 2. Vấn đề cần giải quyết
Hiện nay nhiều phòng khám vẫn vận hành đặt lịch thủ công qua điện thoại hoặc ghi chép rời rạc, gây quá tải cho lễ tân, dễ nhầm lịch và khó kiểm soát tỷ lệ bệnh nhân “bùng” lịch. Bệnh nhân cũng gặp bất tiện vì phải mang nhiều giấy tờ, khó theo dõi lịch sử thăm khám và đơn thuốc sau mỗi lần khám. Ngoài ra, phòng khám đa chi nhánh cần một hệ thống có thể mở rộng, quản lý lịch hẹn theo chi nhánh/khoa/bác sĩ và giảm tình trạng trùng lịch của bác sĩ thuộc nhiều khoa.

---

## 3. Mục tiêu dự án
Xây dựng một website đặt lịch khám **không cần tài khoản** cho khách lần đầu (guest booking) nhưng vẫn đảm bảo vận hành thực tế:  
- Cho phép bệnh nhân đặt lịch nhanh, nhận **mã lịch hẹn/QR** và **tự xác nhận sẽ đến** để giảm lịch ảo.  
- Hỗ trợ lễ tân **check-in theo khung giờ**, quản lý trạng thái lịch hẹn, dời/hủy/no-show.  
- Hỗ trợ bác sĩ xem lịch của mình, nhập kết quả khám và đơn thuốc.  
- Cung cấp **“Sổ khám điện tử”** cho bệnh nhân có tài khoản (SĐT + mật khẩu) sau khi “claim” hồ sơ, giúp xem lại lịch sử khám và đơn thuốc ngay trên web.

---

## 4. Đối tượng sử dụng (User Roles)
- **Guest (Public):** Đặt lịch không cần đăng nhập, xác nhận sẽ đến, tra cứu lịch bằng SĐT + mã.  
- **Patient (có tài khoản):** Claim hồ sơ để xem “Sổ khám điện tử” (lịch sử khám, đơn thuốc).  
- **Receptionist (lễ tân/tiếp nhận):** Quản lý lịch hẹn, check-in, dời/hủy/no-show, chỉnh sửa thông tin hành chính bệnh nhân (có audit log).  
- **Doctor (bác sĩ):** Xem lịch, chuyển trạng thái khám, nhập kết quả khám + đơn thuốc.  
- **Admin:** Quản trị danh mục (chi nhánh/khoa/phòng/bác sĩ/loại khám), tài khoản & phân quyền, báo cáo, audit log.

---

## 5. Phạm vi chức năng (MVP đề xuất)
### 5.1 Public booking
- Booking Wizard 5 bước: **Chi nhánh → Khoa → Bác sĩ → Thời gian/Slot → Thông tin**
- Sinh **mã lịch hẹn + QR**
- Trạng thái lịch hẹn: Pending / Confirmed / Checked-in / In-progress / Completed / Cancelled / No-show
- **PA1 – Tự xác nhận sẽ đến:** trong **15 phút** để giữ chỗ (Pending → Confirmed), quá hạn tự Cancelled
- Tra cứu lịch hẹn bằng **SĐT + mã**

### 5.2 Lễ tân
- Danh sách lịch hẹn + lọc theo ngày/chi nhánh/khoa/bác sĩ/trạng thái
- **PA4 – Check-in theo khung giờ:** cho phép check-in trong khoảng **(giờ hẹn - 15 phút) → (giờ hẹn + 10 phút)**
- Dời lịch / hủy / no-show
- Quản lý bệnh nhân (hành chính) + audit log

### 5.3 Bác sĩ
- Lịch của tôi (tabs Checked-in / In-progress / Completed)
- Nhập kết quả khám (chẩn đoán, điều trị)
- Đơn thuốc dạng dòng: **Tên thuốc – liều – số ngày**

### 5.4 Patient Portal (“Sổ khám điện tử”)
- Đăng ký/đăng nhập bằng **SĐT + mật khẩu** (không OTP)
- Claim hồ sơ bằng **(Mã lịch hẹn + Họ tên)**
- Xem lịch sử khám + chi tiết lượt khám + đơn thuốc

---

## 6. Ghi chú thiết kế nghiệp vụ (rút gọn)
- **Slot block:** 25 phút (20’ khám + 5’ buffer)  
- **Loại khám:** 15’ = 1 block, 20’ = 1 block, 40’ = 2 block (chiếm 2 slot liên tiếp)  
- **Chống trùng lịch bác sĩ:** trùng theo `doctor_id + time range` kể cả khi bác sĩ thuộc nhiều khoa.

---

## 7. Kế hoạch triển khai (tóm tắt)
- Tuần 1–2: Setup repo, cấu trúc FE/BE, seed data, UI skeleton + routes  
- Tuần 2–4: Catalog + Booking MVP + PA1 (confirm 15’)  
- Tuần 4–6: Lễ tân (list + check-in PA4) + bác sĩ (visit + đơn thuốc)  
- Tuần 6+: Patient Portal (claim + sổ khám) + audit log + reports

---

## 8. Run project (sẽ cập nhật)
- Frontend: `npm install` → `npm start`
- Backend: `pip install -r requirements.txt` → `python manage.py runserver`
