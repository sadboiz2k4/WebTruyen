package com.toptruyen.backend.dto;

public record PublicChapterPageItem(
        Long id,
        String imageUrl,
        String fileName,
        Integer sortOrder
) {
}
