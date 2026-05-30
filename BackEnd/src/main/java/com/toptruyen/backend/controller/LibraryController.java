package com.toptruyen.backend.controller;

import com.toptruyen.backend.dto.LibraryFollowItem;
import com.toptruyen.backend.dto.LibraryFollowStatusResponse;
import com.toptruyen.backend.dto.LibraryHistoryItem;
import com.toptruyen.backend.service.LibraryService;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/library")
public class LibraryController {

    private static final String SESSION_USER_ID = "SESSION_USER_ID";

    private final LibraryService libraryService;

    public LibraryController(LibraryService libraryService) {
        this.libraryService = libraryService;
    }

    @GetMapping("/follows")
    public ResponseEntity<?> getFollows(HttpSession session) {
        Long userId = getSessionUserId(session);
        if (userId == null) {
            return unauthorized();
        }

        List<LibraryFollowItem> items = libraryService.getFollowedComics(userId);
        return ResponseEntity.ok(items);
    }

    @GetMapping("/follows/{comicId}/status")
    public ResponseEntity<?> getFollowStatus(@PathVariable Long comicId, HttpSession session) {
        Long userId = getSessionUserId(session);
        if (userId == null) {
            return unauthorized();
        }

        return ResponseEntity.ok(new LibraryFollowStatusResponse(comicId, libraryService.isFollowing(userId, comicId)));
    }

    @PostMapping("/follows/{comicId}")
    public ResponseEntity<?> follow(@PathVariable Long comicId, HttpSession session) {
        Long userId = getSessionUserId(session);
        if (userId == null) {
            return unauthorized();
        }

        try {
            libraryService.followComic(userId, comicId);
            return ResponseEntity.ok(Map.of("success", true, "message", "Da theo doi truyen"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/follows/{comicId}")
    public ResponseEntity<?> unfollow(@PathVariable Long comicId, HttpSession session) {
        Long userId = getSessionUserId(session);
        if (userId == null) {
            return unauthorized();
        }

        libraryService.unfollowComic(userId, comicId);
        return ResponseEntity.ok(Map.of("success", true, "message", "Da bo theo doi truyen"));
    }

    @GetMapping("/history")
    public ResponseEntity<?> getReadHistory(HttpSession session) {
        Long userId = getSessionUserId(session);
        if (userId == null) {
            return unauthorized();
        }

        List<LibraryHistoryItem> items = libraryService.getReadHistory(userId);
        return ResponseEntity.ok(items);
    }

    @PostMapping("/history/chapters/{chapterId}")
    public ResponseEntity<?> markChapterRead(@PathVariable Long chapterId, HttpSession session) {
        Long userId = getSessionUserId(session);
        if (userId == null) {
            return unauthorized();
        }

        try {
            libraryService.markChapterRead(userId, chapterId);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/history/{comicId}")
    public ResponseEntity<?> deleteHistoryItem(@PathVariable Long comicId, HttpSession session) {
        Long userId = getSessionUserId(session);
        if (userId == null) return unauthorized();
        libraryService.deleteHistoryItem(userId, comicId);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @DeleteMapping("/history")
    public ResponseEntity<?> clearAllHistory(HttpSession session) {
        Long userId = getSessionUserId(session);
        if (userId == null) return unauthorized();
        libraryService.clearAllHistory(userId);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @GetMapping("/author-follows/{authorName}/status")
    public ResponseEntity<?> getAuthorFollowStatus(@PathVariable String authorName, HttpSession session) {
        Long userId = getSessionUserId(session);
        if (userId == null) return ResponseEntity.ok(Map.of("following", false));
        return ResponseEntity.ok(Map.of("following", libraryService.isFollowingAuthor(userId, authorName)));
    }

    @PostMapping("/author-follows/{authorName}")
    public ResponseEntity<?> followAuthor(@PathVariable String authorName, HttpSession session) {
        Long userId = getSessionUserId(session);
        if (userId == null) return unauthorized();
        try {
            libraryService.followAuthor(userId, authorName);
            return ResponseEntity.ok(Map.of("success", true, "message", "Đã theo dõi tác giả"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/author-follows/{authorName}")
    public ResponseEntity<?> unfollowAuthor(@PathVariable String authorName, HttpSession session) {
        Long userId = getSessionUserId(session);
        if (userId == null) return unauthorized();
        libraryService.unfollowAuthor(userId, authorName);
        return ResponseEntity.ok(Map.of("success", true, "message", "Đã bỏ theo dõi tác giả"));
    }

    @PatchMapping("/follows/{comicId}/status")
    public ResponseEntity<?> updateFollowStatus(@PathVariable Long comicId,
            @RequestBody Map<String, String> body, HttpSession session) {
        Long userId = getSessionUserId(session);
        if (userId == null) return unauthorized();
        String status = body.get("readStatus");
        if (status == null || status.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Thiếu trạng thái"));
        }
        try {
            libraryService.updateFollowStatus(userId, comicId, status);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    private Long getSessionUserId(HttpSession session) {
        Object userId = session.getAttribute(SESSION_USER_ID);
        if (userId == null) {
            return null;
        }
        return ((Number) userId).longValue();
    }

    private ResponseEntity<Map<String, String>> unauthorized() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("message", "Ban can dang nhap"));
    }
}
