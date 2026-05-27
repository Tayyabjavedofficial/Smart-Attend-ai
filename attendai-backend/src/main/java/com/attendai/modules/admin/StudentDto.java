package com.attendai.modules.admin;

import com.attendai.domain.user.Student;
import com.attendai.domain.user.UserStatus;

public record StudentDto(
        Long id,
        Long userId,
        String fullName,
        String email,
        String registrationNumber,
        String department,
        Integer semester,
        Long sectionId,
        UserStatus status
) {
    public static StudentDto from(Student s) {
        return new StudentDto(
                s.getId(),
                s.getUser().getId(),
                s.getUser().getFullName(),
                s.getUser().getEmail(),
                s.getRegistrationNumber(),
                s.getDepartment(),
                s.getSemester(),
                s.getSection() != null ? s.getSection().getId() : null,
                s.getUser().getStatus()
        );
    }
}
