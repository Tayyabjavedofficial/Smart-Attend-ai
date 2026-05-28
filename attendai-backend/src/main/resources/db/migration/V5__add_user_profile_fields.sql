-- V5__add_user_profile_fields.sql
-- Self-service profile additions: a free-text bio and an avatar stored as a
-- base64 data URL (MEDIUMTEXT holds up to 16MB; client compresses to well
-- under that). Kept on the users row so every role gets them uniformly.
ALTER TABLE users ADD COLUMN bio TEXT NULL;
ALTER TABLE users ADD COLUMN avatar MEDIUMTEXT NULL;
