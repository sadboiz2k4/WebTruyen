package com.toptruyen.backend.dto;

public record ReportedCommentItem(
        Long reportId,
        Long commentId,
        Long chapterId,
        String commentContent,
        String reportReason,
        String reportStatus,
        String reportedByUser,
        String createdAt
) {
}
