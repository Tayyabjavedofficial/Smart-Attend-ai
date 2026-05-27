package com.attendai.common.exception;

import org.springframework.http.HttpStatus;

/**
 * Thrown when a request is syntactically valid but violates a business rule
 * (e.g. duplicate attendance submission, attempt on a closed session).
 * Maps to HTTP 422 Unprocessable Entity.
 */
public class BusinessRuleException extends ApiException {
    public BusinessRuleException(String code, String message) {
        super(HttpStatus.UNPROCESSABLE_ENTITY, code, message);
    }

    public BusinessRuleException(String code, String message, Object details) {
        super(HttpStatus.UNPROCESSABLE_ENTITY, code, message, details);
    }
}
