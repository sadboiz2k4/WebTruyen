package com.toptruyen.backend.dto;

public record AdminStatsResponse(
        long totalUsers,
        long totalComics,
        long totalChapters,
        long totalComments,
        long totalReports,
        long pendingReports
) {
}
