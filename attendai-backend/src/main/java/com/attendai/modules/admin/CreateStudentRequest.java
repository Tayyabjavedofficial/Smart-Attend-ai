package com.attendai.modules.admin;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateStudentRequest(
        @NotBlank @Size(max = 120) String fullName,
        @NotBlank @Email @Size(max = 150) String email,
        @NotBlank @Size(min = 8, max = 100) String password,
        @NotBlank @Size(max = 50) String registrationNumber,
        @Size(max = 80) String department,
        Integer semester,
        Long sectionId
) {}
