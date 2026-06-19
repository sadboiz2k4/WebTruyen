package com.toptruyen.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record CurrentUserResponse(
        boolean authenticated,
        Long userId,
        String email,
        String displayName,
        @JsonProperty("isAdmin") boolean isAdmin
) {
}
