package com.attendai.attendance.scheduler;

import com.attendai.attendance.challenge.ChallengeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Background job that finds challenges past their expiry_time and transitions
 * them to EXPIRED. Runs every 10 seconds. Without this, the system relies on
 * a client request triggering the check.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ChallengeExpiryJob {

    private final ChallengeService challengeService;

    @Scheduled(fixedDelay = 10_000, initialDelay = 10_000)
    public void run() {
        try {
            int count = challengeService.expireOverdueChallenges();
            if (count > 0) {
                log.info("ChallengeExpiryJob: expired {} challenges", count);
            }
        } catch (Exception e) {
            log.error("ChallengeExpiryJob failed", e);
        }
    }
}
