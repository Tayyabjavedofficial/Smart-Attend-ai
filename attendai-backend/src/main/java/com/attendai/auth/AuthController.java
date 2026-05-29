package com.attendai.auth;

import com.attendai.auth.dto.ForgotPasswordRequest;
import com.attendai.auth.dto.LoginRequest;
import com.attendai.auth.dto.LoginResponse;
import com.attendai.auth.dto.RefreshTokenRequest;
import com.attendai.auth.dto.RegisterRequest;
import com.attendai.auth.dto.ResetPasswordRequest;
import com.attendai.auth.dto.TokenResponse;
import com.attendai.common.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Login, logout, token refresh, and password reset")
public class AuthController {

    private final AuthService authService;
    private final PasswordResetService passwordResetService;

    @PostMapping("/login")
    @Operation(summary = "Authenticate and obtain access + refresh tokens")
    public ApiResponse<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        return ApiResponse.ok(authService.login(request));
    }

    @PostMapping("/register")
    @Operation(summary = "Student self-registration (creates a pending account for admin approval)")
    public ResponseEntity<ApiResponse<Void>> register(@Valid @RequestBody RegisterRequest request) {
        authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(
                ApiResponse.success("Account created. An administrator will review and approve it shortly."));
    }

    @PostMapping("/refresh-token")
    @Operation(summary = "Exchange a refresh token for a new access + refresh pair")
    public ApiResponse<TokenResponse> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        return ApiResponse.ok(authService.refresh(request));
    }

    @PostMapping("/logout")
    @Operation(summary = "Revoke the current refresh token")
    public ApiResponse<Void> logout(@Valid @RequestBody RefreshTokenRequest request) {
        authService.logout(request);
        return ApiResponse.success("Logged out");
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Request a password reset email")
    public ApiResponse<Void> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        passwordResetService.requestReset(request);
        // Same response shape regardless of whether the email exists, so the
        // caller can't enumerate registered accounts.
        return ApiResponse.success("If that email is registered, a reset link has been sent.");
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Set a new password using a token from the reset email")
    public ApiResponse<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        passwordResetService.performReset(request);
        return ApiResponse.success("Password updated. You can now log in.");
    }
}
