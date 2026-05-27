package com.attendai.common.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

/**
 * Base class for all expected errors raised by the application. Carries an
 * application-level error code (see API design § 1.6) and the HTTP status
 * that should be returned to the client.
 */
@Getter
public class ApiException extends RuntimeException {

    private final String code;
    private final HttpStatus status;
    private final transient Object details;

    public ApiException(HttpStatus status, String code, String message) {
        this(status, code, message, null);
    }

    public ApiException(HttpStatus status, String code, String message, Object details) {
        super(message);
        this.status = status;
        this.code = code;
        this.details = details;
    }
}
