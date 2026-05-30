package com.toptruyen.backend.dto;

public record AuthorProfileResponse(
        Long userId,
        String displayName,
        String bio,
        String gender,
        String joinedAt,
        int comicCount,
        long totalFollows,
        long totalViews,
        String avatarUrl
) {
}
