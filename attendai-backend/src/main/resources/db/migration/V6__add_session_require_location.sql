-- V6__add_session_require_location.sql
-- Per-session toggle: when true, marking attendance requires the student to be
-- physically within the campus geofence (proximity / anti-proxy check).
ALTER TABLE attendance_sessions ADD COLUMN require_location BOOLEAN NOT NULL DEFAULT FALSE;
