package com.attendai.auth;

import com.attendai.config.AppProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.time.Duration;
import java.util.List;
import java.util.Map;

/**
 * Sends transactional email through Brevo's HTTPS REST API
 * ({@code POST https://api.brevo.com/v3/smtp/email}). This is the deploy-time
 * transport because Hugging Face Spaces block outbound SMTP, but plain HTTPS
 * (port 443) is allowed. Auth is the per-account {@code api-key} header.
 *
 * The call is synchronous (block) to match {@link com.attendai.ai.AiServiceClient}'s
 * style and keep {@link PasswordResetService} straightforward.
 */
@Slf4j
@Component
public class BrevoMailClient {

    private static final String BASE_URL = "https://api.brevo.com/v3";
    private static final Duration TIMEOUT = Duration.ofSeconds(15);

    private final WebClient client;
    private final AppProperties props;

    public BrevoMailClient(AppProperties props) {
        this.props = props;
        this.client = WebClient.builder()
                .baseUrl(BASE_URL)
                .defaultHeader("Content-Type", "application/json")
                .defaultHeader("Accept", "application/json")
                .build();
    }

    /**
     * Send one email. Throws on any non-2xx response or transport error so the
     * caller can fall back (e.g. log the link). The {@code api-key} is read per
     * call so a key added to the Space's secrets takes effect without a code change.
     */
    public void send(String toEmail, String subject, String textContent, String htmlContent) {
        String apiKey = props.mail().brevoApiKey();
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException("BREVO_API_KEY is not configured");
        }

        Map<String, Object> body = Map.of(
                "sender", Map.of(
                        "email", props.passwordReset().mailFrom(),
                        "name", props.mail().fromName()),
                "to", List.of(Map.of("email", toEmail)),
                "subject", subject,
                "textContent", textContent,
                "htmlContent", htmlContent
        );

        try {
            client.post()
                    .uri("/smtp/email")
                    .header("api-key", apiKey)
                    .bodyValue(body)
                    .retrieve()
                    .toBodilessEntity()
                    .block(TIMEOUT);
        } catch (WebClientResponseException e) {
            // Surface Brevo's actual rejection reason (e.g. unverified sender,
            // invalid key) instead of an opaque 4xx.
            throw new RuntimeException(
                    "Brevo HTTP " + e.getStatusCode().value() + ": " + e.getResponseBodyAsString(), e);
        }

        log.info("Brevo accepted email to {}", toEmail);
    }
}
