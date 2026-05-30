package com.toptruyen.backend.dto;

public record UserAuthRow(
        Long id,
        String email,
        String displayName,
        String passwordHash,
        String status
) {
}
