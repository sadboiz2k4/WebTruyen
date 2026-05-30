package com.toptruyen.backend.dto;

public record CommentReplyItem(
        Long id,
        Long parentCommentId,
        Long userId,
        String userName,
        String content,
        String createdAt
) {
}
