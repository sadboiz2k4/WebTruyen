package com.toptruyen.backend.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record RateComicRequest(
        @NotNull(message = "Danh gia la bat buoc")
        @Min(value = 1, message = "Danh gia toi thieu la 1")
        @Max(value = 5, message = "Danh gia toi da la 5")
        Integer rating
) {
}
