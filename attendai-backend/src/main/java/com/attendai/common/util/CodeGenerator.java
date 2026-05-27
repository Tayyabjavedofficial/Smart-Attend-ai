package com.attendai.common.util;

import java.security.SecureRandom;
import java.util.UUID;

/**
 * Random token generators for attendance challenges. The short code is for
 * humans to type; the QR token is for the QR payload (longer, opaque).
 */
public final class CodeGenerator {

    private static final SecureRandom RNG = new SecureRandom();
    /** No I, O, 0, 1 to avoid visual ambiguity when students type the code. */
    private static final char[] ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789".toCharArray();

    private CodeGenerator() {}

    /** 6-character human-typeable challenge code. */
    public static String shortCode() {
        StringBuilder sb = new StringBuilder(6);
        for (int i = 0; i < 6; i++) {
            sb.append(ALPHABET[RNG.nextInt(ALPHABET.length)]);
        }
        return sb.toString();
    }

    /** Opaque QR payload (UUID + random suffix). */
    public static String qrToken() {
        return UUID.randomUUID().toString().replace("-", "")
                + Long.toHexString(RNG.nextLong());
    }

    /** Session code (visible to teacher, used for cross-reference). */
    public static String sessionCode() {
        return "AS-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    /** Device trust token. */
    public static String deviceToken() {
        return UUID.randomUUID().toString();
    }
}
