package com.attendai.domain.attendance;

/**
 * Selects which checks are required to mark attendance for a session.
 * Composed of independent strategy flags. The verification pipeline runs
 * each enabled strategy in sequence and aggregates the result.
 */
public enum VerificationMode {
    CODE_ONLY,
    QR_ONLY,
    CODE_FACE,
    QR_FACE,
    QR_FACE_DEVICE;

    public boolean requiresFace() {
        return this == CODE_FACE || this == QR_FACE || this == QR_FACE_DEVICE;
    }

    public boolean requiresDevice() {
        return this == QR_FACE_DEVICE;
    }

    public boolean requiresQr() {
        return this == QR_ONLY || this == QR_FACE || this == QR_FACE_DEVICE;
    }

    public boolean requiresCode() {
        return this == CODE_ONLY || this == CODE_FACE;
    }
}
