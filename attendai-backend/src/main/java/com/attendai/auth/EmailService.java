package com.attendai.auth;

import com.attendai.config.AppProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

/**
 * Dispatches password-reset emails over the transport chosen by
 * {@code app.mail.provider} (see {@link AppProperties.Mail}). Because HF Spaces
 * block SMTP, the deployed default is Brevo over HTTPS; locally you can use SMTP
 * or just log the link.
 *
 * Delivery is best-effort: any failure (or the {@code log} provider, or {@code auto}
 * with no Brevo key) falls back to logging the reset link so an operator can
 * always recover it — the flow never breaks and never blocks the API response.
 */
@Slf4j
@Service
public class EmailService {

    private final AppProperties props;
    private final BrevoMailClient brevoMailClient;
    // Optional: only present when spring-boot-starter-mail auto-configures it.
    private final ObjectProvider<JavaMailSender> mailSenderProvider;

    public EmailService(AppProperties props,
                        BrevoMailClient brevoMailClient,
                        ObjectProvider<JavaMailSender> mailSenderProvider) {
        this.props = props;
        this.brevoMailClient = brevoMailClient;
        this.mailSenderProvider = mailSenderProvider;
    }

    public void sendPasswordResetEmail(String toEmail, String rawToken) {
        String link = props.passwordReset().resetUrlBase() + "?token=" + rawToken;
        long minutes = props.passwordReset().tokenExpirationMinutes();
        String subject = "AttendAI — Reset your password";
        String text = buildText(link, minutes);
        String html = buildHtml(link, minutes);

        String provider = resolveProvider();
        try {
            switch (provider) {
                case "brevo" -> brevoMailClient.send(toEmail, subject, text, html);
                case "smtp" -> sendViaSmtp(toEmail, subject, text);
                default -> logLink(toEmail, link);   // "log"
            }
            if (!"log".equals(provider)) {
                log.info("Password reset email dispatched to {} via {}", toEmail, provider);
            }
        } catch (Exception e) {
            // Never surface transport failures to the caller (avoids account
            // enumeration) — log the error and the link as a recovery path.
            log.error("Password reset email via '{}' failed for {} — logging link as fallback",
                    provider, toEmail, e);
            logLink(toEmail, link);
        }
    }

    /** Resolve "auto" to a concrete transport based on whether a Brevo key exists. */
    private String resolveProvider() {
        String p = props.mail() != null ? props.mail().provider() : null;
        if (p == null || p.isBlank() || p.equalsIgnoreCase("auto")) {
            String key = props.mail() != null ? props.mail().brevoApiKey() : null;
            return (key != null && !key.isBlank()) ? "brevo" : "log";
        }
        return p.toLowerCase();
    }

    private void sendViaSmtp(String toEmail, String subject, String text) {
        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null) {
            throw new IllegalStateException("SMTP provider selected but JavaMailSender is not configured");
        }
        SimpleMailMessage msg = new SimpleMailMessage();
        msg.setFrom(props.passwordReset().mailFrom());
        msg.setTo(toEmail);
        msg.setSubject(subject);
        msg.setText(text);
        mailSender.send(msg);
    }

    private void logLink(String toEmail, String link) {
        // WARN so it stands out in the Space logs. This is the demo/dev path.
        log.warn("📧 Password-reset link for {} (no email sent): {}", toEmail, link);
    }

    private String buildText(String link, long minutes) {
        return "Hi,\n\n"
                + "We received a request to reset the password for your AttendAI account.\n\n"
                + "Open the link below to choose a new password. It expires in " + minutes + " minutes.\n\n"
                + link + "\n\n"
                + "If you didn't request this, you can safely ignore this email — your password won't change.\n\n"
                + "— The AttendAI team";
    }

    private String buildHtml(String link, long minutes) {
        return """
                <!doctype html>
                <html>
                  <body style="margin:0;background:#f4f7fb;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
                    <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" style="background:#f4f7fb;padding:32px 0;">
                      <tr><td align="center">
                        <table role="presentation" width="460" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e6ecf5;">
                          <tr><td style="background:#2563eb;padding:20px 28px;color:#ffffff;font-size:18px;font-weight:600;">AttendAI</td></tr>
                          <tr><td style="padding:28px;">
                            <h1 style="margin:0 0 12px;font-size:20px;color:#0f172a;">Reset your password</h1>
                            <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#475569;">
                              We received a request to reset the password for your AttendAI account.
                              Click the button below to choose a new one. This link expires in
                              <strong>%d minutes</strong>.
                            </p>
                            <p style="margin:0 0 24px;">
                              <a href="%s" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 22px;border-radius:10px;">Choose a new password</a>
                            </p>
                            <p style="margin:0 0 8px;font-size:12px;color:#94a3b8;">Or paste this link into your browser:</p>
                            <p style="margin:0 0 24px;font-size:12px;color:#2563eb;word-break:break-all;">%s</p>
                            <p style="margin:0;font-size:12px;line-height:1.6;color:#94a3b8;">
                              If you didn't request this, you can safely ignore this email — your password won't change.
                            </p>
                          </td></tr>
                          <tr><td style="padding:16px 28px;background:#f8fafc;border-top:1px solid #eef2f7;font-size:11px;color:#94a3b8;">— The AttendAI team</td></tr>
                        </table>
                      </td></tr>
                    </table>
                  </body>
                </html>
                """.formatted(minutes, link, link);
    }
}
