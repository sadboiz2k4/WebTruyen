package com.toptruyen.backend.dto;

public record ComicRatingSummaryResponse(
        Long comicId,
        double averageRating,
        long totalRatings,
        Integer currentUserRating
) {
}
