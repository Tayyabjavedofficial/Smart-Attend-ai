package com.attendai.modules.admin;

import com.attendai.domain.user.Teacher;
import com.attendai.domain.user.UserStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class TeacherDtos {

    private TeacherDtos() {}

    public record CreateTeacherRequest(
            @NotBlank @Size(max = 120) String fullName,
            @NotBlank @Email @Size(max = 150) String email,
            @NotBlank @Size(min = 8, max = 100) String password,
            @NotBlank @Size(max = 50) String employeeId,
            @Size(max = 80) String department,
            @Size(max = 80) String designation
    ) {}

    public record UpdateTeacherRequest(
            @Size(max = 120) String fullName,
            @Size(max = 80) String department,
            @Size(max = 80) String designation,
            UserStatus status
    ) {}

    public record TeacherDto(
            Long id,
            Long userId,
            String fullName,
            String email,
            String employeeId,
            String department,
            String designation,
            UserStatus status
    ) {
        public static TeacherDto from(Teacher t) {
            return new TeacherDto(
                    t.getId(),
                    t.getUser().getId(),
                    t.getUser().getFullName(),
                    t.getUser().getEmail(),
                    t.getEmployeeId(),
                    t.getDepartment(),
                    t.getDesignation(),
                    t.getUser().getStatus()
            );
        }
    }
}
