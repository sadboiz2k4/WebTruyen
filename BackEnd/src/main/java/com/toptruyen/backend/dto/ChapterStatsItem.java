package com.toptruyen.backend.dto;

public record ChapterStatsItem(
        Long chapterId,
        Integer chapterNo,
        String title,
        Long totalComments,
        Long totalReplies,
        Long reportsReceived,
        String publishedAt
) {
}
