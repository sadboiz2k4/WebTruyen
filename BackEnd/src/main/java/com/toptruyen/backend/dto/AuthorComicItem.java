package com.toptruyen.backend.dto;

public record AuthorComicItem(
        Long id,
        String slug,
        String title,
        String coverUrl,
        String mode,
        int chapterCount,
        String publishedAt,
        String storyStatus,
        String description,
        String categories
) {
}
