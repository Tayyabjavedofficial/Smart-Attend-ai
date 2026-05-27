package com.attendai.domain.user;

/**
 * System-wide role assigned to a {@link User}. Maps to Spring Security
 * authority "ROLE_ADMIN" / "ROLE_TEACHER" / "ROLE_STUDENT".
 */
public enum Role {
    ADMIN,
    TEACHER,
    STUDENT;

    public String authority() {
        return "ROLE_" + name();
    }
}
