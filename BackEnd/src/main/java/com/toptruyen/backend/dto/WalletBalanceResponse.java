package com.toptruyen.backend.dto;

public record WalletBalanceResponse(
        Long userId,
        Long balance,
        String lastUpdated
) {
}
