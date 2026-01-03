package com.quickmenu.auth.service;

import com.sendgrid.*;
import com.sendgrid.helpers.mail.Mail;
import com.sendgrid.helpers.mail.objects.Content;
import com.sendgrid.helpers.mail.objects.Email;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import java.io.IOException;

@Service
@Slf4j
@Profile("prod")
public class EmailService implements EmailSender {

    @Value("${sendgrid.api-key:}")
    private String apiKey;

    @Value("${EMAIL_ID:noreply@quickmenu.local}")
    private String fromEmail;

    @Override
    public void sendPasswordResetEmail(String toEmail, String resetCode) {
        if (apiKey == null || apiKey.isEmpty()) {
            log.warn("SendGrid API Key is missing. Check server logs for Reset Code: {}", resetCode);
            log.warn("To Email: {}", toEmail);
            return;
        }

        Email from = new Email(fromEmail);
        String subject = "QuickMenu - Password Reset Code";
        Email to = new Email(toEmail);
        Content content = new Content("text/html", EmailTemplateUtils.buildPasswordResetEmailHtml(resetCode));
        Mail mail = new Mail(from, subject, to, content);

        SendGrid sg = new SendGrid(apiKey);
        Request request = new Request();
        try {
            log.info("Attempting to send password reset email via SendGrid API to: {}", toEmail);
            request.setMethod(Method.POST);
            request.setEndpoint("mail/send");
            request.setBody(mail.build());
            Response response = sg.api(request);
            
            if (response.getStatusCode() >= 200 && response.getStatusCode() < 300) {
                log.info("Password reset email sent successfully via SendGrid. Status: {}", response.getStatusCode());
            } else {
                log.error("SendGrid failed to send email. Status: {}, Body: {}", response.getStatusCode(), response.getBody());
                throw new RuntimeException("SendGrid error: " + response.getStatusCode());
            }
        } catch (IOException e) {
            log.error("Failed to connect to SendGrid API", e);
            throw new RuntimeException("SendGrid connection failed", e);
        }
    }
}

