package com.attendai.auth;

import com.attendai.auth.dto.LoginRequest;
import com.attendai.auth.dto.LoginResponse;
import com.attendai.auth.dto.RefreshTokenRequest;
import com.attendai.auth.dto.TokenResponse;
import com.attendai.common.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Login, logout, and token refresh")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    @Operation(summary = "Authenticate and obtain access + refresh tokens")
    public ApiResponse<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        return ApiResponse.ok(authService.login(request));
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
}
