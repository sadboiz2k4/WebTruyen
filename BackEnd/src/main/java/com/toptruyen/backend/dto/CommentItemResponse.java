package com.toptruyen.backend.dto;

public record CommentItemResponse(
        Long id,
        Long chapterId,
        Long userId,
        String displayName,
        String content,
        String createdAt,
        boolean own,
        int replyCount
) {
}
