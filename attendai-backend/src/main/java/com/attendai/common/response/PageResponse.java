package com.attendai.common.response;

import org.springframework.data.domain.Page;

import java.util.List;
import java.util.function.Function;

/**
 * Lightweight pagination envelope. Avoids leaking Spring's PageImpl over the
 * wire (which is unstable across versions).
 */
public record PageResponse<T>(
        List<T> content,
        int page,
        int size,
        long totalElements,
        int totalPages,
        boolean first,
        boolean last
) {
    public static <T> PageResponse<T> from(Page<T> p) {
        return new PageResponse<>(
                p.getContent(),
                p.getNumber(),
                p.getSize(),
                p.getTotalElements(),
                p.getTotalPages(),
                p.isFirst(),
                p.isLast()
        );
    }

    public static <S, T> PageResponse<T> from(Page<S> p, Function<S, T> mapper) {
        return new PageResponse<>(
                p.getContent().stream().map(mapper).toList(),
                p.getNumber(),
                p.getSize(),
                p.getTotalElements(),
                p.getTotalPages(),
                p.isFirst(),
                p.isLast()
        );
    }
}
