package com.attendai.modules.reports.export;

import com.attendai.modules.reports.data.ReportData;

import java.io.IOException;
import java.io.OutputStream;

/**
 * Renders a {@link ReportData} into a particular file format. One
 * implementation per format - CSV / XLSX / PDF. The dispatcher in
 * {@link ExporterRegistry} picks the right one based on the
 * {@link ExportFormat} the caller requested.
 */
public interface Exporter {
    ExportFormat format();
    String mimeType();
    String fileExtension();
    void write(ReportData report, OutputStream out) throws IOException;
}
