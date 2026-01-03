package com.quickmenu.auth.service;

import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendPasswordResetEmail(String toEmail, String resetCode) {
        try {
            log.info("Attempting to send password reset email to: {}", toEmail);
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(toEmail);
            helper.setSubject("QuickMenu - Password Reset Code");
            
            String htmlContent = buildPasswordResetEmailHtml(resetCode);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("Password reset email sent successfully to: {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send password reset email to: {}. Error: {}", toEmail, e.getMessage());
            throw new RuntimeException("Failed to send email", e);
        }
    }

    private String buildPasswordResetEmailHtml(String resetCode) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                    }
                    .container {
                        background-color: #f9fafb;
                        border-radius: 8px;
                        padding: 30px;
                    }
                    .header {
                        text-align: center;
                        margin-bottom: 30px;
                    }
                    .logo {
                        font-size: 24px;
                        font-weight: bold;
                        color: #2563eb;
                    }
                    .content {
                        background-color: white;
                        border-radius: 8px;
                        padding: 30px;
                        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                    }
                    .reset-code {
                        background-color: #dbeafe;
                        border-radius: 8px;
                        padding: 20px;
                        text-align: center;
                        margin: 30px 0;
                    }
                    .code {
                        font-size: 32px;
                        font-weight: bold;
                        color: #1e40af;
                        letter-spacing: 0.5em;
                        margin: 10px 0;
                    }
                    .footer {
                        text-align: center;
                        margin-top: 30px;
                        font-size: 12px;
                        color: #6b7280;
                    }
                    .warning {
                        background-color: #fef3c7;
                        border-left: 4px solid #f59e0b;
                        padding: 12px;
                        margin: 20px 0;
                        border-radius: 4px;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div class="logo">🍽️ QuickMenu</div>
                    </div>
                    <div class="content">
                        <h2>Password Reset Request</h2>
                        <p>Hello,</p>
                        <p>We received a request to reset your password. Use the code below to reset your password:</p>
                        
                        <div class="reset-code">
                            <p style="margin: 0; font-size: 12px; color: #1e40af; font-weight: bold;">YOUR RESET CODE</p>
                            <div class="code">%s</div>
                        </div>
                        
                        <div class="warning">
                            <strong>⚠️ Security Notice:</strong> This code will expire in 15 minutes. If you didn't request this password reset, please ignore this email.
                        </div>
                        
                        <p>To reset your password:</p>
                        <ol>
                            <li>Go to the password reset page</li>
                            <li>Enter the code above</li>
                            <li>Create your new password</li>
                        </ol>
                        
                        <p>If you have any questions, please contact our support team.</p>
                        
                        <p>Best regards,<br>The QuickMenu Team</p>
                    </div>
                    <div class="footer">
                        <p>This is an automated message, please do not reply to this email.</p>
                        <p>&copy; 2025 QuickMenu. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(resetCode);
    }
}
