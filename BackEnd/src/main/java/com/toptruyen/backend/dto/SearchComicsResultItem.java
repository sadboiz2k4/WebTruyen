package com.toptruyen.backend.dto;

public record SearchComicsResultItem(
        Long id,
        String slug,
        String title,
        String coverUrl,
        String description,
        Integer latestChapterNo,
        String latestChapterTitle,
        String publishedAt,
        Long totalFollows,
        Long totalComments,
        Long totalViews,
        Double averageRating,
        String authorName
) {
}
