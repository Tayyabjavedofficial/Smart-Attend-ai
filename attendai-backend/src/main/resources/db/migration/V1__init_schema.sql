-- V1__init_schema.sql
-- Initial schema for AttendAI Smart Attendance System.
-- Tables follow the SRS § 8 and the API design § 1.5 (refresh tokens).
-- All timestamps are stored in UTC.

-- ============================================================
-- USERS & ROLES
-- ============================================================

CREATE TABLE users (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    full_name       VARCHAR(120) NOT NULL,
    email           VARCHAR(150) NOT NULL,
    password_hash   VARCHAR(200) NOT NULL,
    role            VARCHAR(20)  NOT NULL,
    status          VARCHAR(30)  NOT NULL DEFAULT 'ACTIVE',
    last_login_at   DATETIME(6)  NULL,
    created_at      DATETIME(6)  NOT NULL,
    updated_at      DATETIME(6)  NOT NULL,
    CONSTRAINT uk_users_email UNIQUE (email)
);
CREATE INDEX idx_users_role   ON users (role);
CREATE INDEX idx_users_status ON users (status);

CREATE TABLE admins (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id     BIGINT NOT NULL,
    designation VARCHAR(80) NULL,
    created_at  DATETIME(6) NOT NULL,
    updated_at  DATETIME(6) NOT NULL,
    CONSTRAINT uk_admins_user_id UNIQUE (user_id),
    CONSTRAINT fk_admins_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE teachers (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id      BIGINT NOT NULL,
    employee_id  VARCHAR(50) NOT NULL,
    department   VARCHAR(80) NULL,
    designation  VARCHAR(80) NULL,
    created_at   DATETIME(6) NOT NULL,
    updated_at   DATETIME(6) NOT NULL,
    CONSTRAINT uk_teachers_user_id     UNIQUE (user_id),
    CONSTRAINT uk_teachers_employee_id UNIQUE (employee_id),
    CONSTRAINT fk_teachers_user FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE INDEX idx_teachers_department ON teachers (department);

-- ============================================================
-- SECTIONS & COURSES (created before students so FK works)
-- ============================================================

CREATE TABLE sections (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    section_name  VARCHAR(50) NOT NULL,
    semester      INT NULL,
    department    VARCHAR(80) NULL,
    created_at    DATETIME(6) NOT NULL,
    updated_at    DATETIME(6) NOT NULL
);
CREATE INDEX idx_sections_dept_sem ON sections (department, semester);

CREATE TABLE courses (
    id             BIGINT AUTO_INCREMENT PRIMARY KEY,
    course_code    VARCHAR(20)  NOT NULL,
    course_name    VARCHAR(120) NOT NULL,
    credit_hours   INT NULL,
    department     VARCHAR(80) NULL,
    created_at     DATETIME(6) NOT NULL,
    updated_at     DATETIME(6) NOT NULL,
    CONSTRAINT uk_courses_code UNIQUE (course_code)
);

CREATE TABLE students (
    id                   BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id              BIGINT NOT NULL,
    registration_number  VARCHAR(50) NOT NULL,
    department           VARCHAR(80) NULL,
    semester             INT NULL,
    section_id           BIGINT NULL,
    created_at           DATETIME(6) NOT NULL,
    updated_at           DATETIME(6) NOT NULL,
    CONSTRAINT uk_students_user_id UNIQUE (user_id),
    CONSTRAINT uk_students_reg_no  UNIQUE (registration_number),
    CONSTRAINT fk_students_user    FOREIGN KEY (user_id)    REFERENCES users(id),
    CONSTRAINT fk_students_section FOREIGN KEY (section_id) REFERENCES sections(id)
);
CREATE INDEX idx_students_section    ON students (section_id);
CREATE INDEX idx_students_department ON students (department);

-- ============================================================
-- ENROLLMENT
-- ============================================================

CREATE TABLE student_courses (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id  BIGINT NOT NULL,
    course_id   BIGINT NOT NULL,
    section_id  BIGINT NOT NULL,
    created_at  DATETIME(6) NOT NULL,
    updated_at  DATETIME(6) NOT NULL,
    CONSTRAINT uk_student_course_section UNIQUE (student_id, course_id, section_id),
    CONSTRAINT fk_sc_student FOREIGN KEY (student_id) REFERENCES students(id),
    CONSTRAINT fk_sc_course  FOREIGN KEY (course_id)  REFERENCES courses(id),
    CONSTRAINT fk_sc_section FOREIGN KEY (section_id) REFERENCES sections(id)
);
CREATE INDEX idx_sc_student ON student_courses (student_id);
CREATE INDEX idx_sc_course  ON student_courses (course_id);

CREATE TABLE teacher_courses (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    teacher_id  BIGINT NOT NULL,
    course_id   BIGINT NOT NULL,
    section_id  BIGINT NOT NULL,
    created_at  DATETIME(6) NOT NULL,
    updated_at  DATETIME(6) NOT NULL,
    CONSTRAINT uk_teacher_course_section UNIQUE (teacher_id, course_id, section_id),
    CONSTRAINT fk_tc_teacher FOREIGN KEY (teacher_id) REFERENCES teachers(id),
    CONSTRAINT fk_tc_course  FOREIGN KEY (course_id)  REFERENCES courses(id),
    CONSTRAINT fk_tc_section FOREIGN KEY (section_id) REFERENCES sections(id)
);
CREATE INDEX idx_tc_teacher ON teacher_courses (teacher_id);
CREATE INDEX idx_tc_course  ON teacher_courses (course_id);

-- ============================================================
-- ATTENDANCE SESSIONS & CHALLENGES
-- ============================================================

CREATE TABLE attendance_sessions (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    session_code        VARCHAR(40) NOT NULL,
    teacher_id          BIGINT NOT NULL,
    course_id           BIGINT NOT NULL,
    section_id          BIGINT NOT NULL,
    session_title       VARCHAR(200) NULL,
    start_time          DATETIME(6) NULL,
    end_time            DATETIME(6) NULL,
    status              VARCHAR(30) NOT NULL DEFAULT 'SCHEDULED',
    verification_mode   VARCHAR(30) NOT NULL DEFAULT 'QR_FACE_DEVICE',
    created_at          DATETIME(6) NOT NULL,
    updated_at          DATETIME(6) NOT NULL,
    CONSTRAINT uk_session_code UNIQUE (session_code),
    CONSTRAINT fk_sess_teacher FOREIGN KEY (teacher_id) REFERENCES teachers(id),
    CONSTRAINT fk_sess_course  FOREIGN KEY (course_id)  REFERENCES courses(id),
    CONSTRAINT fk_sess_section FOREIGN KEY (section_id) REFERENCES sections(id)
);
CREATE INDEX idx_sess_teacher ON attendance_sessions (teacher_id);
CREATE INDEX idx_sess_course  ON attendance_sessions (course_id);
CREATE INDEX idx_sess_status  ON attendance_sessions (status);
CREATE INDEX idx_sess_start   ON attendance_sessions (start_time);

CREATE TABLE attendance_challenges (
    id                BIGINT AUTO_INCREMENT PRIMARY KEY,
    session_id        BIGINT NOT NULL,
    challenge_code    VARCHAR(12) NOT NULL,
    qr_token          VARCHAR(100) NOT NULL,
    challenge_type    VARCHAR(20)  NOT NULL DEFAULT 'CODE_QR',
    start_time        DATETIME(6) NOT NULL,
    expiry_time       DATETIME(6) NOT NULL,
    duration_seconds  INT NOT NULL,
    status            VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at        DATETIME(6) NOT NULL,
    updated_at        DATETIME(6) NOT NULL,
    CONSTRAINT fk_chal_session FOREIGN KEY (session_id) REFERENCES attendance_sessions(id)
);
CREATE INDEX idx_chal_session ON attendance_challenges (session_id);
CREATE INDEX idx_chal_status  ON attendance_challenges (status);
CREATE INDEX idx_chal_expiry  ON attendance_challenges (expiry_time);

-- ============================================================
-- ATTENDANCE RECORDS & ATTEMPTS
-- ============================================================

CREATE TABLE attendance_records (
    id               BIGINT AUTO_INCREMENT PRIMARY KEY,
    session_id       BIGINT NOT NULL,
    challenge_id     BIGINT NOT NULL,
    student_id       BIGINT NOT NULL,
    device_id        BIGINT NULL,
    status           VARCHAR(30) NOT NULL,
    marked_at        DATETIME(6) NOT NULL,
    code_verified    BIT(1) NULL,
    qr_verified      BIT(1) NULL,
    face_verified    BIT(1) NULL,
    device_verified  BIT(1) NULL,
    face_confidence  DOUBLE NULL,
    risk_score       INT NULL,
    remarks          VARCHAR(500) NULL,
    created_at       DATETIME(6) NOT NULL,
    updated_at       DATETIME(6) NOT NULL,
    CONSTRAINT uk_record_challenge_student UNIQUE (challenge_id, student_id),
    CONSTRAINT fk_rec_session   FOREIGN KEY (session_id)   REFERENCES attendance_sessions(id),
    CONSTRAINT fk_rec_challenge FOREIGN KEY (challenge_id) REFERENCES attendance_challenges(id),
    CONSTRAINT fk_rec_student   FOREIGN KEY (student_id)   REFERENCES students(id)
);
CREATE INDEX idx_rec_session    ON attendance_records (session_id);
CREATE INDEX idx_rec_student    ON attendance_records (student_id);
CREATE INDEX idx_rec_marked_at  ON attendance_records (marked_at);
CREATE INDEX idx_rec_status     ON attendance_records (status);

CREATE TABLE attendance_attempts (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    challenge_id        BIGINT NOT NULL,
    student_id          BIGINT NOT NULL,
    device_id           BIGINT NULL,
    attempted_at        DATETIME(6) NOT NULL,
    submitted_code      VARCHAR(12) NULL,
    submitted_qr_token  VARCHAR(100) NULL,
    face_confidence     DOUBLE NULL,
    result              VARCHAR(30) NOT NULL,
    failure_reason      VARCHAR(200) NULL,
    risk_score          INT NULL,
    ip_address          VARCHAR(45) NULL,
    user_agent          VARCHAR(300) NULL,
    created_at          DATETIME(6) NOT NULL,
    updated_at          DATETIME(6) NOT NULL,
    CONSTRAINT fk_att_challenge FOREIGN KEY (challenge_id) REFERENCES attendance_challenges(id),
    CONSTRAINT fk_att_student   FOREIGN KEY (student_id)   REFERENCES students(id)
);
CREATE INDEX idx_att_challenge    ON attendance_attempts (challenge_id);
CREATE INDEX idx_att_student      ON attendance_attempts (student_id);
CREATE INDEX idx_att_result       ON attendance_attempts (result);
CREATE INDEX idx_att_attempted_at ON attendance_attempts (attempted_at);

-- ============================================================
-- SECURITY: FACE PROFILES, TRUSTED DEVICES, PROXY ALERTS, REFRESH TOKENS
-- ============================================================

CREATE TABLE face_profiles (
    id                   BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id           BIGINT NOT NULL,
    face_embedding_path  VARCHAR(300) NULL,
    image_path           VARCHAR(300) NULL,
    embedding_quality    DOUBLE NULL,
    status               VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at           DATETIME(6) NOT NULL,
    updated_at           DATETIME(6) NOT NULL,
    CONSTRAINT uk_face_student UNIQUE (student_id),
    CONSTRAINT fk_face_student FOREIGN KEY (student_id) REFERENCES students(id)
);

CREATE TABLE trusted_devices (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id    BIGINT NOT NULL,
    device_token  VARCHAR(100) NOT NULL,
    device_name   VARCHAR(120) NULL,
    browser_info  VARCHAR(300) NULL,
    ip_address    VARCHAR(45) NULL,
    trusted       BIT(1) NOT NULL DEFAULT b'1',
    blocked       BIT(1) NOT NULL DEFAULT b'0',
    last_used_at  DATETIME(6) NULL,
    created_at    DATETIME(6) NOT NULL,
    updated_at    DATETIME(6) NOT NULL,
    CONSTRAINT uk_device_token UNIQUE (device_token),
    CONSTRAINT fk_device_student FOREIGN KEY (student_id) REFERENCES students(id)
);
CREATE INDEX idx_device_student ON trusted_devices (student_id);
CREATE INDEX idx_device_token   ON trusted_devices (device_token);

CREATE TABLE proxy_alerts (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id      BIGINT NOT NULL,
    session_id      BIGINT NULL,
    challenge_id    BIGINT NULL,
    alert_type      VARCHAR(60) NULL,
    severity        VARCHAR(20) NOT NULL,
    description     VARCHAR(500) NULL,
    risk_score      INT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    resolution_note VARCHAR(500) NULL,
    created_at      DATETIME(6) NOT NULL,
    updated_at      DATETIME(6) NOT NULL,
    CONSTRAINT fk_alert_student FOREIGN KEY (student_id) REFERENCES students(id)
);
CREATE INDEX idx_alert_student  ON proxy_alerts (student_id);
CREATE INDEX idx_alert_session  ON proxy_alerts (session_id);
CREATE INDEX idx_alert_severity ON proxy_alerts (severity);
CREATE INDEX idx_alert_status   ON proxy_alerts (status);

CREATE TABLE refresh_tokens (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id     BIGINT NOT NULL,
    token       VARCHAR(200) NOT NULL,
    expires_at  DATETIME(6) NOT NULL,
    revoked     BIT(1) NOT NULL DEFAULT b'0',
    created_at  DATETIME(6) NOT NULL,
    updated_at  DATETIME(6) NOT NULL,
    CONSTRAINT uk_refresh_token UNIQUE (token),
    CONSTRAINT fk_refresh_user FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE INDEX idx_refresh_user ON refresh_tokens (user_id);
