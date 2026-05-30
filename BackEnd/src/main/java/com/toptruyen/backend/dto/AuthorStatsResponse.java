package com.toptruyen.backend.dto;

import java.util.List;

public record AuthorStatsResponse(
        String comicTitle,
        Long totalFollows,
        Long totalComments,
        Long totalRatings,
        Double averageRating,
        Integer totalChapters,
        List<ChapterStatsItem> chapterStats
) {
}
