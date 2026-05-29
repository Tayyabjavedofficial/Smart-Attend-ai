-- V7__add_announcements.sql
-- Campus-wide announcements posted by admins/teachers and read by everyone.
-- `audience` scopes who sees a post (ALL / STUDENTS / TEACHERS). The author's
-- name and role are denormalised so the feed renders without an extra join.
CREATE TABLE announcements (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    title        VARCHAR(160) NOT NULL,
    body         TEXT NOT NULL,
    audience     VARCHAR(20)  NOT NULL DEFAULT 'ALL',
    pinned       BOOLEAN      NOT NULL DEFAULT FALSE,
    author_id    BIGINT       NOT NULL,
    author_name  VARCHAR(120) NOT NULL,
    author_role  VARCHAR(20)  NOT NULL,
    created_at   DATETIME(6)  NOT NULL,
    updated_at   DATETIME(6)  NOT NULL,
    CONSTRAINT fk_announcements_author FOREIGN KEY (author_id) REFERENCES users(id)
);
CREATE INDEX idx_announcements_audience ON announcements (audience);
CREATE INDEX idx_announcements_created  ON announcements (created_at);
