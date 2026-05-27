-- V2__seed_default_admin.sql
-- Seeds a single admin user so the system is usable on first boot.
--
-- Default credentials (CHANGE IMMEDIATELY in production):
--   email:    admin@attendai.local
--   password: Admin@12345
--
-- The hash below is a BCrypt hash of "Admin@12345" at strength 12.

INSERT INTO users (full_name, email, password_hash, role, status, created_at, updated_at)
VALUES (
    'System Administrator',
    'admin@attendai.local',
    '$2b$12$yniEbNZQrihb7394AWNKTuM.N72cLWe924juzOHcT9nd6rI72HRVy',
    'ADMIN',
    'ACTIVE',
    CURRENT_TIMESTAMP(6),
    CURRENT_TIMESTAMP(6)
);

INSERT INTO admins (user_id, designation, created_at, updated_at)
SELECT id, 'Super Admin', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)
FROM users WHERE email = 'admin@attendai.local';
