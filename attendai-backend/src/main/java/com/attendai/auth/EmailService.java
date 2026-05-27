package com.attendai.auth;

import com.attendai.config.AppProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;
    private final AppProperties props;

    public void sendPasswordResetEmail(String toEmail, String rawToken) {
        String link = props.passwordReset().resetUrlBase() + "?token=" + rawToken;

        SimpleMailMessage msg = new SimpleMailMessage();
        msg.setFrom(props.passwordReset().mailFrom());
        msg.setTo(toEmail);
        msg.setSubject("AttendAI — Reset your password");
        msg.setText(
                "Hi,\n\n" +
                "We received a request to reset the password for your AttendAI account.\n\n" +
                "Click the link below to choose a new password. It expires in " +
                props.passwordReset().tokenExpirationMinutes() + " minutes.\n\n" +
                link + "\n\n" +
                "If you didn't request this, you can safely ignore this email — your password won't change.\n\n" +
                "— The AttendAI team"
        );

        mailSender.send(msg);
        log.info("Password reset email dispatched to {}", toEmail);
    }
}
