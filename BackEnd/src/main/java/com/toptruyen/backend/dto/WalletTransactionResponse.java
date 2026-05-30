package com.toptruyen.backend.dto;

import java.util.List;

public record WalletTransactionResponse(
        Long transactionId,
        String type,
        Long amount,
        String reason,
        String createdAt
) {
}
