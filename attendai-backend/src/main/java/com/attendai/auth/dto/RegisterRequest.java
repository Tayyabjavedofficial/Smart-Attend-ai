package com.attendai.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Public student self-registration. Creates a PENDING_VERIFICATION student
 * account that an admin must approve before the student can sign in.
 */
public record RegisterRequest(
        @NotBlank @Size(max = 120) String fullName,
        @NotBlank @Email @Size(max = 150) String email,
        @NotBlank @Size(min = 8, max = 100) String password,
        @NotBlank @Size(max = 50) String registrationNumber,
        @Size(max = 80) String department,
        Integer semester
) {}
