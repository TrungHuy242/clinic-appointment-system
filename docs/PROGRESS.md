# PROGRESS

## Current Role
Admin + Integration

## Current Phase
Phase 1 & Phase 2 — Layout + Dashboard Foundation ✅
Phase 3 — Appointment Management Foundation ✅ (Bước 3 → 10 + spec fix)
Phase 4 — Catalog Management MVP ✅ (Bước 11, smoke test pass)
Phase 5 — Staff Users MVP ✅ (Bước 12)
Phase 6 — Audit Logs + Reports ✅ (AuditPage + ReportsPage)
Phase 3 (còn lại) — Appointments Confirm Modal ✅ (Bước 13)
Phase 5.1 — Staff Users: Doctor Assignment ✅
Phase 5.2 — Doctor Assignment Flow Fix ✅
Phase 4.1 — Catalog UX Refactor + Doctor Account Direct Assignment ✅
Phase 4.2 — Doctor Account Flow Cleanup (1-step create) ✅
Milestone 2.1 — DoctorDetailPage create mode + CatalogPage bỏ create modal ✅
Milestone 2.2 — Account creation trong DoctorDetailPage ✅
Milestone 2.3 — ReceptionistDetailPage + flow tương tự doctor ✅
Milestone 2.4 — Cleanup UsersPage ✅
Milestone 2.5A — Doctor profile-first hoàn chỉnh ✅
Milestone 2.5B — Receptionist detail-first đúng hướng ✅
Milestone 2.6 — Dashboard + Appointments API Integration ✅
Milestone 2.7 — Reschedule + Appointment History ✅
Milestone E — Users cleanup + backend guard ✅
Milestone D — Dashboard / Reports / Audit đáng tin hơn ✅
Milestone F — Tests tối thiểu cho Admin + chốt tài liệu ✅

## Done
  - Backend: get_dashboard_data() service → /admin/dashboard/
  - Backend: DashboardAPIView → get_dashboard_data() trả statCards + recentAppointments + alerts
  - Frontend: gọi getDashboard() thay mock data STAT_CARDS + MOCK_RECENT_APPOINTMENTS
  - Mỗi stat card dùng icon phù hợp theo key
  - Alerts section hiển thị type-based (warning/danger/info)
  - ESLint: pass

AppointmentsPage — Kết nối API thật ✅
  - Backend: AdminAppointmentViewSet tại /admin/appointments/ (list + update_status action)
  - Backend: list trả summary counts (total, pending, confirmed, checked_in, completed, cancelled, no_show)
  - Backend: update_status → PATCH /admin/appointments/{id}/status/ dùng set_appointment_status service
  - Frontend: gọi listAppointments(params) với params {date, status, q}
  - Frontend: gọi updateAppointmentStatus(id, status) khi xác nhận/check-in/cancel/no-show
  - Summary bar dùng summary từ API (không cần tính lại)
  - Debounced reload khi đổi filter
  - ESLint: pass
  - IconBtn component (renamed from TooltipIconButton): icon-only + title tooltip
  - Khoa: Pencil (sửa inline) + Trash2 (HARD DELETE)
  - Bác sĩ: Pencil→navigate detail + KeyRound (đặt lại MK tài khoản) + Trash2 (HARD DELETE)
  - Loại khám: Pencil (sửa inline) + Trash2 (HARD DELETE)
  - Lễ tân: Pencil→navigate detail + KeyRound (đặt lại MK) + Trash2 (HARD DELETE)
  - Đã bỏ Toggle bật/tắt ở Khoa và Loại khám
  - adminApi: deleteDoctor/deleteReceptionistProfile/deleteSpecialty/deleteVisitType → DELETE thật
  - adminApi: resetReceptionistPassword → POST /admin/receptionist-profiles/:id/reset-password/
  - Confirm modal text: "sẽ bị xóa vĩnh viễn — không thể hoàn tác"
  - CSS: .cat-tooltip-btn → .cat-icon-btn, danger hover fill đỏ, .cat-modal-error
  - ESLint: pass

UsersPage → Tái cấu trúc: quản lý Tài khoản Bệnh nhân ✅
  - Backend: AdminPatientProfileViewSet tại /admin/patient-profiles/ (list, update, destroy, reset-password)
  - Backend: serializers PatientProfileSerializer, PatientProfileUpdateSerializer, PatientPasswordResetSerializer
  - Backend: ReceptionistProfileViewSet thêm reset-password action
  - Backend: portal/urls đăng ký /admin/patient-profiles/
  - Frontend: listPatientProfiles, updatePatientProfile, deletePatientProfile, resetPatientPassword
  - UsersPage: hiển thị danh sách bệnh nhân (PatientProfile), không còn staff accounts
  - Mỗi row bệnh nhân: Pencil (sửa), KeyRound (đặt lại MK), Trash2 (xóa)
  - Bỏ hẳn quản lý tài khoản admin/receptionist/doctor khỏi UsersPage
  - ESLint: pass

UsersPage — Thêm sửa / xóa icon-only + tooltip ✅
  - IconBtn component: icon-only + title tooltip, variant (default/danger/warning)
  - 3 action buttons mỗi row: Pencil (sửa), KeyRound (reset MK), Trash2 (xóa)
  - Đã bỏ chức năng Toggle bật/tắt tài khoản
  - Edit modal: form sửa full_name, email, phone, notes
  - Delete: HARD DELETE thật qua DELETE /admin/users/:id/ (không còn soft delete is_active=false)
  - Reset password modal: giữ nguyên logic
  - CSS: thêm .users-page__icon-btn, .users-page__icon-btn--danger, .users-page__icon-btn--warning, .users-page__modal-error
  - ESLint: pass

**Milestone D — Dashboard / Reports / Audit đáng tin hơn ✅**
- Backend: tạo bảng `AdminAuditLog` (portal/models.py) — ghi nhật ký admin thật
- Backend: tạo migration `portal/0004_admin_audit_log.py` — đã apply
- Backend: `log_admin_action()` helper (portal/services.py) — ghi log an toàn kể cả khi fail
- Backend: wiring log vào catalog views (Specialty/Doctor/VisitType CRUD, doctor account creation)
- Backend: wiring log vào portal views (Receptionist CRUD, patient delete/reset-password, admin user reset-password)
- Backend: wiring log vào appointments views (status change, reschedule, delete)
- Backend: `_log_admin_status_change()` trong appointments/services.py — ghi audit cho cả doctor actions
- Backend: `get_audit_logs_data()` đọc từ bảng `AdminAuditLog` (không còn fake aggregate)
- Backend: `_seed_historical_logs()` — one-time backfill specialties + doctors vào bảng log
- Backend: đăng ký `AdminAuditLogAdmin` (portal/admin.py) — read-only, không thể add/edit
- Reports: đổi label "Doanh thu" → "Lượt khám hoàn tất (ước tính)"
- Reports: đổi chart title "Doanh thu" → "Lượt khám hoàn thành theo kỳ"
- Reports: CSV export ghi chú NOTE: "Revenue values are hardcoded estimates"
- Backend: KPI revenue trả về `~{N} triệu (ước tính)` thay vì số thuần túy
- Backend: summary row label: "Doanh thu thực tế" → "~{N} triệu đồng (ước tính)"
- Dashboard: backend `get_dashboard_data()` → real data (đã done trước), statCards/alerts/recentAppointments thật
- Dashboard: verify badge CSS keys khớp backend field names
- Backend check: 0 issues ✅ | ESLint: 0 errors ✅

**Milestone F — Tests tối thiểu cho Admin + chốt tài liệu ✅**
- Backend tests: catalog/tests.py (SpecialtyCRUDTests + DoctorCRUDTests + VisitTypeCRUDTests = 19 tests)
- Backend tests: portal/tests.py (ReceptionistProfileTests + AdminUserGuardTests + PatientProfileGuardTests + AuditLogTests = 24 tests)
- Backend tests: appointments/tests.py (29 tests) — sửa URL prefix `/api/v1/` → đúng `/admin/` `/public/`
- Backend tests: fix action name ('STATUS_CHANGE' → 'CONFIRM'), fix AppointmentHistory field access, fix datetime serialization, fix slot boundary issues
- Backend tests: xác minh `AdminAuditLog` real writes, `log_admin_action()` silent failure safe, `get_audit_logs_data()` đọc bảng thật
- Backend tests: verify backend guard (405 Method Not Allowed) cho generic user create và patient profile update
- Backend tests: 72/72 tests pass ✅
- Backend: fix reschedule view (`appointments/views.py`) parse ISO datetime string → timezone-aware before calling service
- PROGRESS.md: thêm Milestone F entry, bỏ Milestone 2.5C duplicate
- README.md: audit, ghi chú tính năng đúng với code, ước tính revenue ghi rõ
- ESLint: 0 errors ✅ | Backend compile: OK ✅

## Manual Test Checklist (smoke test)
### Doctor create/edit/create-account
- [ ] POST /admin/doctors/ với specialty hợp lệ → tạo profile không có account
- [ ] POST /admin/doctors/ không có specialty → 400 error
- [ ] POST /admin/doctors/<id>/create-account/ với username/password hợp lệ → tạo User + AdminAuditLog CREATE_ACCOUNT
- [ ] POST /admin/doctors/<id>/create-account/ cho doctor đã có account → 400 error
- [ ] POST /admin/doctors/<id>/create-account/ với password < 6 ký tự → 400 error
- [ ] POST /admin/doctors/<id>/create-account/ với username trùng → 400 error

### Receptionist create/edit/reset-password
- [ ] POST /admin/receptionist-profiles/ với dữ liệu hợp lệ → tạo account + AdminAuditLog CREATE
- [ ] POST /admin/receptionist-profiles/ với username trùng → 400 error
- [ ] POST /admin/receptionist-profiles/<id>/reset-password/ → đổi password + AdminAuditLog RESET_PASSWORD
- [ ] PATCH /admin/receptionist-profiles/<id>/ → cập nhật profile + AdminAuditLog UPDATE
- [ ] DELETE /admin/receptionist-profiles/<id>/ → xóa account + AdminAuditLog DELETE

### Appointment reschedule/status
- [ ] POST /admin/appointments/<id>/reschedule/ → cập nhật giờ + AppointmentHistory RESCHEDULE
- [ ] POST /admin/appointments/<id>/reschedule/ cho CANCELLED appointment → 400 error
- [ ] PATCH /admin/appointments/<id>/status/ → cập nhật trạng thái + AppointmentHistory
- [ ] GET /admin/appointments/<id>/history/ → trả danh sách history
- [ ] DELETE /admin/appointments/<id>/ → soft delete + AppointmentHistory DELETE

### Dashboard / Reports / Audit smoke test
- [ ] GET /admin/dashboard/ → statCards + recentAppointments + alerts (real data)
- [ ] GET /admin/reports/?period=week → labels + series + KPIs
- [ ] Revenue KPI label chứa "ước tính" (không claim là doanh thu thực)
- [ ] GET /admin/audit-logs/ → items từ bảng AdminAuditLog (không phải fake aggregate)

### Users active toggle / reset password
- [ ] POST /admin/users/ → 405 Method Not Allowed (generic create bị chặn)
- [ ] POST /admin/patient-profiles/ → 405 Method Not Allowed
- [ ] PUT /admin/patient-profiles/<id>/ → 405 Method Not Allowed
- [ ] PATCH /admin/patient-profiles/<id>/reset-password/ → 200 OK

## Milestone 2 — Profile-First Flow Refactor
- [x] **Milestone 2.1: DoctorDetailPage create mode + CatalogPage bỏ create modal**
  - `DoctorDetailPage.jsx` viết lại hoàn toàn: detect `mode=create` (path kết thúc bằng "create") → hiển thị form tạo bác sĩ
  - Form tạo: full_name, phone, specialty (select từ API listSpecialties), bio, is_active
  - Sau khi tạo thành công → navigate sang `/app/admin/catalog/doctors/:id` để xem profile
  - View mode: header với avatar/icon, name + badge, specialty, stats, info grid
  - Edit mode: inline form tương tự create (pre-fill từ profile)
  - Delete: icon Trash → confirm → PATCH is_active=false → navigate catalog
  - `DoctorDetailPage.css` viết lại hoàn toàn: header-actions (icon buttons), form-grid, responsive, error banner
  - `router.jsx`: thêm route `catalog/doctors/create` trước `catalog/doctors/:id`
  - `CatalogPage.jsx`: bỏ DoctorCreateModal, bỏ handleCreateDoctor, handleSaveDoctor, handleToggleDoctor
  - DoctorCard: icon buttons = Eye (xem chi tiết) + Pencil (sửa) + Trash (xóa) — bỏ Toggle + Liên kết tài khoản
  - Nút "Thêm bác sĩ" → navigate `/app/admin/catalog/doctors/create`
  - Bỏ createDoctor import

- [x] **Milestone 2.2: Account creation trong DoctorDetailPage**
  - View mode: nếu chưa có linked_user → hiện Badge "Chưa có tài khoản" + nút "Tạo tài khoản"
  - Nếu đã có → hiện Badge "@username", KHÔNG hiện nút tạo
  - Modal: nhập username + password → POST `/admin/doctors/:id/create-account`
  - Sau khi tạo → reload profile → Badge cập nhật sang "@username"
  - Import `createDoctorAccount` + `KeyRound` icon

- [x] **Milestone 2.3: ReceptionistDetailPage + flow tương tự doctor**
  - Tạo `ReceptionistDetailPage/` mới: create mode + view mode + edit mode
  - Create mode: form full_name + username + password + email + phone + notes + is_active → POST via createUser(role=receptionist)
  - View mode: header với avatar màu cyan (#e0f2fe), name + badge + @username, info grid (name, username, email, phone, notes)
  - Edit mode: inline form (full_name, email, phone, notes, is_active checkbox)
  - Delete: icon Trash → confirm → PATCH is_active=false → navigate catalog
  - Nút "Đặt lại mật khẩu" → modal với Input password → POST resetUserPassword
  - Router: thêm route `catalog/receptionists/create` + `catalog/receptionists/:id`
  - `CatalogPage`: ReceptionistCard → Eye + Pencil + Trash (bỏ Toggle), "Thêm lễ tân" → navigate create
  - Bỏ ReceptionistCreateModal + ReceptionistEditModal + handleCreateReceptionist + handleSaveReceptionist + handleToggleReceptionist
  - Thêm handleDeleteReceptionist

- [x] **Milestone 2.4: Cleanup UsersPage**
  - Bỏ hoàn toàn form tạo user (createForm state, handleCreate, FORM_ROLES, create user grid)
  - Bỏ edit modal (editModal state, handleSaveUser)
  - Giữ nguyên: list + search + role filter + toggle active + reset password
  - Giữ ROLE_FILTER bao gồm "doctor" để xem doctor accounts còn lại
  - Import gọn lại: bỏ createUser, Button, Input, Modal (chỉ còn dùng reset password modal)

## Milestone 2.5A — Doctor profile-first hoàn chỉnh
- [x] **Backend: Doctor model — thêm email field**
  - `backend/catalog/models.py`: thêm `email = models.CharField(max_length=254, blank=True)` vào Doctor
  - `backend/catalog/migrations/0003_doctor_email.py`: tạo migration mới (AddField email)
  - Doctor model đã đầy đủ: full_name, phone, email, specialty, bio, is_active

- [x] **Backend: DoctorSerializer — thêm email**
  - fields: thêm 'email' vào Meta.fields
  - validate_email: kiểm tra format hợp lệ nếu có giá trị
  - Email là optional, không bắt buộc

- [x] **Backend: DoctorViewSet create/update — include email**
  - create(): nhận email từ payload, lưu vào Doctor
  - update(): nhận email từ payload, lưu vào update_fields
  - Bỏ hẳn `create_account` trong cùng request (profile-first: tạo profile trước, account sau)

- [x] **Backend: get_doctor_detail — thêm email + specialty id**
  - payload trả về: email, specialty (id), specialty_name
  - Bỏ `unlinked_users` (không còn link-unlink flow)
  - Frontend có thể dùng `specialty` (id) trực tiếp cho edit, không cần map ngược

- [x] **Backend: Bỏ link_user_to_doctor + unlink_user_from_doctor**
  - Xóa 2 hàm trong `portal/services.py`
  - Xóa import trong `portal/views.py`
  - `AdminDoctorDetailAPIView`: chỉ giữ GET (bỏ POST/DELETE link-unlink)
  - Không còn endpoint nào support link/unlink flow

- [x] **Frontend: DoctorDetailPage — thêm email vào create/edit/view**
  - Create form: thêm email input, thêm is_active checkbox
  - Edit form: thêm email input
  - View mode info grid: thêm dòng email
  - startEdit: dùng `profile.specialty` (id) thay vì map ngược từ specialty_name
  - handleSaveEdit: gửi email + specialty id
  - handleCreate: gửi email + specialty id + is_active

- [x] **Frontend: adminApi + endpoints — đã verify đầy đủ**
  - `createDoctor`, `updateDoctor`, `getDoctorDetail`, `createDoctorAccount` đều tồn tại và đúng signature

## Milestone 2.5B — Receptionist detail-first đúng hướng
- [x] **Frontend: ReceptionistDetailPage — dùng createReceptionistProfile thay vì createUser**
  - Import: thay `createUser` → `createReceptionistProfile`, thêm `resetUserPassword`
  - handleCreate: gọi `createReceptionistProfile(...)` — dedicated flow
  - Redirect: sau khi tạo → navigate sang `/app/admin/catalog/receptionists/:id` (detail page)
  - Không dùng generic createUser nữa

- [x] **Frontend: ReceptionistDetailPage — bỏ dynamic import reset password**
  - `resetUserPassword` đã là static import ở top-level
  - Tạo named handler `handleResetPassword` (trước đó dùng async IIFE inline trong onClick)
  - Modal footer gọi `onClick={handleResetPassword}`

- [x] **Backend: list_receptionist_profiles — thêm username**
  - Payload trả về đầy đủ: id, username, full_name, email, phone, notes, is_active
  - Card receptionist trong CatalogPage có thể hiển thị @username đúng

- [x] **Backend: ReceptionistProfileCreateSerializer — đã đầy đủ**
  - Fields: username, password, full_name, email, phone, notes, is_active
  - role cứng là "receptionist" trong create()

## Milestone 2.5C — UsersPage cleanup + backend guard
- [x] **Frontend: UsersPage — đã sạch từ Milestone 2.4**
  - Không còn create form, không còn edit form
  - Chỉ còn: list, filter, active toggle, reset password

- [x] **Backend: UserCreateSerializer — guard chặn doctor/admin creation**
  - Bỏ `doctor` field (PrimaryKeyRelatedField)
  - Bỏ `role` khỏi writable fields
  - Bỏ `doctor` khỏi UserSerializer (read-only doctor_name vẫn OK)
  - create(): tự động set `role = "patient"`, không chấp nhận role input
  - Mục tiêu: generic `/admin/users/` endpoint không còn là shortcut tạo staff accounts

- [x] **Backend: UserUpdateSerializer — guard**
  - Bỏ `doctor` field
  - Bỏ `role` khỏi writable fields
  - Không cho phép thay đổi doctor FK hoặc role qua generic endpoint

- [x] **Backend: Xóa link_user_to_doctor + unlink_user_from_doctor**
  - services.py: 2 hàm đã xóa
  - views.py: import đã xóa
  - AdminDoctorDetailAPIView: chỉ còn GET

## Milestone 2.6 — Dashboard + Appointments API Integration
- [x] **Backend: get_dashboard_data() service**
  - portal/services.py: hàm mới, trả statCards (today counts) + recentAppointments (20 rows) + alerts
  - Alerts: lịch sắp đến chưa xác nhận, no-show hôm nay, tỷ lệ hoàn thành tuần này

- [x] **Backend: AdminDashboardAPIView**
  - portal/views.py: class mới → get_dashboard_data()
  - portal/urls.py: path('/admin/dashboard/', ...)

- [x] **Backend: AdminAppointmentViewSet**
  - appointments/views.py: class mới tại /admin/appointments/
  - GET list: trả {results, summary} với counts (total, pending, confirmed, checked_in, completed, cancelled, no_show)
  - PATCH update_status: /admin/appointments/{id}/status/ dùng set_appointment_status service
  - DELETE: soft delete (giữ nguyên hành vi cũ)
  - appointments/urls.py: router.register('admin/appointments', ...)

- [x] **Frontend: adminApi — dashboard + appointments**
  - endpoints.js: thêm adminList, adminDetail, adminStatus, dashboard
  - adminApi.js: thêm getDashboard(), listAppointments(params), updateAppointmentStatus(id, status) + named exports

- [x] **Frontend: DashboardPage — kết nối getDashboard()**
  - Bỏ STAT_CARDS + MOCK_RECENT_APPOINTMENTS mock
  - useEffect → getDashboard() → setData
  - statCards: icon theo key (pending→Clock, checked_in→UserCheck, completed→CheckCircle2...)
  - alerts: type-based badge (warning=amber, danger=red, info=blue)

- [x] **Frontend: AppointmentsPage — kết nối listAppointments + updateAppointmentStatus**
  - Bỏ MOCK_APPOINTMENTS
  - loadData(): gọi listAppointments(params) với {date, status, q}
  - doUpdateStatus(): gọi updateAppointmentStatus(id, newStatus) → reload
  - Summary bar: dùng summary từ API response
  - Debounced reload khi đổi filter (300ms)
  - Modal confirm/checkin/cancel/no-show → doUpdateStatus()

## Milestone 2.7 — Reschedule + Appointment History
- [x] **Backend: AppointmentHistory model**
  - `backend/appointments/models.py`: model mới, fields: appointment (FK), action, changed_by, changed_by_role, note, created_at
  - `backend/appointments/migrations/0005_appointment_history.py`: tự động tạo
  - `backend/appointments/admin.py`: đăng ký AppointmentHistoryAdmin (readonly)

- [x] **Backend: _record_history() + _status_to_history_action() helpers**
  - Ghi history mỗi lần thay đổi trạng thái (CONFIRM/CANCEL/CHECKIN/NO_SHOW/RESCHEDULE/COMPLETE/DELETE)
  - soft_delete_appointment ghi thêm action=DELETE

- [x] **Backend: reschedule_appointment() service**
  - Chặn CANCELLED → không cho dời
  - Cập nhật scheduled_start/end, sync blocks, ghi RESCHEDULE history với note lịch cũ → mới

- [x] **Backend: reschedule + history endpoints**
  - `POST /admin/appointments/{id}/reschedule/`
  - `GET /admin/appointments/{id}/history/`
  - `PATCH /admin/appointments/{id}/status/` — truyền thêm changed_by + changed_by_role metadata
  - `AppointmentHistorySerializer` (readonly)

- [x] **Frontend: endpoints + adminApi**
  - `adminReschedule(id)`, `adminHistory(id)` trong endpoints.js
  - `rescheduleAppointment(id, payload)`, `getAppointmentHistory(id)` + named exports

- [x] **Frontend: RescheduleModal (PENDING + CONFIRMED)**
  - Pre-fill date/time từ lịch hiện tại, tự tính scheduled_end từ visit_type (15/20/40 phút)
  - Optional textarea ghi chú
  - Nút "Đổi lịch" chỉ hiện ở PENDING / CONFIRMED

- [x] **Frontend: HistoryModal (size=lg)**
  - Load history khi mở, mỗi entry: badge action (colored), timestamp, actor + role, note
  - Scrollable list, max-height 400px, empty state

- [x] **Frontend: Detail modal — thêm nút Lịch sử**
  - Nút "Lịch sử" always visible trong detail modal footer

- [x] **Frontend: Modal size=lg support**
  - Modal component thêm prop `size`
  - CSS: `.mc-modal--lg { max-width: 620px }`

- [x] **CSS: RescheduleModal + HistoryModal**
  - `.appt-reschedule__fields/input/textarea`
  - `.appt-history__list/item/badge (success/info/danger/warning/neutral)`

- Backend check: pass | Frontend lint: pass (0 errors)

## Notes
- Mỗi lần bắt đầu task mới, phải đọc lại:
  - docs/PROJECT_BRIEF.md
  - docs/ROLES_AND_SCOPE.md
  - docs/ADMIN_MVP_PLAN.md
  - docs/PROGRESS.md
