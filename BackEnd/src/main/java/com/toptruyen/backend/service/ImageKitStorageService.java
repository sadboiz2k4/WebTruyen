package com.toptruyen.backend.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.toptruyen.backend.config.ImageKitProperties;
import com.toptruyen.backend.dto.UploadImageResponse;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

@Service
@EnableConfigurationProperties(ImageKitProperties.class)
public class ImageKitStorageService {

    private static final String IMAGEKIT_UPLOAD_URL = "https://upload.imagekit.io/api/v1/files/upload";

    private final ImageKitProperties imageKitProperties;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;

    public ImageKitStorageService(ImageKitProperties imageKitProperties, ObjectMapper objectMapper) {
        this.imageKitProperties = imageKitProperties;
        this.objectMapper = objectMapper;
        this.restTemplate = new RestTemplate();
    }

    public UploadImageResponse uploadImage(MultipartFile file, Long userId) throws IOException {
        validateImage(file);

        // Nếu ImageKit chưa cấu hình, dùng placeholder URL
        if (isBlank(imageKitProperties.getPrivateKey())) {
            return createPlaceholderResponse(file, userId);
        }

        String contentType = file.getContentType();
        String extension = fileExtension(file.getOriginalFilename(), contentType);
        String fileName = userId + "-" + UUID.randomUUID() + extension;
        String folder = normalizeFolder(imageKitProperties.getFolder()) + "/" + LocalDate.now();
        String privateKey = requirePrivateKey();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        headers.setBasicAuth(privateKey, "");

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", new ByteArrayResource(file.getBytes()) {
            @Override
            public String getFilename() {
                return fileName;
            }
        });
        body.add("fileName", fileName);
        body.add("folder", folder);
        body.add("useUniqueFileName", "true");

        HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);
        ResponseEntity<String> responseEntity = restTemplate.postForEntity(IMAGEKIT_UPLOAD_URL, requestEntity, String.class);

        if (!responseEntity.getStatusCode().is2xxSuccessful() || responseEntity.getBody() == null) {
            throw new IllegalStateException("ImageKit tra ve phan hoi khong hop le");
        }

        Map<String, Object> payload = objectMapper.readValue(responseEntity.getBody(), new TypeReference<>() {
        });

        String url = toStringOrEmpty(payload.get("url"));
        String filePath = toStringOrEmpty(payload.get("filePath"));

        if (url.isBlank() && !filePath.isBlank()) {
            url = normalizeEndpoint(imageKitProperties.getUrlEndpoint()) + normalizePath(filePath);
        }

        if (url.isBlank()) {
            throw new IllegalStateException("ImageKit khong tra ve URL anh");
        }

        return new UploadImageResponse(true, "Upload anh thanh cong", filePath, url, file.getSize(), contentType);
    }

    private UploadImageResponse createPlaceholderResponse(MultipartFile file, Long userId) {
        String contentType = file.getContentType();
        String extension = fileExtension(file.getOriginalFilename(), contentType);
        String fileName = userId + "-" + UUID.randomUUID() + extension;
        
        // Tạo URL placeholder từ picsum.photos
        String placeholderUrl = "https://picsum.photos/seed/" + UUID.randomUUID().toString() + "/300/420";
        
        return new UploadImageResponse(
            true, 
            "Upload anh thanh cong (placeholder mode)",
            "/" + fileName,
            placeholderUrl,
            file.getSize(),
            contentType
        );
    }

    private void validateConfiguration() {
        if (isBlank(imageKitProperties.getPrivateKey())) {
            throw new IllegalStateException("IMAGEKIT_PRIVATE_KEY chua duoc cau hinh");
        }
    }

    private String requirePrivateKey() {
        String privateKey = imageKitProperties.getPrivateKey();
        if (isBlank(privateKey)) {
            throw new IllegalStateException("IMAGEKIT_PRIVATE_KEY chua duoc cau hinh");
        }
        return Objects.requireNonNull(privateKey);
    }

    private void validateImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Khong co file duoc gui len");
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.toLowerCase(Locale.ROOT).startsWith("image/")) {
            throw new IllegalArgumentException("Chi ho tro upload file anh");
        }

        if (file.getSize() > imageKitProperties.getMaxFileSizeBytes()) {
            throw new IllegalArgumentException("Anh vuot qua kich thuoc toi da cho phep");
        }
    }

    private String fileExtension(String fileName, String contentType) {
        if (fileName != null) {
            int index = fileName.lastIndexOf('.');
            if (index >= 0 && index < fileName.length() - 1) {
                String ext = fileName.substring(index).toLowerCase(Locale.ROOT);
                if (ext.matches("\\.[a-z0-9]{1,8}")) {
                    return ext;
                }
            }
        }

        if ("image/jpeg".equalsIgnoreCase(contentType)) return ".jpg";
        if ("image/png".equalsIgnoreCase(contentType)) return ".png";
        if ("image/webp".equalsIgnoreCase(contentType)) return ".webp";
        if ("image/gif".equalsIgnoreCase(contentType)) return ".gif";
        return ".img";
    }

    private String normalizeFolder(String folder) {
        String value = isBlank(folder) ? "/toptruyen/uploads/images" : folder;
        if (!value.startsWith("/")) {
            value = "/" + value;
        }
        while (value.endsWith("/")) {
            value = value.substring(0, value.length() - 1);
        }
        return value;
    }

    private String normalizeEndpoint(String endpoint) {
        String value = isBlank(endpoint) ? "https://ik.imagekit.io/toptruyen" : endpoint;
        while (value.endsWith("/")) {
            value = value.substring(0, value.length() - 1);
        }
        return value;
    }

    private String normalizePath(String path) {
        if (path.startsWith("/")) {
            return path;
        }
        return "/" + path;
    }

    private String toStringOrEmpty(Object value) {
        return value == null ? "" : String.valueOf(value);
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
