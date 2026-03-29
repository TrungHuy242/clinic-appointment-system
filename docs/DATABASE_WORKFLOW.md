# DATABASE WORKFLOW

## 1. Mục đích
Tài liệu này mô tả cách làm việc với cơ sở dữ liệu trong project để cả nhóm có thể đồng bộ với code mà không phải gửi file backup `.sql` thủ công mỗi lần.

## 2. Nguyên tắc cốt lõi
- GitHub chỉ đồng bộ code, không đồng bộ database thật.
- Cấu trúc database được đồng bộ bằng Django migrations.
- Dữ liệu mẫu được đồng bộ bằng seed script hoặc fixtures.
- Mỗi thành viên nên dùng PostgreSQL local riêng.
- Không dùng cách backup `.sql` hằng ngày để share cho nhau.

## 3. Cách làm đúng cho team

### 3.1 Đồng bộ schema bằng migration
Schema gồm:
- bảng
- cột
- khóa ngoại
- ràng buộc dữ liệu

Schema phải đi cùng:
- `models.py`
- thư mục `migrations/`

Lệnh sử dụng:

python manage.py makemigrations
python manage.py migrate

Ý nghĩa:
- `makemigrations`: sinh file migration khi model thay đổi
- `migrate`: áp migration vào database local

### 3.2 Đồng bộ dữ liệu mẫu bằng seed
Dữ liệu mẫu gồm:
- khoa
- bác sĩ
- loại khám
- tài khoản admin
- tài khoản doctor
- tài khoản staff
- bệnh nhân mẫu
- lịch hẹn mẫu

Có thể dùng 1 trong 2 cách:
- custom management command, ví dụ `seed_data.py`
- fixture JSON

Ưu tiên:
- dùng custom seed command vì dễ chủ động và dễ bảo trì hơn

Lệnh ví dụ:

python manage.py seed_data

## 4. Mô hình làm việc khuyến nghị
Mỗi thành viên có:
- PostgreSQL local riêng
- file `.env` riêng
- database riêng trên máy mình

Ví dụ:
- `clinic_huy`
- `clinic_bac`
- `clinic_ngan`

hoặc cùng tên `clinic_db` nhưng trên máy riêng của mỗi người.

Lợi ích:
- không đạp dữ liệu của nhau
- không cần gửi file `.sql`
- pull code về là chỉ cần migrate và seed
- dễ test và rollback hơn

## 5. Biến môi trường database
Mỗi người tự có file `.env` riêng.

Ví dụ `.env`:

DB_NAME=clinic_db
DB_USER=postgres
DB_PASSWORD=123456
DB_HOST=localhost
DB_PORT=5432

Repo chỉ nên push file mẫu `.env.example`.

Ví dụ `.env.example`:

DB_NAME=clinic_db
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432

Không push:
- `.env`
- file backup `.sql`
- thông tin database thật

## 6. Quy trình khi một người mới clone project

### Bước 1: clone code
git clone <repository-url>

### Bước 2: tạo database local
Ví dụ trong PostgreSQL tạo database:
- clinic_db

### Bước 3: tạo file `.env`
Điền thông tin kết nối database local của mình.

### Bước 4: chạy migration
python manage.py migrate

### Bước 5: chạy seed data
python manage.py seed_data

### Bước 6: chạy project
python manage.py runserver

Kết quả:
- ai cũng có cấu trúc database giống nhau
- ai cũng có bộ dữ liệu nền để test

## 7. Quy trình khi thay đổi model

Ví dụ:
- thêm field mới
- sửa kiểu dữ liệu
- thêm model mới
- thêm quan hệ foreign key

Người sửa model phải làm:

### Bước 1
Cập nhật `models.py`

### Bước 2
Chạy:
python manage.py makemigrations

### Bước 3
Chạy:
python manage.py migrate

### Bước 4
Kiểm tra local có chạy ổn không

### Bước 5
Commit luôn cả:
- file model đã sửa
- file migration mới sinh ra

### Bước 6
Push lên GitHub

Người khác pull về chỉ cần chạy:
python manage.py migrate

Nếu dữ liệu mẫu thay đổi thì chạy thêm:
python manage.py seed_data

## 8. Quy trình khi thay đổi dữ liệu mẫu
Nếu thêm:
- khoa mới
- bác sĩ mới
- loại khám mới
- tài khoản mẫu mới

Thì không nên backup database rồi gửi file `.sql`.

Thay vào đó:
- cập nhật seed script
hoặc
- cập nhật fixture JSON

Sau đó commit và push lên GitHub.

Người khác pull về chạy lại:
python manage.py seed_data

## 9. Khi nào mới dùng file `.sql`
Chỉ nên dùng backup `.sql` trong các trường hợp:
- backup cuối kỳ
- nộp sản phẩm
- chuyển dữ liệu sang server demo
- sao lưu dự phòng

Không nên dùng `.sql` cho quy trình teamwork hằng ngày.

## 10. Cấu trúc đề xuất trong backend

backend/
├── config/
├── catalog/
├── appointments/
├── portal/
├── common/
│   └── management/
│       └── commands/
│           └── seed_data.py
├── .env.example
└── requirements.txt

## 11. File `.gitignore` nên có
Nên thêm các dòng sau:

.env
*.sql
__pycache__/
venv/
node_modules/
dist/

Nếu có file build hoặc file tạm khác thì thêm tiếp theo nhu cầu project.

## 12. Workflow chuẩn hằng ngày cho cả team

### Khi pull code mới
1. pull code từ GitHub
2. chạy migration
3. chạy seed nếu cần
4. chạy project để test

### Khi sửa model
1. sửa model
2. makemigrations
3. migrate
4. commit migration
5. push

### Khi sửa dữ liệu mẫu
1. sửa seed script
2. test seed local
3. commit
4. push

## 13. Kết luận
Workflow database đúng cho project này là:

- đồng bộ code qua GitHub
- đồng bộ schema qua migrations
- đồng bộ dữ liệu mẫu qua seed script hoặc fixtures
- mỗi người dùng PostgreSQL local riêng

Cách này giúp:
- tránh lệch cấu trúc database
- tránh phụ thuộc vào file `.sql` thủ công
- teamwork dễ hơn
- giảm lỗi khi tích hợp code giữa 5 ngườisssd