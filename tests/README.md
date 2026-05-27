# Test Scripts

Chạy các test này sau khi đã `docker compose up -d --build` ở root project.

## REST smoke test

```powershell
node tests/rest-smoke.mjs
```

Test này kiểm tra các endpoint đọc cơ bản qua API Gateway:

- `GET /`
- `GET /doctors`
- `GET /appointments`
- `GET /notifications/logs`

## Message queue flow test

```powershell
node tests/mq-flow.mjs
```

Test này sẽ:

1. Tạo một appointment mới qua API Gateway.
2. Chờ notification-service consume message từ RabbitMQ.
3. Kiểm tra record đã được lưu vào bảng `notification_logs`.

## Tuỳ chỉnh

Bạn có thể override biến môi trường khi chạy:

```powershell
$env:BASE_URL="http://localhost:8080"
$env:NOTIFICATION_URL="http://localhost:8084"
$env:DOCTOR_ID="1"
$env:PATIENT_ID="999"
$env:APPOINTMENT_DATE="2026-05-30"
$env:APPOINTMENT_TIME="10:15"
node tests/mq-flow.mjs
```