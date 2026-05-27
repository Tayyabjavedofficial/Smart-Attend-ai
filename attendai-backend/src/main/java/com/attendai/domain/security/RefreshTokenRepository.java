package com.attendai.domain.security;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    Optional<RefreshToken> findByToken(String token);

    @Modifying
    @Query("update RefreshToken r set r.revoked = true where r.user.id = :userId")
    void revokeAllForUser(@Param("userId") Long userId);

    @Modifying
    @Query("delete from RefreshToken r where r.expiresAt < :cutoff")
    void deleteExpired(@Param("cutoff") Instant cutoff);
}
