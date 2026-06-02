package com.toptruyen.backend.dto;

public record AdminUserItem(
        Long id,
        String email,
        String displayName,
        String status,
        String createdAt,
        long walletBalance,
        int comicCount,
        boolean isAdmin
) {
}
