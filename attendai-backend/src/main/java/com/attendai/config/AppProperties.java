package com.attendai.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Strongly-typed access to app-level configuration. Bound to the {@code app.*}
 * prefix in application.yml. Records make these immutable by construction.
 */
@ConfigurationProperties(prefix = "app")
public record AppProperties(
        Jwt jwt,
        Cors cors,
        Ai ai,
        Attendance attendance
) {
    public record Jwt(
            String secret,
            long accessTokenExpirationMs,
            long refreshTokenExpirationMs,
            String issuer
    ) {}

    public record Cors(String allowedOrigins) {}

    public record Ai(
            String baseUrl,
            String serviceKey,
            int timeoutSeconds,
            boolean useStub
    ) {}

    public record Attendance(
            int defaultChallengeDurationSeconds,
            int minimumPercentage,
            RiskThresholds riskThresholds
    ) {}

    public record RiskThresholds(int low, int medium, int high) {}
}
