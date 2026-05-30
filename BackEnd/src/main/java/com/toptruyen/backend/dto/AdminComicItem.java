package com.toptruyen.backend.dto;

public record AdminComicItem(
        Long id,
        String slug,
        String title,
        String status,
        String authorName,
        int chapterCount,
        long totalViews,
        String publishedAt,
        boolean isFeatured
) {
}
