package com.attendai.attendance.verification;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

/**
 * Returns high-confidence VERIFIED results for any non-empty image. Lets the
 * pipeline be exercised in dev/test without standing up the Python service.
 *
 * Active when {@code app.ai.use-stub=true} or unset. Set to {@code false} to
 * route to {@code RemoteFaceVerifier} (Phase 5).
 */
@Slf4j
@Service
@ConditionalOnProperty(prefix = "app.ai", name = "use-stub", havingValue = "true", matchIfMissing = true)
public class StubFaceVerifier implements FaceVerifier {

    @Override
    public VerifyResult verify(Long studentId, String faceImageBase64) {
        if (faceImageBase64 == null || faceImageBase64.isBlank()) {
            log.debug("Stub face verifier: no image, returning FAILED");
            return new VerifyResult(false, 0.0, Status.FAILED);
        }
        // Slight deterministic variance based on image content length, so tests
        // that pass different payloads can simulate different confidence levels.
        double confidence = 0.92 + Math.min(0.07, faceImageBase64.length() / 100000.0);
        return new VerifyResult(true, confidence, Status.VERIFIED);
    }
}
