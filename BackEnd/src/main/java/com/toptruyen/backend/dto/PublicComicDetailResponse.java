package com.toptruyen.backend.dto;

import java.util.List;

public record PublicComicDetailResponse(
        Long id,
        String slug,
        String title,
        String coverUrl,
        String description,
        String publishedAt,
        List<PublicChapterSummary> chapters,
        String categories,
        String authorName,
        long totalViews
) {
}
