package com.toptruyen.backend.dto;

import java.util.List;

public record AuthorDraftChapterItem(
        Long id,
        String title,
        String status,
        Integer pages,
        Integer sortOrder,
        String content,
        Long chapterPrice,
        Long targetChapterId,
        List<AuthorDraftPageItem> pagesList
) {
}
