package com.attendai.modules.reports.export;

import com.attendai.modules.reports.data.ReportData;
import com.attendai.modules.reports.data.ReportData.Column;
import com.attendai.modules.reports.data.ReportData.Summary;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class ExporterTest {

    private ReportData sample;

    @BeforeEach
    void setup() {
        sample = ReportData.builder("Course Attendance Report")
                .subtitle("CS201 · Artificial Intelligence")
                .filter("Department", "Computer Science")
                .filter("Section", "BCS-7A")
                .summary(List.of(
                        new Summary("Enrolled", "45"),
                        new Summary("Avg attendance", "92.6%")
                ))
                .columns(List.of(
                        new Column("Reg No.", "reg"),
                        new Column("Student", "name"),
                        new Column("Percentage", "pct", Column.Align.RIGHT)
                ))
                .rows(List.of(
                        List.of("S2021001", "Aarav Sharma", "94.2%"),
                        List.of("S2021002", "Priya, \"O'Connor\"", "92.6%"),  // forces CSV escaping
                        List.of("S2021003", "Rohan Mehta", "64.2%")
                ))
                .build();
    }

    @Test
    void csv_writes_header_and_escapes_commas_and_quotes() throws Exception {
        var out = new ByteArrayOutputStream();
        new CsvExporter().write(sample, out);
        // Strip BOM for easier asserts.
        String body = out.toString(StandardCharsets.UTF_8).replaceFirst("^\\uFEFF", "");

        assertThat(body).contains("# Course Attendance Report");
        assertThat(body).contains("# Department: Computer Science");
        assertThat(body).contains("# Enrolled: 45");
        assertThat(body).contains("Reg No.,Student,Percentage");
        assertThat(body).contains("S2021001,Aarav Sharma,94.2%");
        // Embedded comma + quotes must be properly quoted and double-escaped.
        assertThat(body).contains("\"Priya, \"\"O'Connor\"\"\"");
    }

    @Test
    void xlsx_writes_valid_workbook_with_correct_cells() throws Exception {
        var out = new ByteArrayOutputStream();
        new XlsxExporter().write(sample, out);
        try (Workbook wb = new XSSFWorkbook(new ByteArrayInputStream(out.toByteArray()))) {
            Sheet s = wb.getSheetAt(0);
            // Title on row 0
            assertThat(s.getRow(0).getCell(0).getStringCellValue())
                    .isEqualTo("Course Attendance Report");
            // First data row should appear after title/subtitle/meta/summary/spacer/headers
            boolean foundDataRow = false;
            for (int i = 0; i < s.getLastRowNum() + 1; i++) {
                var r = s.getRow(i);
                if (r == null) continue;
                var first = r.getCell(0);
                if (first != null && "S2021001".equals(first.getStringCellValue())) {
                    foundDataRow = true; break;
                }
            }
            assertThat(foundDataRow).as("S2021001 row present").isTrue();
        }
    }

    @Test
    void pdf_writes_non_empty_pdf_with_magic_bytes() throws Exception {
        var out = new ByteArrayOutputStream();
        new PdfExporter().write(sample, out);
        byte[] bytes = out.toByteArray();
        assertThat(bytes.length).isGreaterThan(500);  // not empty
        // Every PDF starts with "%PDF-".
        String head = new String(bytes, 0, 5, StandardCharsets.US_ASCII);
        assertThat(head).isEqualTo("%PDF-");
        // ...and ends with %%EOF (allow trailing whitespace).
        String tail = new String(bytes, bytes.length - 16, 16, StandardCharsets.US_ASCII);
        assertThat(tail).contains("%%EOF");
    }

    @Test
    void csv_handles_empty_rows() throws Exception {
        ReportData empty = ReportData.builder("Empty Report")
                .columns(List.of(new Column("A", "a"), new Column("B", "b")))
                .rows(List.of())
                .build();
        var out = new ByteArrayOutputStream();
        new CsvExporter().write(empty, out);
        String body = out.toString(StandardCharsets.UTF_8).replaceFirst("^\\uFEFF", "");
        assertThat(body).contains("# Empty Report");
        assertThat(body).contains("A,B");
    }

    @Test
    void format_parse_rejects_garbage() {
        assertThat(ExportFormat.parse("pdf")).isEqualTo(ExportFormat.PDF);
        assertThat(ExportFormat.parse("CSV")).isEqualTo(ExportFormat.CSV);
        assertThat(ExportFormat.parse("xlsx")).isEqualTo(ExportFormat.XLSX);
        org.junit.jupiter.api.Assertions.assertThrows(
                com.attendai.common.exception.ApiException.class,
                () -> ExportFormat.parse("docx"));
        org.junit.jupiter.api.Assertions.assertThrows(
                com.attendai.common.exception.ApiException.class,
                () -> ExportFormat.parse(""));
    }
}
