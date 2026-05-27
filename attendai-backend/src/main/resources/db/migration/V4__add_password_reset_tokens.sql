-- V4__add_password_reset_tokens.sql
-- One-time tokens emailed to users who request a password reset.
-- token_hash stores the SHA-256 of the raw token (we never store the raw
-- value at rest; the raw token only exists in the email).
CREATE TABLE password_reset_tokens (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id      BIGINT       NOT NULL,
    token_hash   VARCHAR(64)  NOT NULL,
    expires_at   DATETIME(6)  NOT NULL,
    used_at      DATETIME(6)  NULL,
    created_at   DATETIME(6)  NOT NULL,
    updated_at   DATETIME(6)  NOT NULL,
    CONSTRAINT fk_prt_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT uk_prt_token_hash UNIQUE (token_hash)
);
CREATE INDEX idx_prt_user ON password_reset_tokens (user_id);
