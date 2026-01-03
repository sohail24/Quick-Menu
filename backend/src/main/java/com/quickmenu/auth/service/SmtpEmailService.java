package com.quickmenu.auth.service;

import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@Slf4j
@Profile("!prod")
public class SmtpEmailService implements EmailSender {

    private final JavaMailSender mailSender;

    public SmtpEmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Override
    public void sendPasswordResetEmail(String toEmail, String resetCode) {
        try {
            log.info("Attempting to send password reset email via SMTP to: {}", toEmail);
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(toEmail);
            helper.setSubject("QuickMenu - Password Reset Code");
            
            String htmlContent = EmailTemplateUtils.buildPasswordResetEmailHtml(resetCode);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("Password reset email sent successfully via SMTP to: {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send password reset email via SMTP to: {}. Error: {}", toEmail, e.getMessage());
            throw new RuntimeException("Failed to send email", e);
        }
    }
}
