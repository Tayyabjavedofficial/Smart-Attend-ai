-- V3__widen_refresh_token_column.sql
-- Refresh tokens are HS256 JWTs whose length scales with the claims set.
-- The original VARCHAR(200) truncates real tokens (~450 chars), causing
-- "Data truncation: Data too long for column 'token'" on login.
ALTER TABLE refresh_tokens MODIFY COLUMN token VARCHAR(1024) NOT NULL;
