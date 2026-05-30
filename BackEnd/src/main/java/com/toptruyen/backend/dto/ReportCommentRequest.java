package com.toptruyen.backend.dto;

public record ReportCommentRequest(
        Long commentId,
        String reason
) {
}
