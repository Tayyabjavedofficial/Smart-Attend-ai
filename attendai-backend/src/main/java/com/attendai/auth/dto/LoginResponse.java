package com.attendai.auth.dto;

public record LoginResponse(
        String accessToken,
        String refreshToken,
        long expiresInSeconds,
        UserDto user
) {}
