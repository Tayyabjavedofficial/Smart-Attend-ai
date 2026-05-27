package com.attendai.common.util;

import com.attendai.common.exception.ApiException;
import com.attendai.config.UserPrincipal;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * Static helpers to get the current user from the security context.
 */
public final class SecurityUtils {

    private SecurityUtils() {}

    public static UserPrincipal currentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof UserPrincipal p)) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "AUTH_002", "Not authenticated");
        }
        return p;
    }

    public static Long currentUserId() {
        return currentUser().getId();
    }

    /** True if the authenticated user has the given role (without the ROLE_ prefix). */
    public static boolean hasRole(String role) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return false;
        String needle = "ROLE_" + role;
        return auth.getAuthorities().stream()
                .anyMatch(a -> needle.equals(a.getAuthority()));
    }
}
