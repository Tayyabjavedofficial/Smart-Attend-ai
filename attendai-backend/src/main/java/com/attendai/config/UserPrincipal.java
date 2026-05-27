package com.attendai.config;

import com.attendai.domain.user.Role;
import com.attendai.domain.user.User;
import com.attendai.domain.user.UserStatus;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

/**
 * Adapter that exposes a {@link User} entity to Spring Security. Carries the
 * user id so downstream services can call {@code authentication.getPrincipal()}
 * and resolve the underlying entity without an extra DB hit.
 */
@Getter
@RequiredArgsConstructor
public class UserPrincipal implements UserDetails {

    private final Long id;
    private final String email;
    private final String passwordHash;
    private final Role role;
    private final UserStatus status;

    public static UserPrincipal from(User u) {
        return new UserPrincipal(u.getId(), u.getEmail(), u.getPasswordHash(), u.getRole(), u.getStatus());
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority(role.authority()));
    }

    @Override public String getPassword() { return passwordHash; }
    @Override public String getUsername() { return email; }
    @Override public boolean isAccountNonExpired() { return true; }
    @Override public boolean isAccountNonLocked() { return status != UserStatus.BLOCKED; }
    @Override public boolean isCredentialsNonExpired() { return true; }
    @Override public boolean isEnabled() { return status == UserStatus.ACTIVE; }
}
