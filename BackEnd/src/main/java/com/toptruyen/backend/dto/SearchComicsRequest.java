package com.toptruyen.backend.dto;

public record SearchComicsRequest(
        String query,
        String category,
        String status,
        String sortBy,
        String paidType,
        int page,
        int size
) {
}
