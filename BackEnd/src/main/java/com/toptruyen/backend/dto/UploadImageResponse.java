package com.toptruyen.backend.dto;

public record UploadImageResponse(
        boolean success,
        String message,
        String objectKey,
        String url,
        long size,
        String contentType
) {
}
