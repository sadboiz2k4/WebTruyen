package com.toptruyen.backend.dto;

public record LibraryFollowItem(
        Long comicId,
        String slug,
        String title,
        String coverUrl,
        String latestChapterNo,
        String publishedAt,
        String followedAt,
        String readStatus
) {
}
