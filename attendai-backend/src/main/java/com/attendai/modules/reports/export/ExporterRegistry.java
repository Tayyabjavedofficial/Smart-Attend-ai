package com.attendai.modules.reports.export;

import com.attendai.common.exception.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class ExporterRegistry {

    private final List<Exporter> exporters;
    private Map<ExportFormat, Exporter> byFormat;

    public Exporter forFormat(ExportFormat fmt) {
        if (byFormat == null) {
            // Build once. Spring re-injects the same list on every restart.
            Map<ExportFormat, Exporter> m = new EnumMap<>(ExportFormat.class);
            for (Exporter e : exporters) m.put(e.format(), e);
            byFormat = m;
        }
        Exporter e = byFormat.get(fmt);
        if (e == null) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "REPORT_EXPORTER_MISSING",
                    "No exporter registered for format " + fmt);
        }
        return e;
    }
}
