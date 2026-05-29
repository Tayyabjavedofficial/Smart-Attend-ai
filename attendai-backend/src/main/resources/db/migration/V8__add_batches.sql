-- V8__add_batches.sql
-- A "batch" is a student cohort/program that owns sections across semesters
-- 1..8 (e.g. "BCS Fall 2021"). Sections optionally belong to one batch, which
-- lets admins manage a whole degree program as a unit. `total_semesters`
-- defaults to 8 but is configurable for shorter programs.
CREATE TABLE batches (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(80)  NOT NULL,
    program         VARCHAR(80)  NULL,
    department      VARCHAR(80)  NULL,
    start_year      INT          NULL,
    total_semesters INT          NOT NULL DEFAULT 8,
    advisor         VARCHAR(120) NULL,
    created_at      DATETIME(6)  NOT NULL,
    updated_at      DATETIME(6)  NOT NULL,
    CONSTRAINT uk_batches_name UNIQUE (name)
);
CREATE INDEX idx_batches_department ON batches (department);

-- Link sections to a batch. Nullable so existing sections stay valid and a
-- section can be created before it's grouped into a batch.
ALTER TABLE sections ADD COLUMN batch_id BIGINT NULL;
ALTER TABLE sections
    ADD CONSTRAINT fk_sections_batch FOREIGN KEY (batch_id) REFERENCES batches(id);
CREATE INDEX idx_sections_batch ON sections (batch_id);
