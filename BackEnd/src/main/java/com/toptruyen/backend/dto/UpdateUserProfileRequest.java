package com.toptruyen.backend.dto;

import jakarta.validation.constraints.Size;

public record UpdateUserProfileRequest(
        @Size(max = 120, message = "Ten hien thi khong duoc qua 120 ky tu")
        String displayName,

        @Size(max = 20, message = "Gioi tinh khong duoc qua 20 ky tu")
        String gender,

        @Size(max = 500, message = "Bio khong duoc qua 500 ky tu")
        String bio
) {
}
