package com.toptruyen.backend.dto;

public record AuthorPostItem(
        Long id,
        String authorPageName,
        Long userId,
        String displayName,
        String avatarUrl,
        boolean isAuthor,
        String content,
        String createdAt,
        boolean own,
        int commentCount
) {
}
