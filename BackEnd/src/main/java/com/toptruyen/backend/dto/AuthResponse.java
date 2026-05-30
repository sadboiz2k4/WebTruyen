package com.toptruyen.backend.dto;

public record AuthResponse(
        boolean success,
        String message,
        String accessToken,
        String displayName
) {
}
