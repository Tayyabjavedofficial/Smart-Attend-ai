package com.attendai.attendance.verification;

import com.attendai.config.AppProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

/**
 * Computes a 0-100 risk score for an attendance attempt. The default
 * implementation is a deterministic rule-based scorer that matches the table
 * in SRS § 14. Phase 5 will plug in a model-based variant.
 *
 * Inputs come from the validation pipeline (see {@link RiskInput}).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RiskScorer {

    private final AppProperties props;

    public enum Level { LOW, MEDIUM, HIGH, CRITICAL }

    public record RiskInput(
            int wrongCodeAttempts,
            boolean deviceTrusted,
            boolean deviceUsedByMultipleAccounts,
            boolean faceFailed,
            double faceConfidence,
            int lateBySeconds,
            boolean duplicateAttempt,
            int missedRandomChallenges,
            boolean suspiciousIpPattern
    ) {}

    public record RiskOutput(int score, Level level, List<String> factors) {}

    public RiskOutput score(RiskInput in) {
        int score = 0;
        List<String> factors = new ArrayList<>();

        if (in.wrongCodeAttempts() > 0) {
            int add = Math.min(30, in.wrongCodeAttempts() * 10);
            score += add;
            factors.add("wrong_code_attempts:" + in.wrongCodeAttempts());
        }
        if (!in.deviceTrusted()) {
            score += 20;
            factors.add("untrusted_device");
        }
        if (in.deviceUsedByMultipleAccounts()) {
            score += 30;
            factors.add("multi_account_device");
        }
        if (in.faceFailed()) {
            score += 40;
            factors.add("face_failed");
        } else if (in.faceConfidence() < 0.75) {
            // Linear 25-point penalty as confidence falls from 0.75 to 0.50.
            double slope = (0.75 - in.faceConfidence()) / 0.25;
            int add = (int) Math.min(25.0, slope * 25.0);
            score += Math.max(0, add);
            factors.add("low_face_confidence:" + String.format("%.2f", in.faceConfidence()));
        }
        if (in.lateBySeconds() > 0) {
            score += 50;
            factors.add("late_by_seconds:" + in.lateBySeconds());
        }
        if (in.duplicateAttempt()) {
            score += 50;
            factors.add("duplicate_attempt");
        }
        if (in.missedRandomChallenges() > 0) {
            score += Math.min(20, in.missedRandomChallenges() * 5);
            factors.add("missed_random_challenges:" + in.missedRandomChallenges());
        }
        if (in.suspiciousIpPattern()) {
            score += 20;
            factors.add("suspicious_ip");
        }

        score = Math.min(100, score);

        var thresholds = props.attendance().riskThresholds();
        Level level;
        if (score <= thresholds.low()) level = Level.LOW;
        else if (score <= thresholds.medium()) level = Level.MEDIUM;
        else if (score <= thresholds.high()) level = Level.HIGH;
        else level = Level.CRITICAL;

        log.debug("Risk score {} ({}) factors={}", score, level, factors);
        return new RiskOutput(score, level, List.copyOf(factors));
    }
}
