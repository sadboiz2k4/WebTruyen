package com.toptruyen.backend.dto;

public record AdminCommentItem(
        Long id,
        Long userId,
        String userName,
        Long chapterId,
        String comicTitle,
        String comicSlug,
        int chapterNo,
        String content,
        String createdAt
) {
}
