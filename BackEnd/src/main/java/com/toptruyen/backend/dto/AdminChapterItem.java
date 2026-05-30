package com.toptruyen.backend.dto;

public record AdminChapterItem(
        Long id,
        Long comicId,
        String comicSlug,
        String comicTitle,
        int chapterNo,
        String title,
        long price,
        long viewCount,
        String publishedAt
) {}
