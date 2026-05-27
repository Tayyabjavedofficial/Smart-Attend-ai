package com.attendai.modules.reports.export;

import com.attendai.modules.reports.data.ReportData;
import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.stereotype.Component;

import java.awt.Color;
import java.io.IOException;
import java.io.OutputStream;
import java.time.format.DateTimeFormatter;
import java.time.ZoneOffset;
import java.util.List;

/**
 * Generates an A4 landscape PDF report. The styling deliberately matches the
 * frontend's institutional palette (deep teal headers, off-white background)
 * so a printed report looks like it came from the same product.
 */
@Component
public class PdfExporter implements Exporter {

    private static final Color BRAND = new Color(15, 110, 86);       // brand-600
    private static final Color INK_900 = new Color(13, 13, 12);
    private static final Color INK_500 = new Color(79, 78, 74);
    private static final Color INK_100 = new Color(237, 234, 224);

    private static final Font TITLE = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, INK_900);
    private static final Font SUBTITLE = FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 10, INK_500);
    private static final Font META = FontFactory.getFont(FontFactory.HELVETICA, 9, INK_500);
    private static final Font HEADER = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, Color.WHITE);
    private static final Font CELL = FontFactory.getFont(FontFactory.HELVETICA, 9, INK_900);
    private static final Font SUMMARY_LABEL = FontFactory.getFont(FontFactory.HELVETICA, 8, INK_500);
    private static final Font SUMMARY_VALUE = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 13, BRAND);

    @Override public ExportFormat format() { return ExportFormat.PDF; }
    @Override public String mimeType() { return "application/pdf"; }
    @Override public String fileExtension() { return "pdf"; }

    @Override
    public void write(ReportData report, OutputStream out) throws IOException {
        Document doc = new Document(PageSize.A4.rotate(), 36, 36, 36, 36);
        try {
            PdfWriter.getInstance(doc, out);
            doc.open();

            // Title
            Paragraph title = new Paragraph(report.title(), TITLE);
            title.setSpacingAfter(2);
            doc.add(title);

            if (report.subtitle() != null) {
                Paragraph sub = new Paragraph(report.subtitle(), SUBTITLE);
                sub.setSpacingAfter(4);
                doc.add(sub);
            }

            // Meta line
            StringBuilder metaText = new StringBuilder("Generated ");
            metaText.append(DateTimeFormatter.ofPattern("MMM d, yyyy 'at' HH:mm 'UTC'")
                    .format(report.generatedAt().atOffset(ZoneOffset.UTC)));
            report.filters().forEach((k, v) -> metaText.append("   ·   ").append(k).append(": ").append(v));
            Paragraph meta = new Paragraph(metaText.toString(), META);
            meta.setSpacingAfter(12);
            doc.add(meta);

            // Summary band
            if (!report.summary().isEmpty()) {
                PdfPTable summary = new PdfPTable(Math.max(1, report.summary().size()));
                summary.setWidthPercentage(100);
                summary.setSpacingAfter(12);
                for (var s : report.summary()) {
                    PdfPCell cell = new PdfPCell();
                    cell.setBorder(Rectangle.NO_BORDER);
                    cell.setBackgroundColor(new Color(247, 245, 240));   // canvas-alt
                    cell.setPadding(10);
                    Paragraph label = new Paragraph(s.label().toUpperCase(), SUMMARY_LABEL);
                    Paragraph value = new Paragraph(s.value(), SUMMARY_VALUE);
                    label.setSpacingAfter(2);
                    cell.addElement(label);
                    cell.addElement(value);
                    summary.addCell(cell);
                }
                doc.add(summary);
            }

            // Data table
            if (!report.columns().isEmpty()) {
                PdfPTable table = new PdfPTable(report.columns().size());
                table.setWidthPercentage(100);
                table.setHeaderRows(1);

                // Header row
                for (var col : report.columns()) {
                    PdfPCell h = new PdfPCell(new Phrase(col.header(), HEADER));
                    h.setBackgroundColor(BRAND);
                    h.setBorderColor(BRAND);
                    h.setPadding(7);
                    h.setHorizontalAlignment(mapAlign(col.align()));
                    table.addCell(h);
                }

                // Data rows (zebra-striped)
                boolean alt = false;
                for (List<Object> row : report.rows()) {
                    for (int i = 0; i < row.size(); i++) {
                        Object v = row.get(i);
                        var col = i < report.columns().size() ? report.columns().get(i) : null;
                        PdfPCell c = new PdfPCell(new Phrase(v == null ? "" : v.toString(), CELL));
                        c.setBorderColor(INK_100);
                        c.setPadding(6);
                        if (alt) c.setBackgroundColor(new Color(252, 251, 247));
                        if (col != null) c.setHorizontalAlignment(mapAlign(col.align()));
                        table.addCell(c);
                    }
                    alt = !alt;
                }
                doc.add(table);
            } else {
                doc.add(new Paragraph("(No data)", META));
            }

            // Footer
            Paragraph footer = new Paragraph(
                    "AttendAI · " + report.rows().size() + " rows",
                    FontFactory.getFont(FontFactory.HELVETICA, 8, INK_500));
            footer.setSpacingBefore(12);
            footer.setAlignment(Element.ALIGN_RIGHT);
            doc.add(footer);

            doc.close();
        } catch (DocumentException e) {
            throw new IOException("Failed to generate PDF: " + e.getMessage(), e);
        }
    }

    private static int mapAlign(ReportData.Column.Align a) {
        return switch (a) {
            case RIGHT -> Element.ALIGN_RIGHT;
            case CENTER -> Element.ALIGN_CENTER;
            case LEFT -> Element.ALIGN_LEFT;
        };
    }
}
