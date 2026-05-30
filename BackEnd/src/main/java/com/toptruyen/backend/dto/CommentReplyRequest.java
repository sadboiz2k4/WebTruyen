package com.toptruyen.backend.dto;

public record CommentReplyRequest(
        Long parentCommentId,
        String content
) {
}
