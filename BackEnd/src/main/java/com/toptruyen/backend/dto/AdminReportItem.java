package com.toptruyen.backend.dto;

public record AdminReportItem(
        Long id,
        Long userId,
        String reporterName,
        String reportScope,
        String targetType,
        Long targetId,
        String targetTitle,
        String targetSlug,
        String targetPreview,
        String reason,
        String status,
        String reviewerNote,
        Integer autoFlagged,
        String createdAt
) {
}
