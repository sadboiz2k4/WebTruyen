package com.toptruyen.backend.dto;

public record ReportContentRequest(
        String targetType,
        Long targetId,
        String reason
) {
}
