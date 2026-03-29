## 1. Mục đích
Tài liệu này dùng để tránh chồng chéo công việc, conflict GitHub, và sửa nhầm phạm vi trong project.

## 2. Vai trò hiện tại của người dùng
Người dùng hiện phụ trách: **Admin + Integration**

## 3. Phạm vi chính được phép ưu tiên chỉnh sửa

### Frontend
- frontend/src/pages/admin/
- frontend/src/components/admin/ (nếu có)
- frontend/src/layouts/AdminLayout.jsx
- frontend/src/services/adminApi.js
- frontend/src/router.jsx (chỉ khi thật cần)
- frontend/src/services/apiClient.js (chỉ khi thật cần)
- frontend/src/services/endpoints.js (chỉ khi thật cần)

### Backend
- backend/common/
- backend/config/ (chỉ khi thật cần)
- các API hỗ trợ riêng cho admin nếu được phân công

## 4. Khu vực không nên tự ý sửa
- frontend/src/pages/public/
- frontend/src/pages/patient/
- frontend/src/pages/doctor/
- frontend/src/pages/reception/
- logic nghiệp vụ thuộc role khác nếu chưa đánh giá impact

## 5. Nguyên tắc khi cần sửa file chung
Nếu bắt buộc phải sửa file chung như:
- router.jsx
- apiClient.js
- endpoints.js
- layout dùng chung

thì phải ghi rõ:
1. file nào cần sửa
2. vì sao bắt buộc phải sửa
3. ảnh hưởng tới role nào
4. cách giảm nguy cơ conflict
5. cách test nhanh sau khi sửa

## 6. Nguyên tắc teamwork
- Không refactor toàn project
- Không đổi tên file/hàm hàng loạt
- Không sửa code ngoài task hiện tại
- Ưu tiên commit nhỏ, dễ rollback
- Trước khi push phải fetch/rebase branch mới nhất nếu đang dùng flow rebase

## 7. Mục tiêu của role Admin + Integration
- Xây dựng phần admin đầy đủ cho MVP
- Giữ ổn định file dùng chung
- Hạn chế tối đa ảnh hưởng tới phần patient/doctor/public
- Kiểm tra logic tích hợp của toàn hệ thống khi cần