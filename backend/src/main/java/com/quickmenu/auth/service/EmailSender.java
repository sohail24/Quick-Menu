package com.quickmenu.auth.service;

public interface EmailSender {
    void sendPasswordResetEmail(String toEmail, String resetCode);
}
