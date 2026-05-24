# Hospital Appointment System

## 1. Giới thiệu

Hệ thống đặt lịch khám bệnh được xây dựng theo kiến trúc microservice. Hệ thống cho phép người dùng đăng ký tài khoản, xem danh sách bác sĩ, đặt lịch khám và nhận thông báo sau khi đặt lịch thành công.

## 2. Kiến trúc hệ thống

Hệ thống gồm các service:

| Service | Chức năng | Port |
|---|---|---|
| API Gateway | Cổng truy cập duy nhất cho client | 8080 |
| User Service | Quản lý người dùng | 8081 |
| Doctor Service | Quản lý bác sĩ | 8082 |
| Appointment Service | Quản lý lịch khám | 8083 |
| Notification Service | Nhận message và gửi thông báo | 8084 |
| RabbitMQ | Message broker | 5672 / 15672 |

## 3. Công nghệ sử dụng

- Node.js
- Express.js
- PostgreSQL
- RabbitMQ
- Docker
- API Gateway
- RESTful API
- Message Queue

## 4. Database

Các database sử dụng:

- user_db
- doctor_db
- appointment_db

## 5. Cách chạy hệ thống

### Chạy RabbitMQ

```bash
docker compose up -d  