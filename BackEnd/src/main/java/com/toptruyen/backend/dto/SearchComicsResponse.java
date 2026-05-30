package com.toptruyen.backend.dto;

import java.util.List;

public record SearchComicsResponse(
        List<SearchComicsResultItem> data,
        int currentPage,
        int totalPages,
        long totalItems,
        int pageSize
) {
}
