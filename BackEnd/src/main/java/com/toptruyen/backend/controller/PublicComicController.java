package com.toptruyen.backend.controller;

import com.toptruyen.backend.dto.AuthorProfileResponse;
import com.toptruyen.backend.dto.PublicChapterDetailResponse;
import com.toptruyen.backend.dto.PublicComicDetailResponse;
import com.toptruyen.backend.dto.PublicComicListResponse;
import com.toptruyen.backend.dto.SearchComicsRequest;
import com.toptruyen.backend.dto.SearchComicsResponse;
import com.toptruyen.backend.dto.SearchComicsResultItem;

import java.util.List;
import com.toptruyen.backend.service.PublicComicService;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/public/comics")
public class PublicComicController {

    private static final String SESSION_USER_ID = "SESSION_USER_ID";

    private final PublicComicService publicComicService;

    public PublicComicController(PublicComicService publicComicService) {
        this.publicComicService = publicComicService;
    }

    @GetMapping
    public PublicComicListResponse list(
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size
    ) {
        return publicComicService.getPublishedComics(page, Math.min(size, 60));
    }

    @GetMapping("/{slug}")
    public ResponseEntity<PublicComicDetailResponse> detail(@PathVariable String slug) {
        PublicComicDetailResponse response = publicComicService.getComicDetail(slug);
        if (response == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(response);
    }

    @GetMapping("/search")
    public SearchComicsResponse search(
            @RequestParam(name = "q", required = false, defaultValue = "") String query,
            @RequestParam(name = "category", required = false, defaultValue = "") String category,
            @RequestParam(name = "status", required = false, defaultValue = "") String status,
            @RequestParam(name = "sort", required = false, defaultValue = "updated") String sortBy,
            @RequestParam(name = "paidType", required = false, defaultValue = "") String paidType,
            @RequestParam(name = "page", required = false, defaultValue = "0") int page,
            @RequestParam(name = "size", required = false, defaultValue = "20") int size
    ) {
        return publicComicService.searchComics(new SearchComicsRequest(query, category, status, sortBy, paidType, page, size));
    }

    @GetMapping("/author/{authorName}")
    public List<SearchComicsResultItem> byAuthor(@PathVariable String authorName) {
        return publicComicService.getComicsByAuthor(authorName);
    }

    @GetMapping("/author-profile/{authorName}")
    public ResponseEntity<AuthorProfileResponse> authorProfile(@PathVariable String authorName) {
        AuthorProfileResponse profile = publicComicService.getAuthorProfile(authorName);
        if (profile == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(profile);
    }

    @GetMapping("/author-profile/{authorName}/reading-list")
    public ResponseEntity<?> authorReadingList(@PathVariable String authorName) {
        return ResponseEntity.ok(publicComicService.getAuthorReadingList(authorName));
    }

    @GetMapping("/author-profile/{authorName}/followers")
    public ResponseEntity<?> authorFollowers(@PathVariable String authorName) {
        return ResponseEntity.ok(publicComicService.getAuthorFollowers(authorName));
    }

    @GetMapping("/{slug}/related")
    public List<SearchComicsResultItem> related(
            @PathVariable String slug,
            @RequestParam(name = "categories", required = false, defaultValue = "") String categories,
            @RequestParam(name = "limit", defaultValue = "6") int limit
    ) {
        return publicComicService.getRelatedComics(slug, categories, Math.min(limit, 12));
    }

    @GetMapping("/chapters/{chapterId}")
    public ResponseEntity<PublicChapterDetailResponse> chapterDetail(
            @PathVariable Long chapterId,
            HttpSession session
    ) {
        Long userId = getSessionUserId(session);
        PublicChapterDetailResponse response = publicComicService.getChapterDetail(chapterId, userId);
        if (response == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(response);
    }

    @PostMapping("/chapters/{chapterId}/unlock")
    public ResponseEntity<?> unlockChapter(@PathVariable Long chapterId, HttpSession session) {
        Long userId = getSessionUserId(session);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Bạn cần đăng nhập để mở khóa chapter"));
        }
        try {
            publicComicService.unlockChapter(userId, chapterId);
            return ResponseEntity.ok(Map.of("success", true, "message", "Mở khóa chapter thành công"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    private Long getSessionUserId(HttpSession session) {
        Object userId = session.getAttribute(SESSION_USER_ID);
        if (userId == null) return null;
        return ((Number) userId).longValue();
    }
}
