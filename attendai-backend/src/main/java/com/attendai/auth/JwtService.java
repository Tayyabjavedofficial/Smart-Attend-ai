package com.attendai.auth;

import com.attendai.config.AppProperties;
import com.attendai.config.UserPrincipal;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.Map;

/**
 * Issues, parses, and validates JWTs. The signing key is HMAC-SHA256 over
 * the configured secret. Tokens carry the subject (user id), email, role,
 * and a "type" claim (access | refresh) so the same key can be safely used
 * for both kinds of token.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class JwtService {

    private static final String CLAIM_TYPE = "type";
    private static final String CLAIM_ROLE = "role";
    private static final String CLAIM_EMAIL = "email";
    private static final String TYPE_ACCESS = "access";
    private static final String TYPE_REFRESH = "refresh";

    private final AppProperties props;

    private SecretKey signingKey() {
        // Accept either a base64-encoded secret or a raw string >= 32 chars.
        String s = props.jwt().secret();
        byte[] keyBytes;
        try {
            keyBytes = Decoders.BASE64.decode(s);
            if (keyBytes.length < 32) {
                keyBytes = s.getBytes(StandardCharsets.UTF_8);
            }
        } catch (IllegalArgumentException e) {
            keyBytes = s.getBytes(StandardCharsets.UTF_8);
        }
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public String issueAccessToken(UserPrincipal principal) {
        return buildToken(principal, TYPE_ACCESS, props.jwt().accessTokenExpirationMs());
    }

    public String issueRefreshToken(UserPrincipal principal) {
        return buildToken(principal, TYPE_REFRESH, props.jwt().refreshTokenExpirationMs());
    }

    private String buildToken(UserPrincipal p, String type, long expirationMs) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(String.valueOf(p.getId()))
                .issuer(props.jwt().issuer())
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusMillis(expirationMs)))
                .claims(Map.of(
                        CLAIM_TYPE, type,
                        CLAIM_ROLE, p.getRole().name(),
                        CLAIM_EMAIL, p.getEmail()
                ))
                .signWith(signingKey())
                .compact();
    }

    public Claims parse(String token) {
        return Jwts.parser()
                .verifyWith(signingKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public boolean isAccessToken(Claims claims) {
        return TYPE_ACCESS.equals(claims.get(CLAIM_TYPE));
    }

    public boolean isRefreshToken(Claims claims) {
        return TYPE_REFRESH.equals(claims.get(CLAIM_TYPE));
    }

    public Long extractUserId(Claims claims) {
        return Long.valueOf(claims.getSubject());
    }

    public boolean isTokenValid(String token, UserDetails user) {
        try {
            Claims c = parse(token);
            return c.getSubject().equals(String.valueOf(((UserPrincipal) user).getId()))
                    && c.getExpiration().after(new Date());
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }
}
