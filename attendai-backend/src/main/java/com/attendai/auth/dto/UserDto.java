package com.attendai.auth.dto;

import com.attendai.domain.user.Role;
import com.attendai.domain.user.User;
import com.attendai.domain.user.UserStatus;

public record UserDto(
        Long id,
        String fullName,
        String email,
        Role role,
        UserStatus status
) {
    public static UserDto from(User u) {
        return new UserDto(u.getId(), u.getFullName(), u.getEmail(), u.getRole(), u.getStatus());
    }
}
