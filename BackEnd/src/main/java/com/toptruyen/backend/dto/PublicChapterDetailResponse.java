package com.toptruyen.backend.dto;

import java.util.List;

public record PublicChapterDetailResponse(
        Long id,
        Long comicId,
        String comicSlug,
        String comicTitle,
        Integer chapterNo,
        String title,
        String content,
        String publishedAt,
        List<PublicChapterPageItem> pages,
        Long price,
        Boolean locked
) {
}
