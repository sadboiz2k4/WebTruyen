package com.toptruyen.backend.dto;

public record NotificationItem(
        Long id,
        String type,
        String title,
        String message,
        Long relatedId,
        String relatedUrl,
        Boolean isRead,
        String createdAt
) {
}
