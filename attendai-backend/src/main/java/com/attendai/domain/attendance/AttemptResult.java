package com.attendai.domain.attendance;

public enum AttemptResult {
    SUCCESS,
    FAILED_CODE,
    FAILED_FACE,
    FAILED_DEVICE,
    FAILED_EXPIRED,
    FAILED_DUPLICATE,
    FAILED_NOT_ENROLLED,
    FLAGGED_SUSPICIOUS
}
