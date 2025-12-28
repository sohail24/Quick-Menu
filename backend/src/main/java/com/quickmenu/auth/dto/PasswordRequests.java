package com.quickmenu.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

public class PasswordRequests {

    @Data
    public static class ChangePasswordRequest {
        @NotBlank
        private String currentPassword;

        @NotBlank
        @Size(min = 6, message = "New password must be at least 6 characters")
        private String newPassword;
    }

    @Data
    public static class ForgotPasswordRequest {
        @NotBlank
        private String email;
    }

    @Data
    public static class ResetPasswordRequest {
        @NotBlank
        private String token;

        @NotBlank
        @Size(min = 6, message = "New password must be at least 6 characters")
        private String newPassword;
    }
}
