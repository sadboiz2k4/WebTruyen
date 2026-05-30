package com.toptruyen.backend.dto;

import java.util.List;

public record NotificationResponse(
        List<NotificationItem> notifications,
        Long unreadCount,
        int totalCount
) {
}
