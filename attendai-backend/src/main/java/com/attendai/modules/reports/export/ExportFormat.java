package com.attendai.modules.reports.export;

import com.attendai.common.exception.ApiException;
import org.springframework.http.HttpStatus;

public enum ExportFormat {
    CSV, XLSX, PDF;

    public static ExportFormat parse(String value) {
        if (value == null || value.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "REPORT_FORMAT_MISSING",
                    "Missing 'format' parameter (expected csv | xlsx | pdf)");
        }
        try {
            return ExportFormat.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "REPORT_FORMAT_INVALID",
                    "Unsupported export format: " + value);
        }
    }
}
