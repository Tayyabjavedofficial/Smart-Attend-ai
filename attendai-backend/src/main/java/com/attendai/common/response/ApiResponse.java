package com.attendai.common.response;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.Instant;

/**
 * Standard envelope returned by every endpoint. Frontend can rely on
 * {@code success} being present on success responses, and on the {@code error}
 * field being present on failure responses (see {@link ErrorPayload}).
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiResponse<T>(
        boolean success,
        T data,
        String message,
        ErrorPayload error,
        Instant timestamp
) {
    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(true, data, null, null, Instant.now());
    }

    public static <T> ApiResponse<T> ok(T data, String message) {
        return new ApiResponse<>(true, data, message, null, Instant.now());
    }

    public static ApiResponse<Void> success(String message) {
        return new ApiResponse<>(true, null, message, null, Instant.now());
    }

    public static ApiResponse<Void> error(String code, String message) {
        return new ApiResponse<>(false, null, null, new ErrorPayload(code, message, null), Instant.now());
    }

    public static ApiResponse<Void> error(String code, String message, Object details) {
        return new ApiResponse<>(false, null, null, new ErrorPayload(code, message, details), Instant.now());
    }

    public record ErrorPayload(String code, String message, Object details) {}
}
