package com.attendai.common.exception;

import org.springframework.http.HttpStatus;

public class ResourceNotFoundException extends ApiException {
    public ResourceNotFoundException(String entity, Object id) {
        super(HttpStatus.NOT_FOUND, "RES_NOT_FOUND",
                entity + " not found: id=" + id);
    }

    public ResourceNotFoundException(String message) {
        super(HttpStatus.NOT_FOUND, "RES_NOT_FOUND", message);
    }
}
