package com.toptruyen.backend.dto;

public record AuthorPostCommentItem(
        Long id,
        Long postId,
        Long userId,
        String displayName,
        String avatarUrl,
        boolean isAuthor,
        String content,
        String createdAt,
        boolean own
) {
}
