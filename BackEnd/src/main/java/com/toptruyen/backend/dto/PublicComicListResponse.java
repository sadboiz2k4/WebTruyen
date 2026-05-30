package com.toptruyen.backend.dto;

import java.util.List;

public record PublicComicListResponse(
        List<PublicComicItem> data,
        int totalItems,
        int totalPages,
        int currentPage
) {
}
