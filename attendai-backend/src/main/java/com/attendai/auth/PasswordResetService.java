package com.attendai.auth;

import com.attendai.auth.dto.ForgotPasswordRequest;
import com.attendai.auth.dto.ResetPasswordRequest;
import com.attendai.common.exception.ApiException;
import com.attendai.config.AppProperties;
import com.attendai.domain.security.PasswordResetToken;
import com.attendai.domain.security.PasswordResetTokenRepository;
import com.attendai.domain.security.RefreshTokenRepository;
import com.attendai.domain.user.User;
import com.attendai.domain.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;

@Slf4j
@Service
@RequiredArgsConstructor
public class PasswordResetService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final AppProperties props;

    /**
     * Generate and email a reset token. Always returns silently — we don't
     * leak whether the email is registered (avoids account enumeration).
     */
    @Transactional
    public void requestReset(ForgotPasswordRequest req) {
        userRepository.findByEmail(req.email().toLowerCase()).ifPresent(user -> {
            String rawToken = generateRawToken();
            String hash = sha256(rawToken);

            PasswordResetToken entity = PasswordResetToken.builder()
                    .user(user)
                    .tokenHash(hash)
                    .expiresAt(Instant.now().plusSeconds(
                            props.passwordReset().tokenExpirationMinutes() * 60))
                    .build();
            tokenRepository.save(entity);

            try {
                emailService.sendPasswordResetEmail(user.getEmail(), rawToken);
            } catch (Exception e) {
                // Don't reveal SMTP failures to the caller. Log so an operator
                // can diagnose. The user will silently see "if registered..."
                // and can retry.
                log.error("Failed to send password reset email to {}", user.getEmail(), e);
            }
        });
    }

    /**
     * Consume a reset token and set the new password. Invalidates all
     * existing refresh tokens so any logged-in sessions are forced out.
     */
    @Transactional
    public void performReset(ResetPasswordRequest req) {
        String hash = sha256(req.token());
        PasswordResetToken token = tokenRepository.findByTokenHash(hash)
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST,
                        "AUTH_006", "Reset link is invalid or already used"));

        if (!token.isValid()) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "AUTH_007", "Reset link has expired or already been used");
        }

        User user = token.getUser();
        user.setPasswordHash(passwordEncoder.encode(req.newPassword()));
        userRepository.save(user);

        token.setUsedAt(Instant.now());
        tokenRepository.save(token);

        // Kick all existing sessions for this user.
        refreshTokenRepository.revokeAllForUser(user.getId());

        log.info("Password reset completed for user {}", user.getEmail());
    }

    private static String generateRawToken() {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private static String sha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder(64);
            for (byte b : hash) {
                hex.append(String.format("%02x", b));
            }
            return hex.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 unavailable", e);
        }
    }
}
