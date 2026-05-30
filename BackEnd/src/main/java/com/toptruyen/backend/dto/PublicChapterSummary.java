package com.toptruyen.backend.dto;

public record PublicChapterSummary(
        Long id,
        Integer chapterNo,
        String title,
        String publishedAt,
        Long price
) {
}
