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
        Attendance attendance,
        PasswordReset passwordReset,
        Geofence geofence,
        Mail mail
) {
    /**
     * Campus geofence used for location-verified sessions. A mark is allowed
     * when the student's reported point is within {@code radiusMeters} of the
     * centre, plus {@code accuracyBufferMeters} to absorb GPS jitter.
     */
    public record Geofence(
            double latitude,
            double longitude,
            int radiusMeters,
            int accuracyBufferMeters
    ) {}

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

    /**
     * Password-reset flow. {@code resetUrlBase} is the front-end URL the email
     * link points at — the raw token is appended as {@code ?token=...}.
     * {@code mailFrom} is the From: address (must match your SMTP account for
     * Gmail / most providers).
     */
    public record PasswordReset(
            String resetUrlBase,
            long tokenExpirationMinutes,
            String mailFrom
    ) {}

    /**
     * Outbound email transport. HF Spaces block SMTP (ports 25/465/587), so the
     * deployed app sends over an HTTPS provider API (Brevo) instead.
     *
     * {@code provider}:
     *   - {@code auto} (default): use Brevo when {@code brevoApiKey} is set,
     *     otherwise just log the reset link (safe demo fallback — nothing breaks).
     *   - {@code brevo}: always use the Brevo HTTPS API.
     *   - {@code smtp}: use the classic JavaMailSender / SMTP path (works locally
     *     or anywhere SMTP isn't blocked).
     *   - {@code log}: never send; only log the link (useful for local dev).
     *
     * The Brevo sender address ({@link PasswordReset#mailFrom()}) must be a
     * verified sender in the Brevo account, or Brevo will reject the send.
     */
    public record Mail(
            String provider,
            String brevoApiKey,
            String fromName
    ) {}
}
