package com.toptruyen.backend.dto;

public record LibraryHistoryItem(
        Long comicId,
        String comicSlug,
        String comicTitle,
        Long chapterId,
        Integer chapterNo,
        String chapterTitle,
        String lastReadAt
) {
}
