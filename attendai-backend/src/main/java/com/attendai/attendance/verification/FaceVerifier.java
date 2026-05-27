package com.attendai.attendance.verification;

/**
 * Abstraction over the face-verification service. The real implementation
 * forwards to the Python FastAPI service (Phase 5). A stub implementation is
 * provided for development so the marking pipeline can run end-to-end without
 * the AI service available.
 */
public interface FaceVerifier {

    enum Status { VERIFIED, FAILED, LOW_CONFIDENCE, MANUAL_REVIEW_REQUIRED }

    record VerifyResult(boolean verified, double confidence, Status status) {
        public static VerifyResult skipped() {
            // Verification not required for this session - treated as verified with neutral confidence.
            return new VerifyResult(true, 1.0, Status.VERIFIED);
        }
    }

    VerifyResult verify(Long studentId, String faceImageBase64);
}
