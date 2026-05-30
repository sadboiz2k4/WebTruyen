package com.toptruyen.backend.dto;

public record LibraryFollowStatusResponse(
        Long comicId,
        boolean following
) {
}
