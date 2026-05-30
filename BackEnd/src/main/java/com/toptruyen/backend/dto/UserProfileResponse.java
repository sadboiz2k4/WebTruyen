package com.toptruyen.backend.dto;

public record UserProfileResponse(
        Long userId,
        String email,
        String displayName,
        String gender,
        String bio,
        String avatar
) {
}
