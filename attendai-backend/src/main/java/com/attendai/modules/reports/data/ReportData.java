package com.attendai.modules.reports.data;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Generic report container. Every report - student-wise, course-wise, defaulter
 * list, proxy alerts - produces this shape so the export adapters (CSV, XLSX,
 * PDF) don't have to know about specific report types.
 *
 * Rows are List&lt;List&lt;Object&gt;&gt; deliberately - keeping it untyped lets
 * the same exporter render any report. Each row has the same number of cells
 * as `columns`. Use {@code null} for blanks.
 */
public record ReportData(
        String title,
        String subtitle,
        Instant generatedAt,
        Map<String, String> filters,        // human-readable filters: "Course" -> "CS201"
        List<Column> columns,
        List<List<Object>> rows,
        List<Summary> summary               // top-of-report aggregate cards
) {

    public record Column(String header, String key, Align align) {
        public enum Align { LEFT, RIGHT, CENTER }
        public Column(String header, String key) { this(header, key, Align.LEFT); }
    }

    public record Summary(String label, String value) {}

    /**
     * Convenience builder so services don't repeat the boilerplate.
     */
    public static Builder builder(String title) {
        return new Builder(title);
    }

    public static final class Builder {
        private final String title;
        private String subtitle;
        private final Map<String, String> filters = new LinkedHashMap<>();
        private List<Column> columns = List.of();
        private List<List<Object>> rows = List.of();
        private List<Summary> summary = List.of();

        private Builder(String title) { this.title = title; }

        public Builder subtitle(String s) { this.subtitle = s; return this; }
        public Builder filter(String k, String v) { if (v != null) filters.put(k, v); return this; }
        public Builder columns(List<Column> cs) { this.columns = cs; return this; }
        public Builder rows(List<List<Object>> rs) { this.rows = rs; return this; }
        public Builder summary(List<Summary> s) { this.summary = s; return this; }

        public ReportData build() {
            return new ReportData(title, subtitle, Instant.now(), filters,
                    columns, rows, summary);
        }
    }
}
