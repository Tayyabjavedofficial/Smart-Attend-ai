package com.attendai;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

/**
 * Boots the full application against the in-memory H2 profile. Fails if any
 * bean wiring is broken — covers most regressions during early development.
 */
@SpringBootTest
@ActiveProfiles("test")
class AttendaiApplicationTests {

    @Test
    void contextLoads() {
        // empty - Spring just needs to start up clean
    }
}
