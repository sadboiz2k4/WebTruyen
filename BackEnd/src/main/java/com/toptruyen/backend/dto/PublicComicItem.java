package com.toptruyen.backend.dto;

public record PublicComicItem(
        Long id,
        String slug,
        String title,
        String coverUrl,
        String description,
        String publishedAt,
        Long latestChapterId,
        Integer latestChapterNo,
        long totalViews,
        long totalComments,
        double averageRating
) {
}
