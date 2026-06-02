package com.toptruyen.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Map;

@Service
public class ModerationService {

    private static final Logger log = LoggerFactory.getLogger(ModerationService.class);

    @Value("${ai.moderation.url:http://localhost:5000}")
    private String aiServiceUrl;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();
    private final ObjectMapper mapper = new ObjectMapper();

    public enum Decision { APPROVED, PENDING_REVIEW, REJECTED, AI_UNAVAILABLE }

    public record ModerationResult(
            Decision decision,
            double reupScore,
            String reupResult,
            double violationScore,
            String violationResult,
            String rejectReason,
            Long matchedChapterId
    ) {}

    /**
     * Gọi AI service kiểm duyệt nội dung chương trước khi xuất bản.
     * @param content       Nội dung văn bản của chương
     * @param excludeComicId  ID truyện hiện tại (để không so sánh với chính nó)
     */
    public ModerationResult moderate(String content, Long excludeComicId) {
        if (content == null || content.isBlank()) {
            return new ModerationResult(Decision.APPROVED, 0, "CLEAN", 0, "CLEAN", null, null);
        }

        try {
            String body = mapper.writeValueAsString(Map.of(
                    "content", content,
                    "excludeComicId", excludeComicId != null ? excludeComicId : 0
            ));

            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(aiServiceUrl + "/moderate"))
                    .header("Content-Type", "application/json")
                    .timeout(Duration.ofSeconds(30))
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();

            HttpResponse<String> resp = httpClient.send(req, HttpResponse.BodyHandlers.ofString());

            if (resp.statusCode() != 200) {
                log.warn("AI service returned status {}", resp.statusCode());
                return new ModerationResult(Decision.AI_UNAVAILABLE, 0, "UNKNOWN", 0, "UNKNOWN", null, null);
            }

            JsonNode root = mapper.readTree(resp.body());
            String decision      = root.path("decision").asText("APPROVED");
            double reupScore     = root.path("layer1_reup").path("score").asDouble(0);
            String reupResult    = root.path("layer1_reup").path("result").asText("CLEAN");
            double violScore     = root.path("layer2_violation").path("score").asDouble(0);
            String violResult    = root.path("layer2_violation").path("result").asText("CLEAN");

            // Lấy tên và ID truyện bị trùng lặp từ top match
            String matchedChapterName = null;
            Long matchedChapterId = null;
            JsonNode matches = root.path("layer1_reup").path("matches");
            if (matches.isArray() && matches.size() > 0) {
                matchedChapterName = matches.get(0).path("matchedChapter").asText(null);
                JsonNode cidNode = matches.get(0).path("matchedChapterId");
                if (!cidNode.isMissingNode() && !cidNode.isNull()) {
                    matchedChapterId = cidNode.asLong();
                }
            }

            String reason = buildRejectReason(reupResult, reupScore, violResult, violScore, matchedChapterName);

            return new ModerationResult(
                    Decision.valueOf(decision),
                    reupScore, reupResult,
                    violScore, violResult,
                    reason,
                    matchedChapterId
            );

        } catch (Exception e) {
            log.warn("AI moderation service unavailable: {}", e.getMessage());
            // Nếu AI service down → cho qua nhưng đánh dấu cần xét duyệt thủ công
            return new ModerationResult(Decision.AI_UNAVAILABLE, 0, "UNKNOWN", 0, "UNKNOWN", null, null);
        }
    }

    /**
     * Gọi AI service kiểm duyệt chapter ảnh: pHash reup + NudeNet.
     * @param imageUrls      Danh sách URL ảnh các trang (ImageKit)
     * @param excludeComicId ID truyện hiện tại (tránh tự so sánh)
     */
    public ModerationResult moderateImages(List<String> imageUrls, Long excludeComicId) {
        if (imageUrls == null || imageUrls.isEmpty()) {
            return new ModerationResult(Decision.APPROVED, 0, "CLEAN", 0, "CLEAN", null, null);
        }
        try {
            String body = mapper.writeValueAsString(Map.of(
                    "imageUrls", imageUrls,
                    "excludeComicId", excludeComicId != null ? excludeComicId : 0
            ));
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(aiServiceUrl + "/moderate-images"))
                    .header("Content-Type", "application/json")
                    .timeout(Duration.ofSeconds(120))
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();

            HttpResponse<String> resp = httpClient.send(req, HttpResponse.BodyHandlers.ofString());
            if (resp.statusCode() != 200) {
                log.warn("AI image moderation returned status {}", resp.statusCode());
                return new ModerationResult(Decision.AI_UNAVAILABLE, 0, "UNKNOWN", 0, "UNKNOWN", null, null);
            }

            JsonNode root = mapper.readTree(resp.body());
            String decision   = root.path("decision").asText("APPROVED");
            double reupScore  = root.path("layer1_reup").path("score").asDouble(0);
            String reupResult = root.path("layer1_reup").path("result").asText("CLEAN");

            Long matchedChapterId = null;
            JsonNode cidNode = root.path("layer1_reup").path("matchedChapterId");
            if (!cidNode.isMissingNode() && !cidNode.isNull()) matchedChapterId = cidNode.asLong();

            String matchedChapterTitle = root.path("layer1_reup").path("matchedChapterTitle").asText("");
            String matchedComicTitle   = root.path("layer1_reup").path("matchedComicTitle").asText("");

            JsonNode nudity    = root.path("layer2_nudity");
            String nudResult   = nudity.path("result").asText("CLEAN");
            String nudLabel    = nudity.path("label").asText("");
            double nudScore    = nudity.path("score").asDouble(0);

            String reason = buildImageRejectReason(reupResult, reupScore, nudResult, nudLabel, nudScore, matchedComicTitle, matchedChapterTitle);

            return new ModerationResult(
                    Decision.valueOf(decision),
                    reupScore, reupResult,
                    nudScore, nudResult,
                    reason, matchedChapterId
            );
        } catch (Exception e) {
            log.warn("AI image moderation unavailable: {}", e.getMessage());
            return new ModerationResult(Decision.AI_UNAVAILABLE, 0, "UNKNOWN", 0, "UNKNOWN", null, null);
        }
    }

    /**
     * Index pHash ảnh của chapter vừa xuất bản vào kho AI.
     */
    public void indexImageChapter(Long comicId, Long chapterId, String title, List<String> imageUrls) {
        if (imageUrls == null || imageUrls.isEmpty()) return;
        try {
            String body = mapper.writeValueAsString(Map.of(
                    "comicId", comicId,
                    "chapterId", chapterId,
                    "title", title != null ? title : "",
                    "imageUrls", imageUrls
            ));
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(aiServiceUrl + "/index-image-chapter"))
                    .header("Content-Type", "application/json")
                    .timeout(Duration.ofSeconds(120))
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();
            httpClient.send(req, HttpResponse.BodyHandlers.ofString());
        } catch (Exception e) {
            log.warn("Failed to index image chapter for reup detection: {}", e.getMessage());
        }
    }

    private String buildImageRejectReason(String reupResult, double reupScore,
                                          String nudResult, String nudLabel, double nudScore,
                                          String matchedComicTitle, String matchedChapterTitle) {
        StringBuilder sb = new StringBuilder();
        if ("REUP".equals(reupResult)) {
            sb.append(String.format("Phát hiện ảnh trùng lặp (%.0f%% trang giống nhau)", reupScore * 100));
            if (matchedComicTitle != null && !matchedComicTitle.isBlank()) {
                sb.append(" với truyện \"").append(matchedComicTitle).append("\"");
                if (matchedChapterTitle != null && !matchedChapterTitle.isBlank())
                    sb.append(" — ").append(matchedChapterTitle);
            }
            sb.append(". ");
        } else if ("SUSPICIOUS".equals(reupResult)) {
            sb.append(String.format("Nghi ngờ ảnh trùng lặp (%.0f%% trang tương đồng)", reupScore * 100));
            if (matchedComicTitle != null && !matchedComicTitle.isBlank())
                sb.append(" với truyện \"").append(matchedComicTitle).append("\"");
            sb.append(". ");
        }
        if ("VIOLATION".equals(nudResult)) {
            sb.append(String.format("⚠️ AI phát hiện nội dung vi phạm (score: %.0f%%). ", nudScore * 100));
        } else if ("PENDING".equals(nudResult) || "model-error".equals(nudLabel)) {
            sb.append("🔧 Model AI chưa sẵn sàng khi đăng — chưa kiểm tra được nội dung hình ảnh, cần admin xét thủ công. ");
        } else if ("SUSPICIOUS".equals(nudResult)) {
            sb.append(String.format("⚠️ AI nghi ngờ nội dung hình ảnh (score: %.0f%%) — cần xem xét. ", nudScore * 100));
        }
        return sb.isEmpty() ? null : sb.toString().trim();
    }

    /**
     * Gọi AI service để index chương vừa được xuất bản vào kho so sánh reup.
     */
    public void indexChapter(Long comicId, Long chapterId, String title, String content) {
        if (content == null || content.isBlank()) return;
        try {
            String body = mapper.writeValueAsString(Map.of(
                    "comicId", comicId,
                    "chapterId", chapterId,
                    "title", title != null ? title : "",
                    "content", content
            ));
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(aiServiceUrl + "/index-chapter"))
                    .header("Content-Type", "application/json")
                    .timeout(Duration.ofSeconds(30))
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();
            httpClient.send(req, HttpResponse.BodyHandlers.ofString());
        } catch (Exception e) {
            log.warn("Failed to index chapter for reup detection: {}", e.getMessage());
        }
    }

    private String buildRejectReason(String reupResult, double reupScore,
                                     String violResult, double violScore,
                                     String matchedChapterName) {
        StringBuilder sb = new StringBuilder();
        if ("REUP".equals(reupResult)) {
            sb.append(String.format("Phát hiện nội dung trùng lặp (%.0f%%)", reupScore * 100));
            if (matchedChapterName != null) sb.append(" với \"").append(matchedChapterName).append("\"");
            sb.append(". ");
        } else if ("SUSPICIOUS".equals(reupResult)) {
            sb.append(String.format("Nghi ngờ nội dung tương đồng với truyện khác (%.0f%%)", reupScore * 100));
            if (matchedChapterName != null) sb.append(": \"").append(matchedChapterName).append("\"");
            sb.append(". ");
        }
        if ("VIOLATION".equals(violResult)) {
            sb.append(String.format("Phát hiện nội dung vi phạm (điểm: %.0f%%). ", violScore * 100));
        } else if ("SUSPICIOUS".equals(violResult)) {
            sb.append(String.format("Nghi ngờ nội dung vi phạm quy định (%.0f%%). ", violScore * 100));
        }
        return sb.isEmpty() ? null : sb.toString().trim();
    }
}
