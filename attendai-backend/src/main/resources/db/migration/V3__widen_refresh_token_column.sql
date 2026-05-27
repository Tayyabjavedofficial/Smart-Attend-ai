-- V3__widen_refresh_token_column.sql
-- Refresh tokens are HS256 JWTs whose length scales with the claims set.
-- The original VARCHAR(200) truncates real tokens (~450 chars), causing
-- "Data truncation: Data too long for column 'token'" on login.
-- Capped at 768 because the uk_refresh_token UNIQUE index has a 3072-byte
-- max key length, and utf8mb4 uses 4 bytes/char (768 * 4 = 3072).
ALTER TABLE refresh_tokens MODIFY COLUMN token VARCHAR(768) NOT NULL;
