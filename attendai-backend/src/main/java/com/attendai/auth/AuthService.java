package com.attendai.auth;

import com.attendai.auth.dto.*;
import com.attendai.common.exception.ApiException;
import com.attendai.config.AppProperties;
import com.attendai.config.UserPrincipal;
import com.attendai.domain.security.RefreshToken;
import com.attendai.domain.security.RefreshTokenRepository;
import com.attendai.domain.user.Role;
import com.attendai.domain.user.Student;
import com.attendai.domain.user.StudentRepository;
import com.attendai.domain.user.User;
import com.attendai.domain.user.UserRepository;
import com.attendai.domain.user.UserStatus;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final AppProperties props;

    /**
     * Public student self-registration. The account starts as
     * PENDING_VERIFICATION and cannot sign in until an admin approves it
     * (which flips the status to ACTIVE).
     */
    @Transactional
    public void register(com.attendai.auth.dto.RegisterRequest req) {
        if (userRepository.existsByEmail(req.email())) {
            throw new ApiException(HttpStatus.CONFLICT, "USER_DUPLICATE_EMAIL",
                    "An account with this email already exists");
        }
        if (studentRepository.existsByRegistrationNumber(req.registrationNumber())) {
            throw new ApiException(HttpStatus.CONFLICT, "STUDENT_DUPLICATE_REG",
                    "That registration number is already registered");
        }

        User user = User.builder()
                .fullName(req.fullName())
                .email(req.email())
                .passwordHash(passwordEncoder.encode(req.password()))
                .role(Role.STUDENT)
                .status(UserStatus.PENDING_VERIFICATION)
                .build();
        user = userRepository.save(user);

        Student student = Student.builder()
                .user(user)
                .registrationNumber(req.registrationNumber())
                .department(req.department())
                .semester(req.semester())
                .build();
        studentRepository.save(student);
    }

    @Transactional
    public LoginResponse login(LoginRequest req) {
        var auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(req.email(), req.password())
        );
        UserPrincipal principal = (UserPrincipal) auth.getPrincipal();

        if (principal.getStatus() != UserStatus.ACTIVE) {
            throw new ApiException(HttpStatus.FORBIDDEN, "AUTH_004",
                    "Account is " + principal.getStatus().name().toLowerCase());
        }

        // Update last-login timestamp.
        userRepository.findById(principal.getId()).ifPresent(u -> {
            u.setLastLoginAt(Instant.now());
            userRepository.save(u);
        });

        String accessToken = jwtService.issueAccessToken(principal);
        String refreshToken = jwtService.issueRefreshToken(principal);

        saveRefreshToken(principal.getId(), refreshToken);

        return new LoginResponse(
                accessToken,
                refreshToken,
                props.jwt().accessTokenExpirationMs() / 1000,
                UserDto.from(userRepository.findById(principal.getId()).orElseThrow())
        );
    }

    @Transactional
    public TokenResponse refresh(RefreshTokenRequest req) {
        Claims claims;
        try {
            claims = jwtService.parse(req.refreshToken());
        } catch (Exception e) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "AUTH_003", "Invalid refresh token");
        }
        if (!jwtService.isRefreshToken(claims)) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "AUTH_003", "Not a refresh token");
        }

        RefreshToken stored = refreshTokenRepository.findByToken(req.refreshToken())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "AUTH_003",
                        "Refresh token not recognized"));

        if (!stored.isValid()) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "AUTH_002",
                    "Refresh token expired or revoked");
        }

        // Rotate: revoke old, issue new pair.
        stored.setRevoked(true);
        refreshTokenRepository.save(stored);

        User user = stored.getUser();
        UserPrincipal principal = UserPrincipal.from(user);
        String newAccess = jwtService.issueAccessToken(principal);
        String newRefresh = jwtService.issueRefreshToken(principal);
        saveRefreshToken(user.getId(), newRefresh);

        return new TokenResponse(newAccess, newRefresh, props.jwt().accessTokenExpirationMs() / 1000);
    }

    @Transactional
    public void logout(RefreshTokenRequest req) {
        refreshTokenRepository.findByToken(req.refreshToken()).ifPresent(t -> {
            t.setRevoked(true);
            refreshTokenRepository.save(t);
        });
    }

    private void saveRefreshToken(Long userId, String token) {
        User userRef = userRepository.getReferenceById(userId);
        RefreshToken rt = RefreshToken.builder()
                .user(userRef)
                .token(token)
                .expiresAt(Instant.now().plusMillis(props.jwt().refreshTokenExpirationMs()))
                .revoked(false)
                .build();
        refreshTokenRepository.save(rt);
    }
}
