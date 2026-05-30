package com.toptruyen.backend.dto;

public record CurrentUserResponse(
        boolean authenticated,
        Long userId,
        String email,
        String displayName,
        boolean isAdmin
) {
}
