package com.attendai.modules.reports.export;

import com.attendai.modules.reports.data.ReportData;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.io.Writer;
import java.nio.charset.StandardCharsets;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * RFC 4180 CSV writer. Includes a small header section as comment-style rows
 * so the export is self-describing - readers like Excel ignore them when
 * opened as a table.
 */
@Component
public class CsvExporter implements Exporter {

    @Override public ExportFormat format() { return ExportFormat.CSV; }
    @Override public String mimeType() { return "text/csv; charset=UTF-8"; }
    @Override public String fileExtension() { return "csv"; }

    @Override
    public void write(ReportData report, OutputStream out) throws IOException {
        // BOM so Excel on Windows reads UTF-8 correctly.
        out.write(0xEF); out.write(0xBB); out.write(0xBF);

        Writer w = new OutputStreamWriter(out, StandardCharsets.UTF_8);

        w.write("# " + report.title());
        w.write("\n");
        if (report.subtitle() != null) {
            w.write("# " + report.subtitle());
            w.write("\n");
        }
        w.write("# Generated: " + DateTimeFormatter.ISO_INSTANT.format(report.generatedAt()));
        w.write("\n");
        report.filters().forEach((k, v) -> {
            try { w.write("# " + k + ": " + v); w.write("\n"); }
            catch (IOException ignored) {}
        });
        if (!report.summary().isEmpty()) {
            w.write("#\n# Summary\n");
            for (var s : report.summary()) {
                w.write("# " + s.label() + ": " + s.value());
                w.write("\n");
            }
        }
        w.write("\n");

        // Header row
        writeRow(w, report.columns().stream().map(ReportData.Column::header).toList());

        // Data rows
        for (List<Object> row : report.rows()) {
            writeRow(w, row.stream().map(CsvExporter::format).toList());
        }
        w.flush();
    }

    private static String format(Object v) {
        return v == null ? "" : v.toString();
    }

    private static void writeRow(Writer w, List<String> cells) throws IOException {
        for (int i = 0; i < cells.size(); i++) {
            if (i > 0) w.write(',');
            w.write(escape(cells.get(i)));
        }
        w.write('\n');
    }

    private static String escape(String s) {
        if (s == null) return "";
        boolean needsQuote = s.contains(",") || s.contains("\"") || s.contains("\n") || s.contains("\r");
        if (!needsQuote) return s;
        return "\"" + s.replace("\"", "\"\"") + "\"";
    }
}
