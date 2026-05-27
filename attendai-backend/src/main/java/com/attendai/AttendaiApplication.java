package com.attendai;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Entry point for the AttendAI Smart Attendance backend.
 *
 * Enables:
 *  - JPA auditing for createdAt / updatedAt populated automatically.
 *  - Async execution for fire-and-forget operations (notifications, risk scoring).
 *  - Scheduling for background tasks (e.g. auto-closing expired challenges).
 */
@SpringBootApplication
@EnableJpaAuditing
@EnableAsync
@EnableScheduling
public class AttendaiApplication {

    public static void main(String[] args) {
        SpringApplication.run(AttendaiApplication.class, args);
    }
}
