package com.toptruyen.backend.dto;

public record DeletePublishedChapterResponse(
        boolean success,
        String message,
        Long comicId,
        Long chapterId,
        Integer chapterNo,
        String slug,
        String chapterTitle
) {
}