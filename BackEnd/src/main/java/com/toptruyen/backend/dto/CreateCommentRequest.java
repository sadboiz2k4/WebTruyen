package com.toptruyen.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateCommentRequest(
        @NotBlank(message = "Noi dung binh luan khong duoc de trong")
        @Size(max = 1200, message = "Noi dung binh luan khong qua 1200 ky tu")
        String content
) {
}
