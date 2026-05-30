package com.toptruyen.backend.dto;

import java.util.List;

public record AdminReportAppealItem(
        Long id,
        String reportScope,
        Long reportId,
        Long reporterUserId,
        String reporterName,
        String targetType,
        Long targetId,
        String targetTitle,
        String targetPreview,
        String message,
        String status,
        String adminNote,
        String createdAt,
        String reviewedAt,
        List<String> allowedActions
) {
}