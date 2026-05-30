package com.toptruyen.backend.dto;

import java.util.List;

public record AuthorDraftRequest(
        String title,
        String slug,
        String description,
        String coverUrl,
        String fontFamily,
        Integer fontSize,
        String color,
        String background,
        String content,
        String chapterTitle,
        Long targetChapterId,
        Long chapterPrice,
        List<AuthorDraftChapterItem> chapters,
        List<AuthorDraftPageItem> pages
) {
}
