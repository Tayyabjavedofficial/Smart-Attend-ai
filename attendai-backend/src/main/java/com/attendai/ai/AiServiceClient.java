package com.attendai.ai;

import com.attendai.config.AppProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;

/**
 * Typed client for the Python FastAPI AI service. All request/response shapes
 * mirror the schemas defined in attendai-ai-service/app/schemas/. Field names
 * are sent in snake_case (Python convention); the @JsonProperty annotations
 * keep the Java record names idiomatic on this side.
 *
 * Service-to-service auth is via the X-Service-Key header (added by
 * {@link AiWebClientConfig}).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AiServiceClient {

    private final WebClient aiWebClient;
    private final AppProperties props;

    // ---- /ai/face/register ----

    public record FaceRegisterResponse(
            @JsonProperty("profile_id") String profileId,
            @JsonProperty("student_id") Long studentId,
            @JsonProperty("samples_used") int samplesUsed,
            @JsonProperty("samples_rejected") int samplesRejected,
            @JsonProperty("embedding_dim") int embeddingDim,
            @JsonProperty("quality_score") double qualityScore,
            String backend,
            @JsonProperty("created_at") Instant createdAt
    ) {}

    public FaceRegisterResponse registerFace(Long studentId, List<String> imagesBase64) {
        return aiWebClient.post()
                .uri("/ai/face/register")
                .bodyValue(Map.of("student_id", studentId, "images", imagesBase64))
                .retrieve()
                .bodyToMono(FaceRegisterResponse.class)
                .block(Duration.ofSeconds(props.ai().timeoutSeconds()));
    }

    // ---- /ai/face/verify ----

    public record FaceVerifyResponse(
            boolean verified,
            double confidence,
            String status,
            @JsonProperty("embedding_distance") Double embeddingDistance,
            double threshold,
            Map<String, Object> metadata
    ) {}

    public FaceVerifyResponse verifyFace(Long studentId, String imageBase64) {
        return aiWebClient.post()
                .uri("/ai/face/verify")
                .bodyValue(Map.of("student_id", studentId, "image", imageBase64))
                .retrieve()
                .bodyToMono(FaceVerifyResponse.class)
                .block(Duration.ofSeconds(props.ai().timeoutSeconds()));
    }

    // ---- /ai/face/{id} ----

    public record ProfileStatusResponse(
            @JsonProperty("student_id") Long studentId,
            @JsonProperty("has_profile") boolean hasProfile,
            @JsonProperty("samples_count") Integer samplesCount,
            String backend,
            @JsonProperty("created_at") Instant createdAt
    ) {}

    public ProfileStatusResponse profileStatus(Long studentId) {
        return aiWebClient.get()
                .uri("/ai/face/{id}", studentId)
                .retrieve()
                .bodyToMono(ProfileStatusResponse.class)
                .block(Duration.ofSeconds(props.ai().timeoutSeconds()));
    }

    public record DeleteResponse(@JsonProperty("student_id") Long studentId, boolean deleted) {}

    public DeleteResponse deleteProfile(Long studentId) {
        return aiWebClient.delete()
                .uri("/ai/face/{id}", studentId)
                .retrieve()
                .bodyToMono(DeleteResponse.class)
                .block(Duration.ofSeconds(props.ai().timeoutSeconds()));
    }

    // ---- /ai/proxy/risk-score ----

    public record RiskScoreResponse(
            int score,
            String level,
            List<String> factors,
            String model
    ) {}

    /** Pass the SRS § 14 signals; field names must be snake_case to match the Python schema. */
    public RiskScoreResponse scoreRisk(Map<String, Object> signals) {
        return aiWebClient.post()
                .uri("/ai/proxy/risk-score")
                .bodyValue(signals)
                .retrieve()
                .bodyToMono(RiskScoreResponse.class)
                .block(Duration.ofSeconds(props.ai().timeoutSeconds()));
    }
}
