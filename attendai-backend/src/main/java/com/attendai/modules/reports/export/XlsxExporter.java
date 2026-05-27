package com.attendai.modules.reports.export;

import com.attendai.modules.reports.data.ReportData;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.OutputStream;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Writes a single-sheet .xlsx. Layout:
 *
 *   Row 0  : title (merged across all columns, bold, larger font)
 *   Row 1  : subtitle (optional)
 *   Row 2  : generated-at + filters
 *   Row 3  : summary cards as label : value pairs
 *   Row 5  : column headers (bold, banded)
 *   Row 6+ : data rows
 *
 * Number / date cells are typed correctly so spreadsheet formulas like AVG()
 * and SUM() work on them out of the box.
 */
@Component
public class XlsxExporter implements Exporter {

    @Override public ExportFormat format() { return ExportFormat.XLSX; }
    @Override public String mimeType() { return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"; }
    @Override public String fileExtension() { return "xlsx"; }

    @Override
    public void write(ReportData report, OutputStream out) throws IOException {
        try (XSSFWorkbook wb = new XSSFWorkbook()) {
            Sheet sheet = wb.createSheet(safeSheetName(report.title()));

            // ---- styles ----
            CellStyle titleStyle = wb.createCellStyle();
            Font titleFont = wb.createFont();
            titleFont.setBold(true); titleFont.setFontHeightInPoints((short) 14);
            titleStyle.setFont(titleFont);

            CellStyle subtitleStyle = wb.createCellStyle();
            Font subtitleFont = wb.createFont();
            subtitleFont.setItalic(true); subtitleFont.setColor(IndexedColors.GREY_50_PERCENT.getIndex());
            subtitleStyle.setFont(subtitleFont);

            CellStyle headerStyle = wb.createCellStyle();
            Font headerFont = wb.createFont(); headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.DARK_TEAL.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setBorderBottom(BorderStyle.THIN);

            CellStyle dateStyle = wb.createCellStyle();
            dateStyle.setDataFormat(wb.getCreationHelper().createDataFormat().getFormat("yyyy-mm-dd hh:mm"));

            // ---- header band ----
            int row = 0;
            int cols = Math.max(1, report.columns().size());

            Row title = sheet.createRow(row++);
            Cell t = title.createCell(0); t.setCellValue(report.title()); t.setCellStyle(titleStyle);
            sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, cols - 1));

            if (report.subtitle() != null) {
                Row sub = sheet.createRow(row++);
                Cell s = sub.createCell(0); s.setCellValue(report.subtitle()); s.setCellStyle(subtitleStyle);
                sheet.addMergedRegion(new CellRangeAddress(row - 1, row - 1, 0, cols - 1));
            }

            Row meta = sheet.createRow(row++);
            String metaText = "Generated " + DateTimeFormatter.ISO_INSTANT.format(report.generatedAt());
            if (!report.filters().isEmpty()) {
                StringBuilder sb = new StringBuilder(metaText);
                report.filters().forEach((k, v) -> sb.append("  ·  ").append(k).append(": ").append(v));
                metaText = sb.toString();
            }
            meta.createCell(0).setCellValue(metaText);
            sheet.addMergedRegion(new CellRangeAddress(row - 1, row - 1, 0, cols - 1));

            if (!report.summary().isEmpty()) {
                row++;
                Row sumRow = sheet.createRow(row++);
                int c = 0;
                for (var s : report.summary()) {
                    Cell cell = sumRow.createCell(c++);
                    cell.setCellValue(s.label() + ": " + s.value());
                    cell.setCellStyle(subtitleStyle);
                }
            }

            row++; // blank spacer

            // ---- header row ----
            Row headers = sheet.createRow(row++);
            for (int i = 0; i < report.columns().size(); i++) {
                Cell c = headers.createCell(i);
                c.setCellValue(report.columns().get(i).header());
                c.setCellStyle(headerStyle);
            }

            // ---- data ----
            for (List<Object> rowData : report.rows()) {
                Row r = sheet.createRow(row++);
                for (int i = 0; i < rowData.size(); i++) {
                    Cell c = r.createCell(i);
                    Object v = rowData.get(i);
                    if (v == null) continue;
                    if (v instanceof Number n) {
                        c.setCellValue(n.doubleValue());
                    } else if (v instanceof Boolean b) {
                        c.setCellValue(b);
                    } else if (v instanceof Instant inst) {
                        c.setCellValue(java.util.Date.from(inst));
                        c.setCellStyle(dateStyle);
                    } else if (v instanceof LocalDate || v instanceof LocalDateTime) {
                        c.setCellValue(v.toString());
                    } else {
                        c.setCellValue(v.toString());
                    }
                }
            }

            for (int i = 0; i < report.columns().size(); i++) sheet.autoSizeColumn(i);
            sheet.createFreezePane(0, row - report.rows().size());
            wb.write(out);
        }
    }

    private static String safeSheetName(String name) {
        // Excel sheet names: ≤31 chars, no \ / ? * [ ]
        String s = name.replaceAll("[\\\\/?*\\[\\]]", "_");
        return s.length() > 31 ? s.substring(0, 31) : s;
    }
}
