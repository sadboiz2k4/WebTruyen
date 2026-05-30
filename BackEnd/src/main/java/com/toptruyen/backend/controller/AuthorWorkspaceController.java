package com.toptruyen.backend.controller;

import com.toptruyen.backend.dto.AuthorComicItem;
import com.toptruyen.backend.dto.AuthorDraftRequest;
import com.toptruyen.backend.dto.AuthorDraftResponse;
import com.toptruyen.backend.dto.DeletePublishedChapterResponse;
import com.toptruyen.backend.dto.PublishComicResponse;
import com.toptruyen.backend.service.AuthorWorkspaceService;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/author-workspace")
public class AuthorWorkspaceController {

    private static final String SESSION_USER_ID = "SESSION_USER_ID";

    private final AuthorWorkspaceService authorWorkspaceService;

    public AuthorWorkspaceController(AuthorWorkspaceService authorWorkspaceService) {
        this.authorWorkspaceService = authorWorkspaceService;
    }

    @GetMapping("/my-comics")
    public ResponseEntity<?> getMyComics(HttpSession session) {
        Object userId = session.getAttribute(SESSION_USER_ID);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Ban can dang nhap de su dung workspace sang tac"));
        }

        List<AuthorComicItem> comics = authorWorkspaceService.getMyComics(((Number) userId).longValue());
        return ResponseEntity.ok(comics);
    }

    @GetMapping("/drafts/{mode}")
    public ResponseEntity<?> getDraft(@PathVariable String mode, HttpSession session) {
        Object userId = session.getAttribute(SESSION_USER_ID);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Ban can dang nhap de su dung workspace sang tac"));
        }

        try {
            AuthorDraftResponse response = authorWorkspaceService.getDraft(((Number) userId).longValue(), mode);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/drafts/{mode}")
    public ResponseEntity<?> saveDraft(@PathVariable String mode, @RequestBody AuthorDraftRequest request, HttpSession session) {
        Object userId = session.getAttribute(SESSION_USER_ID);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Ban can dang nhap de su dung workspace sang tac"));
        }

        try {
            AuthorDraftResponse response = authorWorkspaceService.saveDraft(((Number) userId).longValue(), mode, request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/publish/{mode}")
    public ResponseEntity<?> publish(@PathVariable String mode,
            @RequestBody(required = false) Map<String, String> body,
            HttpSession session) {
        Object userId = session.getAttribute(SESSION_USER_ID);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Ban can dang nhap de su dung workspace sang tac"));
        }

        String scheduledAt = body != null ? body.get("scheduledAt") : null;
        try {
            PublishComicResponse response = authorWorkspaceService.publishDraft(((Number) userId).longValue(), mode, scheduledAt);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PatchMapping("/comics/{slug}/info")
    public ResponseEntity<?> updateStoryInfo(@PathVariable String slug, @RequestBody Map<String, String> body, HttpSession session) {
        Object userId = session.getAttribute(SESSION_USER_ID);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Ban can dang nhap de su dung workspace sang tac"));
        }

        String title = body.getOrDefault("title", "").trim();
        if (title.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Ten truyen khong duoc de trong"));
        }

        try {
            authorWorkspaceService.updateStoryInfo(
                    ((Number) userId).longValue(), slug,
                    title, body.get("coverUrl"), body.get("description"), body.get("categories")
            );
            return ResponseEntity.ok(Map.of("success", true));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PatchMapping("/comics/{slug}/story-status")
    public ResponseEntity<?> updateStoryStatus(@PathVariable String slug, @RequestBody Map<String, String> body, HttpSession session) {
        Object userId = session.getAttribute(SESSION_USER_ID);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Ban can dang nhap de su dung workspace sang tac"));
        }

        String storyStatus = body.get("storyStatus");
        if (storyStatus == null || storyStatus.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Trang thai khong hop le"));
        }

        try {
            authorWorkspaceService.updateStoryStatus(((Number) userId).longValue(), slug, storyStatus);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/comics/{slug}/stats")
    public ResponseEntity<?> getStoryStats(@PathVariable String slug, HttpSession session) {
        Object userId = session.getAttribute(SESSION_USER_ID);
        if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Chua dang nhap"));
        try {
            return ResponseEntity.ok(authorWorkspaceService.getStoryStats(((Number) userId).longValue(), slug));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/chapters/swap")
    public ResponseEntity<?> swapChapters(@RequestBody Map<String, Long> body, HttpSession session) {
        Object userId = session.getAttribute(SESSION_USER_ID);
        if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Chua dang nhap"));
        Long id1 = body.get("chapterId1");
        Long id2 = body.get("chapterId2");
        if (id1 == null || id2 == null) return ResponseEntity.badRequest().body(Map.of("message", "Thieu chapter id"));
        try {
            authorWorkspaceService.swapChapterOrder(((Number) userId).longValue(), id1, id2);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/comics/{slug}")
    public ResponseEntity<?> deleteStory(@PathVariable String slug, HttpSession session) {
        Object userId = session.getAttribute(SESSION_USER_ID);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Ban can dang nhap de su dung workspace sang tac"));
        }

        try {
            authorWorkspaceService.deleteStory(((Number) userId).longValue(), slug);
            return ResponseEntity.ok(Map.of("success", true, "slug", slug));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/comics/{slug}/comments")
    public ResponseEntity<?> getStoryComments(@PathVariable String slug, HttpSession session) {
        Object userId = session.getAttribute(SESSION_USER_ID);
        if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Chua dang nhap"));
        try {
            return ResponseEntity.ok(authorWorkspaceService.getStoryComments(((Number) userId).longValue(), slug));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/comments/{commentId}")
    public ResponseEntity<?> deleteCommentAsAuthor(@PathVariable Long commentId, HttpSession session) {
        Object userId = session.getAttribute(SESSION_USER_ID);
        if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Chua dang nhap"));
        try {
            authorWorkspaceService.deleteCommentAsAuthor(((Number) userId).longValue(), commentId);
            return ResponseEntity.ok(Map.of("success", true, "message", "Đã xóa bình luận"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/comics/{slug}/revenue")
    public ResponseEntity<?> getRevenue(@PathVariable String slug, HttpSession session) {
        Object userId = session.getAttribute(SESSION_USER_ID);
        if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Chua dang nhap"));
        try {
            return ResponseEntity.ok(authorWorkspaceService.getRevenue(((Number) userId).longValue(), slug));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/revenue")
    public ResponseEntity<?> getAllRevenue(HttpSession session) {
        Object userId = session.getAttribute(SESSION_USER_ID);
        if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Chua dang nhap"));
        try {
            return ResponseEntity.ok(authorWorkspaceService.getAllRevenue(((Number) userId).longValue()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/revenue/monthly")
    public ResponseEntity<?> getMonthlyRevenue(HttpSession session) {
        Object userId = session.getAttribute(SESSION_USER_ID);
        if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Chua dang nhap"));
        return ResponseEntity.ok(authorWorkspaceService.getMonthlyRevenue(((Number) userId).longValue()));
    }

    @PostMapping("/drafts/{mode}/chapters/commit")
    public ResponseEntity<?> commitChapterDraft(@PathVariable String mode, HttpSession session) {
        Object userId = session.getAttribute(SESSION_USER_ID);
        if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Chua dang nhap"));
        try {
            return ResponseEntity.ok(authorWorkspaceService.commitChapterDraft(((Number) userId).longValue(), mode));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/drafts/{mode}/chapters/{draftChapterId}")
    public ResponseEntity<?> deleteDraftChapterById(@PathVariable String mode, @PathVariable Long draftChapterId, HttpSession session) {
        Object userId = session.getAttribute(SESSION_USER_ID);
        if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Chua dang nhap"));
        try {
            return ResponseEntity.ok(authorWorkspaceService.deleteDraftChapterById(((Number) userId).longValue(), mode, draftChapterId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/drafts/{mode}/chapters/{draftChapterId}/publish")
    public ResponseEntity<?> publishDraftChapterById(@PathVariable String mode, @PathVariable Long draftChapterId,
            @RequestBody(required = false) Map<String, String> body, HttpSession session) {
        Object userId = session.getAttribute(SESSION_USER_ID);
        if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Chua dang nhap"));
        String scheduledAt = body != null ? body.get("scheduledAt") : null;
        try {
            return ResponseEntity.ok(authorWorkspaceService.publishDraftChapterById(((Number) userId).longValue(), mode, draftChapterId, scheduledAt));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/chapters/{chapterId}")
    public ResponseEntity<?> deleteChapter(@PathVariable Long chapterId, HttpSession session) {
        Object userId = session.getAttribute(SESSION_USER_ID);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Ban can dang nhap de su dung workspace sang tac"));
        }

        try {
            DeletePublishedChapterResponse response = authorWorkspaceService.deletePublishedChapter(((Number) userId).longValue(), chapterId);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
