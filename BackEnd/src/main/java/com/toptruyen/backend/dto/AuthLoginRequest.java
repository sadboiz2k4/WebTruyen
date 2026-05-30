package com.toptruyen.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record AuthLoginRequest(
        @Email(message = "Email khong hop le")
        @NotBlank(message = "Email khong duoc de trong")
        String email,

        @NotBlank(message = "Mat khau khong duoc de trong")
        String password
) {
}
