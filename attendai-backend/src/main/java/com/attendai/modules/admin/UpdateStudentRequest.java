package com.attendai.modules.admin;

import com.attendai.domain.user.UserStatus;
import jakarta.validation.constraints.Size;

public record UpdateStudentRequest(
        @Size(max = 120) String fullName,
        @Size(max = 80) String department,
        Integer semester,
        Long sectionId,
        UserStatus status
) {}
