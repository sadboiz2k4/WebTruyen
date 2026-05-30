package com.toptruyen.backend.dto;

public record WalletTransactionRequest(
        Long amount,
        String reason
) {
}
