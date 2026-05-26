# Hospital Appointment System (Hệ thống Đặt lịch Khám Bệnh)

## 1. Mô tả Bài toán

### Vấn đề
Hiện tại, các bệnh viện gặp khó khăn trong việc quản lý và sắp xếp lịch khám của bác sĩ. Bệnh nhân phải ghi danh trực tiếp, chờ đợi lâu, và không có thông báo tự động về lịch hẹn của mình.

### Giải pháp
Xây dựng một hệ thống đặt lịch khám bệnh trực tuyến sử dụng kiến trúc microservice, cho phép:
- **Người dùng**: Đăng ký tài khoản, xem danh sách bác sĩ, đặt lịch khám trực tuyến
- **Bệnh viện**: Quản lý danh sách bác sĩ, lịch khám, phân bổ bệnh nhân
- **Thông báo tự động**: Gửi xác nhận lịch hẹn sau khi đặt lịch thành công

### Mục tiêu
- Giảm tải công việc quản lý lịch khám thủ công
- Cải thiện trải nghiệm bệnh nhân
- Tăng hiệu quả sử dụng thời gian bác sĩ
- Hỗ trợ mở rộng quy mô hệ thống

---

## 2. Kiến trúc Hệ thống

### 2.1 Tổng quan
Hệ thống sử dụng **kiến trúc Microservice** với các thành phần sau:

```
┌─────────────────────────────────────────────┐
│            Client Application               │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
         ┌─────────────────────┐
         │    API Gateway      │ (Port 8080)
         │  (Single Entry)     │
         └──┬──┬──┬────────────┘
            │  │  │
    ┌───────┘  │  └───────┐
    │          │          │
    ▼          ▼          ▼
┌────────┐ ┌────────┐ ┌─────────────────┐
│ User   │ │Doctor  │ │ Appointment     │
│Service │ │Service │ │ Service         │
│(8081)  │ │(8082)  │ │ (8083)          │
└────────┘ └────────┘ └────────┬────────┘
    │          │               │
    │          │         ┌─────┴─────┐
    └──────────┴─────────┤           │
                         ▼           ▼
                    ┌─────────────────────┐
                    │  PostgreSQL (5432)  │
                    │  3 Databases        │
                    └─────────────────────┘
                    
                    ┌─────────────────────┐
                    │ RabbitMQ (5672)     │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ Notification Service│
                    │     (8084)          │
                    └─────────────────────┘
```

### 2.2 Công nghệ sử dụng
- Node.js
- Express.js
- PostgreSQL
- RabbitMQ
- Docker
- API Gateway
- RESTful API
- Message Queue


### 2.3 Danh sách các Service

| Service | Chức năng | Port | Database |
|---------|----------|------|----------|
| **User Service** | Đăng ký, đăng nhập, quản lý thông tin người dùng | 8081 | user_db |
| **Doctor Service** | Quản lý bác sĩ, chuyên khoa, lịch làm việc | 8082 | doctor_db |
| **Appointment Service** | Đặt lịch khám, hủy, cập nhật trạng thái | 8083 | appointment_db |
| **Notification Service** | Gửi thông báo lịch khám (async via RabbitMQ) | 8084 | - |

### 2.4 Định tuyến
- `/users/*` → User Service (8081)
- `/doctors/*` → Doctor Service (8082)
- `/appointments/*` → Appointment Service (8083)
- `/notifications/*` → Notification Service (8084)

---

## 3. Mô tả các Microservice

### 3.1 User Service (8081)
**Vai trò**: Quản lý thông tin người dùng

**Chức năng chính**:
- Đăng ký người dùng mới
- Đăng nhập, xác thực bằng JWT
- Lấy danh sách người dùng
- Lấy chi tiết người dùng (theo ID)
- Cập nhật thông tin người dùng
- Xóa người dùng

**Database Schema**:
```sql
users (user_db)
├── id (INT, PRIMARY KEY)
├── full_name (VARCHAR 100)
├── email (VARCHAR 100, UNIQUE)
├── password (VARCHAR 255, hashed)
├── phone (VARCHAR 20)
├── role (VARCHAR 20, DEFAULT: 'PATIENT')
└── created_at (TIMESTAMP)
```

**Công nghệ**: Node.js, Express.js, PostgreSQL, bcryptjs, JWT

---

### 3.2 Doctor Service (8082)
**Vai trò**: Quản lý thông tin bác sĩ và lịch làm việc

**Chức năng chính**:
- Tạo bác sĩ mới
- Lấy danh sách bác sĩ
- Lấy chi tiết bác sĩ (theo ID, kèm lịch làm việc)
- Cập nhật thông tin bác sĩ
- Xóa bác sĩ (và lịch làm việc)
- Quản lý lịch làm việc bác sĩ

**Database Schema**:
```sql
doctors (doctor_db)
├── id (INT, PRIMARY KEY)
├── name (VARCHAR 100)
├── specialization (VARCHAR 100)
├── phone (VARCHAR 20)
├── email (VARCHAR 100)
├── room (VARCHAR 50)
├── description (TEXT)
└── created_at (TIMESTAMP)

doctor_schedules (doctor_db)
├── id (INT, PRIMARY KEY)
├── doctor_id (INT, FOREIGN KEY)
├── work_date (DATE)
├── start_time (TIME)
├── end_time (TIME)
├── max_patients (INT, DEFAULT: 10)
└── created_at (TIMESTAMP)
```

**Dữ liệu mẫu**: 5 bác sĩ (Tim mạch, Da liễu, Thần kinh, Nhi, Cơ xương khớp)

**Công nghệ**: Node.js, Express.js, PostgreSQL

---

### 3.3 Appointment Service (8083)
**Vai trò**: Quản lý lịch khám bệnh

**Chức năng chính**:
- Đặt lịch khám
- Lấy danh sách tất cả lịch khám
- Lấy chi tiết lịch khám
- Lấy lịch khám theo bệnh nhân 
- Lấy lịch khám theo bác sĩ
- Cập nhật trạng thái lịch khám (CONFIRMED, CANCELLED, COMPLETED)
- Xóa lịch khám
- **Phát hành message RabbitMQ** khi lịch khám được tạo

**Database Schema**:
```sql
appointments (appointment_db)
├── id (INT, PRIMARY KEY)
├── patient_id (INT)
├── doctor_id (INT)
├── appointment_date (DATE)
├── appointment_time (TIME)
├── reason (TEXT)
├── status (VARCHAR 20, DEFAULT: 'CONFIRMED')
├── created_at (TIMESTAMP)
└── UNIQUE (doctor_id, appointment_date, appointment_time) -- Tránh trùng lặp
```

**Luồng đặt lịch**:
1. Client gửi request đặt lịch → Appointment Service
2. Service kiểm tra bác sĩ (gọi Doctor Service)
3. Nếu hợp lệ → Lưu vào database
4. **Phát hành message** `appointment.created` tới RabbitMQ
5. Notification Service nhận message → Gửi thông báo

**Công nghệ**: Node.js, Express.js, PostgreSQL, amqplib (RabbitMQ)

---

### 3.4 Notification Service (8084)
**Vai trò**: Gửi thông báo về lịch khám (dựa trên message queue)

**Chức năng chính**:
- Lắng nghe message từ RabbitMQ (appointment.created.queue)
- Xử lý thông báo
- Cập nhật trạng thái thông báo

**Cơ chế hoạt động**:
- Kết nối tới RabbitMQ khi khởi động
- Đăng ký lắng nghe queue: `appointment.created.queue`
- Khi Appointment Service tạo appointment → Phát message
- Notification Service nhận → Xử lý gửi thông báo

**Công nghệ**: Node.js, Express.js, amqplib (RabbitMQ)

---

## 4. Thiết kế RESTful API

### 4.1 Cơ bản
- **Base URL**: `http://localhost:8080`
- **Định dạng Response**: JSON

### 4.2 API User Service

| Phương thức | Endpoint | Mô tả |
|-------------|----------|-------|
| POST | `/users/register` | Đăng ký người dùng mới |
| POST | `/users/login` | Đăng nhập |
| GET | `/users/` | Lấy danh sách tất cả người dùng |
| GET | `/users/:id` | Lấy thông tin người dùng theo ID |
| PUT | `/users/:id` | Cập nhật thông tin người dùng |
| DELETE | `/users/:id` | Xóa người dùng |

**Ví dụ Request**:
```bash
# Đăng ký
POST http://localhost:8080/users/register
{
  "full_name": "Nguyễn Văn A",
  "email": "nguyenvana@gmail.com",
  "password": "password123",
  "phone": "0912345678"
}

# Đăng nhập
POST http://localhost:8080/users/login
{
  "email": "nguyenvana@gmail.com",
  "password": "password123"
}
```

---

### 4.3 API Doctor Service

| Phương thức | Endpoint | Mô tả |
|-------------|----------|-------|
| POST | `/doctors/` | Tạo bác sĩ mới |
| GET | `/doctors/` | Lấy danh sách tất cả bác sĩ |
| GET | `/doctors/:id` | Lấy thông tin bác sĩ (kèm lịch làm việc) |
| PUT | `/doctors/:id` | Cập nhật thông tin bác sĩ |
| DELETE | `/doctors/:id` | Xóa bác sĩ |

**Ví dụ Request**:
```bash
# Lấy danh sách bác sĩ
GET http://localhost:8080/doctors/

# Lấy chi tiết bác sĩ
GET http://localhost:8080/doctors/1
```

---

### 4.4 API Appointment Service

| Phương thức | Endpoint | Mô tả |
|-------------|----------|-------|
| POST | `/appointments/` | Đặt lịch khám mới |
| GET | `/appointments/` | Lấy danh sách tất cả lịch khám |
| GET | `/appointments/:id` | Lấy chi tiết lịch khám |
| GET | `/appointments/patient/:patientId` | Lấy lịch khám của bệnh nhân |
| GET | `/appointments/doctor/:doctorId` | Lấy lịch khám của bác sĩ |
| PUT | `/appointments/:id/status` | Cập nhật trạng thái lịch khám |
| DELETE | `/appointments/:id` | Hủy lịch khám |

**Ví dụ Request**:
```bash
# Đặt lịch khám
POST http://localhost:8080/appointments/
{
  "patient_id": 1,
  "doctor_id": 1,
  "appointment_date": "2026-05-30",
  "appointment_time": "09:00",
  "reason": "Kiểm tra sức khỏe định kỳ"
}

# Cập nhật trạng thái
PUT http://localhost:8080/appointments/1/status
{
  "status": "CANCELLED"
}
```

---

### 4.5 API Notification Service

| Phương thức | Endpoint | Mô tả |
|-------------|----------|-------|
| GET | `/notifications/` | Lấy danh sách thông báo |

---

## 5. Luồng Message Queue

### 5.1 Kiến trúc Message Queue

```
┌──────────────────────────────────────────────────┐
│          Appointment Service                     │
│  (Khi user tạo appointment mới)                  │
└────────────────────┬─────────────────────────────┘
                     │
                     │ publishAppointmentCreated()
                     │ (message: {id, patient_id, doctor_id, ...})
                     │
                     ▼
        ┌────────────────────────────┐
        │      RabbitMQ Broker       │
        │                            │
        │ Queue:                     │
        │ appointment.created.queue  │
        └────────────────┬───────────┘
                         │
                         │ Consume message
                         │
                         ▼
        ┌────────────────────────────┐
        │  Notification Service      │
        │  (Lắng nghe queue)         │
        │  Gửi thông báo             │
        └────────────────────────────┘
```

### 5.2 Chi tiết Luồng

**Bước 1**: User đặt lịch khám
```
POST http://localhost:8080/appointments/
```

**Bước 2**: Appointment Service lưu vào database
```
INSERT INTO appointments (...) VALUES (...)
```

**Bước 3**: Appointment Service phát hành message
```javascript
publishAppointmentCreated({
  id: 1,
  patient_id: 1,
  doctor_id: 1,
  appointment_date: "2026-05-30",
  appointment_time: "09:00",
  reason: "Kiểm tra sức khỏe định kỳ"
})
```

**Bước 4**: Message được đưa vào queue `appointment.created.queue`

**Bước 5**: Notification Service lắng nghe queue
```javascript
channel.consume('appointment.created.queue', (msg) => {
  // Xử lý message
  console.log("Appointment created:", msg)
  // Gửi thông báo (email, SMS, push notification, etc.)
})
```

### 5.3 Lợi ích của Message Queue

- Services độc lập với nhau
- Notification Service xử lý độc lập, không chặn Appointment Service
- Message được lưu trữ an toàn, đảm bảo không mất
- Dễ dàng thêm nhiều Notification Service nếu tải tăng

---

## 6. Thử nghiệm và Đánh giá

### 6.1 Yêu cầu Hệ thống

- **Node.js**: v20 trở lên
- **Docker & Docker Compose**: v2 trở lên
- **PostgreSQL**: v16
- **RabbitMQ**: v3-management
- **RAM**: Tối thiểu 2GB
- **Disk**: Tối thiểu 500MB

### 6.2 Cách Chạy Hệ thống

#### Bước 1: Clone repository
```bash
git clone https://github.com/DCThang293/hospital_appointment_system.git
cd hospital_appointment_system
```

#### Bước 2: Chạy tất cả service bằng Docker Compose
```bash
docker compose up -d
```


#### Bước 3: Kiểm tra các service đã chạy
```bash
# Xem danh sách container
docker compose ps

# Xem log từ tất cả services
docker compose logs -f
```

#### Bước 4: Truy cập hệ thống
- **API Gateway**: http://localhost:8080
- **RabbitMQ Management UI**: http://localhost:15672 (user: guest, pass: guest)

### 6.3 Thử nghiệm API - Luồng Hoàn chỉnh

#### Test 1: Đăng ký người dùng
```bash
curl -X POST http://localhost:8080/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Nguyễn Văn A",
    "email": "nguyenvana@gmail.com",
    "password": "password123",
    "phone": "0912345678"
  }'
```

**Kết quả mong muốn**: User được tạo, trả về thông tin người dùng

---

#### Test 2: Đăng nhập
```bash
curl -X POST http://localhost:8080/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nguyenvana@gmail.com",
    "password": "password123"
  }'
```

**Kết quả mong muốn**: Trả về JWT token

---

#### Test 3: Lấy danh sách bác sĩ
```bash
curl -X GET http://localhost:8080/doctors/
```

**Kết quả mong muốn**: Danh sách 5 bác sĩ mẫu

---

#### Test 4: Lấy chi tiết bác sĩ
```bash
curl -X GET http://localhost:8080/doctors/1
```

**Kết quả mong muốn**: Thông tin bác sĩ chi tiết

---

#### Test 5: Đặt lịch khám (kiểm tra Message Queue)
```bash
curl -X POST http://localhost:8080/appointments/ \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": 1,
    "doctorId": 1,
    "appointmentDate": "2026-05-30",
    "appointmentTime": "09:00",
    "reason": "Kiểm tra sức khỏe định kỳ"
  }'
```

**Kết quả mong muốn**:
1. Appointment được tạo với status "CONFIRMED"
2. Trong log Appointment Service: "Published message to RabbitMQ"
3. Trong log Notification Service: Message được nhận và xử lý

---

#### Test 6: Lấy lịch khám của bệnh nhân
```bash
curl -X GET http://localhost:8080/appointments/patient/1
```

**Kết quả mong muốn**: Danh sách lịch khám của bệnh nhân (ID: 1)

---

#### Test 7: Cập nhật trạng thái lịch khám
```bash
curl -X PUT http://localhost:8080/appointments/1/status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "CANCELLED"
  }'
```

**Kết quả mong muốn**: Status lịch khám thay đổi thành "CANCELLED"

---

### 6.4 Kiểm tra RabbitMQ Message Flow

1. Truy cập RabbitMQ Management UI: http://localhost:15672
2. Đăng nhập: guest / guest
3. Vào tab **Queues and Streams**
4. Kiểm tra queue `appointment.created.queue`
5. Tạo appointment mới → Message sẽ xuất hiện trong queue
6. Notification Service sẽ consume message ngay lập tức

---

### 6.5 Dừng Hệ thống

```bash
# Dừng tất cả container
docker compose down

# Dừng và xóa volume (nếu muốn reset database)
docker compose down -v
```

---

### 6.6 Ghi Log Để Debugging

```bash
# Xem log từ service cụ thể
docker compose logs -f user-service
docker compose logs -f appointment-service
docker compose logs -f notification-service

# Xem log real-time (tất cả services)
docker compose logs -f
```

---

### 6.7 Đánh giá Hiệu suất

#### Điểm mạnh
- Dễ mở rộng từng service độc lập
- Notification không chặn flow đặt lịch
- Mỗi service có database riêng, không ảnh hưởng lẫn nhau
- Docker Compose đơn giản
- Dễ thêm service mới (Payment, Review, etc.)

#### Cần Cải Thiện
- Chưa có authentication/authorization giữa services
- Chưa có rate limiting
- Chưa có caching (Redis)
- Chưa có monitoring/metrics (Prometheus, Grafana)
- Chưa có API documentation (Swagger/OpenAPI)

---

### 6.8 Kết luận

Hệ thống **Hospital Appointment System** đã hoàn thiện với:
- 5 microservices hoạt động độc lập
- PostgreSQL cho persistent data
- RabbitMQ cho async communication
- Docker Compose cho dễ deployment

Hệ thống đủ sức phục vụ nhu cầu cơ bản của bệnh viện vừa và nhỏ. Trong tương lai có thể mở rộng thêm tính năng authentication, caching, monitoring, analytics.  