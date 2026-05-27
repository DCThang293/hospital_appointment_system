CREATE DATABASE user_db;
CREATE DATABASE doctor_db;
CREATE DATABASE appointment_db;
CREATE DATABASE notification_db;

\c user_db;

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) DEFAULT 'PATIENT',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

\c doctor_db;

CREATE TABLE IF NOT EXISTS doctors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    specialization VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    room VARCHAR(50),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS doctor_schedules (
    id SERIAL PRIMARY KEY,
    doctor_id INTEGER NOT NULL,
    work_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    max_patients INTEGER DEFAULT 10,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_doctor
        FOREIGN KEY (doctor_id)
        REFERENCES doctors(id)
        ON DELETE CASCADE
);

INSERT INTO doctors 
(name, specialization, phone, email, room, description)
VALUES
('Dr. Nguyen Van An', 'Cardiology', '0901000001', 'an.cardio@hospital.com', 'A101', 'Bác sĩ chuyên khoa tim mạch'),
('Dr. Tran Thi Binh', 'Dermatology', '0901000002', 'binh.derma@hospital.com', 'A102', 'Bác sĩ chuyên khoa da liễu'),
('Dr. Le Minh Cuong', 'Neurology', '0901000003', 'cuong.neuro@hospital.com', 'A103', 'Bác sĩ chuyên khoa thần kinh'),
('Dr. Pham Thu Dung', 'Pediatrics', '0901000004', 'dung.pedia@hospital.com', 'A104', 'Bác sĩ chuyên khoa nhi'),
('Dr. Hoang Quoc Huy', 'Orthopedics', '0901000005', 'huy.ortho@hospital.com', 'A105', 'Bác sĩ chuyên khoa cơ xương khớp')
ON CONFLICT DO NOTHING;

INSERT INTO doctor_schedules
(doctor_id, work_date, start_time, end_time, max_patients)
VALUES
(1, '2026-05-30', '08:00', '11:00', 10),
(1, '2026-05-31', '13:00', '17:00', 12),
(2, '2026-05-30', '08:00', '11:00', 10),
(2, '2026-05-31', '13:00', '17:00', 12),
(3, '2026-05-30', '08:00', '11:00', 10),
(3, '2026-05-31', '13:00', '17:00', 12)
ON CONFLICT DO NOTHING;

\c appointment_db;

CREATE TABLE IF NOT EXISTS appointments (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL,
    doctor_id INTEGER NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    reason TEXT,
    status VARCHAR(20) DEFAULT 'CONFIRMED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'unique_doctor_time'
    ) THEN
        ALTER TABLE appointments
        ADD CONSTRAINT unique_doctor_time
        UNIQUE (doctor_id, appointment_date, appointment_time);
    END IF;
END $$;

\c notification_db;

CREATE TABLE IF NOT EXISTS notification_logs (
    id SERIAL PRIMARY KEY,
    event_id UUID,
    event_type VARCHAR(100) NOT NULL,
    source VARCHAR(100) NOT NULL,
    payload JSONB,
    status VARCHAR(20) NOT NULL,
    error_message TEXT,
    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);