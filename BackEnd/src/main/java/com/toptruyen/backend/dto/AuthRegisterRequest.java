package com.toptruyen.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record AuthRegisterRequest(
        @NotBlank(message = "Ten khong duoc de trong")
        String name,

        @Email(message = "Email khong hop le")
        @NotBlank(message = "Email khong duoc de trong")
        String email,

        @NotBlank(message = "Mat khau khong duoc de trong")
        String password,

        @NotBlank(message = "Xac nhan mat khau khong duoc de trong")
        String confirmPassword
) {
}
