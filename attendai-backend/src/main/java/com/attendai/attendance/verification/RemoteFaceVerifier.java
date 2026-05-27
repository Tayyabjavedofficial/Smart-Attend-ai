package com.attendai.attendance.verification;

import com.attendai.ai.AiServiceClient;
import com.attendai.ai.AiServiceClient.FaceVerifyResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClientResponseException;

/**
 * Production face verifier. Forwards every call to the Python FastAPI AI
 * service via {@link AiServiceClient} and translates the response into the
 * shape the marking pipeline expects.
 *
 * Active when {@code app.ai.use-stub=false}. The default
 * {@link StubFaceVerifier} stays in place for dev/CI.
 */
@Slf4j
@Service
@ConditionalOnProperty(prefix = "app.ai", name = "use-stub", havingValue = "false")
@RequiredArgsConstructor
public class RemoteFaceVerifier implements FaceVerifier {

    private final AiServiceClient client;

    @Override
    public VerifyResult verify(Long studentId, String faceImageBase64) {
        if (faceImageBase64 == null || faceImageBase64.isBlank()) {
            return new VerifyResult(false, 0.0, Status.FAILED);
        }
        try {
            FaceVerifyResponse resp = client.verifyFace(studentId, faceImageBase64);
            if (resp == null) {
                log.warn("AI service returned null body for student {}", studentId);
                return new VerifyResult(false, 0.0, Status.MANUAL_REVIEW_REQUIRED);
            }
            Status status = mapStatus(resp.status());
            return new VerifyResult(resp.verified(), resp.confidence(), status);
        } catch (WebClientResponseException e) {
            log.warn("AI face verify HTTP {} for student {}: {}",
                    e.getStatusCode().value(), studentId, e.getResponseBodyAsString());
            // SRS §6.4 NFR-REL-03: AI down -> mark as MANUAL_REVIEW_REQUIRED,
            // do not crash the marking pipeline.
            return new VerifyResult(false, 0.0, Status.MANUAL_REVIEW_REQUIRED);
        } catch (Exception e) {
            log.warn("AI face verify failed for student {}: {}", studentId, e.getMessage());
            return new VerifyResult(false, 0.0, Status.MANUAL_REVIEW_REQUIRED);
        }
    }

    private Status mapStatus(String s) {
        if (s == null) return Status.MANUAL_REVIEW_REQUIRED;
        return switch (s) {
            case "VERIFIED" -> Status.VERIFIED;
            case "LOW_CONFIDENCE" -> Status.LOW_CONFIDENCE;
            case "FAILED" -> Status.FAILED;
            default -> Status.MANUAL_REVIEW_REQUIRED;
        };
    }
}
