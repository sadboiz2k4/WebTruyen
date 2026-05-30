package com.toptruyen.backend.controller;

import com.toptruyen.backend.dto.AuthorPostCommentItem;
import com.toptruyen.backend.dto.AuthorPostItem;
import com.toptruyen.backend.dto.CommentItemResponse;
import com.toptruyen.backend.dto.ComicRatingSummaryResponse;
import com.toptruyen.backend.dto.CreateCommentRequest;
import com.toptruyen.backend.dto.RateComicRequest;
import com.toptruyen.backend.dto.CommentReplyRequest;
import com.toptruyen.backend.dto.ReportCommentRequest;
import com.toptruyen.backend.dto.ReportContentRequest;
import com.toptruyen.backend.service.InteractionService;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class InteractionController {

    private static final String SESSION_USER_ID = "SESSION_USER_ID";

    private final InteractionService interactionService;

    public InteractionController(InteractionService interactionService) {
        this.interactionService = interactionService;
    }

    @GetMapping("/public/interactions/chapters/{chapterId}/comments")
    public ResponseEntity<?> getChapterComments(
            @PathVariable Long chapterId,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size,
            HttpSession session) {
        try {
            List<CommentItemResponse> comments = interactionService.getChapterComments(
                    chapterId, getSessionUserId(session), page, Math.min(size, 50));
            return ResponseEntity.ok(comments);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/interactions/chapters/{chapterId}/comments")
    public ResponseEntity<?> createComment(@PathVariable Long chapterId, @Valid @RequestBody CreateCommentRequest request, HttpSession session) {
        Long userId = getSessionUserId(session);
        if (userId == null) {
            return unauthorized();
        }

        try {
            interactionService.createComment(userId, chapterId, request.content());
            return ResponseEntity.ok(Map.of("success", true, "message", "Da gui binh luan"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/interactions/comments/{commentId}")
    public ResponseEntity<?> deleteComment(@PathVariable Long commentId, HttpSession session) {
        Long userId = getSessionUserId(session);
        if (userId == null) {
            return unauthorized();
        }

        try {
            interactionService.deleteComment(userId, commentId);
            return ResponseEntity.ok(Map.of("success", true, "message", "Da xoa binh luan"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/public/interactions/comics/{comicId}/rating")
    public ResponseEntity<?> getComicRating(@PathVariable Long comicId, HttpSession session) {
        try {
            ComicRatingSummaryResponse response = interactionService.getComicRatingSummary(comicId, getSessionUserId(session));
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/interactions/comics/{comicId}/rating")
    public ResponseEntity<?> rateComic(@PathVariable Long comicId, @Valid @RequestBody RateComicRequest request, HttpSession session) {
        Long userId = getSessionUserId(session);
        if (userId == null) {
            return unauthorized();
        }

        try {
            interactionService.rateComic(userId, comicId, request.rating());
            return ResponseEntity.ok(Map.of("success", true, "message", "Da ghi nhan danh gia"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/public/interactions/comments/{parentCommentId}/replies")
    public ResponseEntity<?> getCommentReplies(@PathVariable Long parentCommentId) {
        try {
            return ResponseEntity.ok(interactionService.getCommentReplies(parentCommentId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/interactions/comments/{parentCommentId}/replies")
    public ResponseEntity<?> createCommentReply(@PathVariable Long parentCommentId, @Valid @RequestBody CommentReplyRequest request, HttpSession session) {
        Long userId = getSessionUserId(session);
        if (userId == null) {
            return unauthorized();
        }

        try {
            interactionService.createCommentReply(userId, parentCommentId, request.content());
            return ResponseEntity.ok(Map.of("success", true, "message", "Da gui tra loi"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/interactions/replies/{replyId}")
    public ResponseEntity<?> deleteCommentReply(@PathVariable Long replyId, HttpSession session) {
        Long userId = getSessionUserId(session);
        if (userId == null) {
            return unauthorized();
        }

        try {
            interactionService.deleteCommentReply(userId, replyId);
            return ResponseEntity.ok(Map.of("success", true, "message", "Da xoa tra loi"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/interactions/comments/{commentId}/report")
    public ResponseEntity<?> reportComment(@PathVariable Long commentId, @Valid @RequestBody ReportCommentRequest request, HttpSession session) {
        Long userId = getSessionUserId(session);
        if (userId == null) {
            return unauthorized();
        }

        try {
            Long reportId = interactionService.reportComment(userId, commentId, request.reason());
            return ResponseEntity.ok(Map.of("success", true, "message", "Da gui bao cao", "reportId", reportId, "reportScope", "COMMENT"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/public/interactions/comics/{comicId}/discussion")
    public ResponseEntity<?> getComicDiscussionComments(
            @PathVariable Long comicId,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size,
            HttpSession session) {
        try {
            List<CommentItemResponse> comments = interactionService.getComicDiscussionComments(
                    comicId, getSessionUserId(session), page, Math.min(size, 50));
            return ResponseEntity.ok(comments);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/interactions/comics/{comicId}/discussion")
    public ResponseEntity<?> createComicDiscussionComment(
            @PathVariable Long comicId,
            @Valid @RequestBody CreateCommentRequest request,
            HttpSession session) {
        Long userId = getSessionUserId(session);
        if (userId == null) return unauthorized();
        try {
            interactionService.createComicDiscussionComment(userId, comicId, request.content());
            return ResponseEntity.ok(Map.of("success", true, "message", "Da gui binh luan"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/interactions/comics/comments/{commentId}")
    public ResponseEntity<?> deleteComicDiscussionComment(@PathVariable Long commentId, HttpSession session) {
        Long userId = getSessionUserId(session);
        if (userId == null) return unauthorized();
        try {
            interactionService.deleteComicDiscussionComment(userId, commentId);
            return ResponseEntity.ok(Map.of("success", true, "message", "Da xoa binh luan"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/public/interactions/comics/comments/{parentCommentId}/replies")
    public ResponseEntity<?> getComicDiscussionReplies(@PathVariable Long parentCommentId) {
        try {
            return ResponseEntity.ok(interactionService.getComicDiscussionReplies(parentCommentId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/interactions/comics/comments/{parentCommentId}/replies")
    public ResponseEntity<?> createComicDiscussionReply(
            @PathVariable Long parentCommentId,
            @Valid @RequestBody CommentReplyRequest request,
            HttpSession session) {
        Long userId = getSessionUserId(session);
        if (userId == null) return unauthorized();
        try {
            interactionService.createComicDiscussionReply(userId, parentCommentId, request.content());
            return ResponseEntity.ok(Map.of("success", true, "message", "Da gui tra loi"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/interactions/comics/replies/{replyId}")
    public ResponseEntity<?> deleteComicDiscussionReply(@PathVariable Long replyId, HttpSession session) {
        Long userId = getSessionUserId(session);
        if (userId == null) return unauthorized();
        try {
            interactionService.deleteComicDiscussionReply(userId, replyId);
            return ResponseEntity.ok(Map.of("success", true, "message", "Da xoa tra loi"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/public/interactions/author/{authorName}/posts")
    public ResponseEntity<?> getAuthorPosts(
            @PathVariable String authorName,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size,
            HttpSession session) {
        try {
            List<AuthorPostItem> posts = interactionService.getAuthorPosts(
                    authorName, getSessionUserId(session), page, Math.min(size, 50));
            return ResponseEntity.ok(posts);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/interactions/author/{authorName}/posts")
    public ResponseEntity<?> createAuthorPost(
            @PathVariable String authorName,
            @Valid @RequestBody CreateCommentRequest request,
            HttpSession session) {
        Long userId = getSessionUserId(session);
        if (userId == null) return unauthorized();
        try {
            interactionService.createAuthorPost(userId, authorName, request.content());
            return ResponseEntity.ok(Map.of("success", true, "message", "Da dang bai"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/interactions/author/posts/{postId}")
    public ResponseEntity<?> deleteAuthorPost(@PathVariable Long postId, HttpSession session) {
        Long userId = getSessionUserId(session);
        if (userId == null) return unauthorized();
        try {
            interactionService.deleteAuthorPost(userId, postId);
            return ResponseEntity.ok(Map.of("success", true, "message", "Da xoa bai dang"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/public/interactions/author/posts/{postId}/comments")
    public ResponseEntity<?> getAuthorPostComments(
            @PathVariable Long postId,
            @RequestParam(name = "authorName", defaultValue = "") String authorName,
            HttpSession session) {
        try {
            List<AuthorPostCommentItem> comments = interactionService.getAuthorPostComments(
                    postId, authorName, getSessionUserId(session));
            return ResponseEntity.ok(comments);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/interactions/author/posts/{postId}/comments")
    public ResponseEntity<?> createAuthorPostComment(
            @PathVariable Long postId,
            @Valid @RequestBody CreateCommentRequest request,
            HttpSession session) {
        Long userId = getSessionUserId(session);
        if (userId == null) return unauthorized();
        try {
            interactionService.createAuthorPostComment(userId, postId, request.content());
            return ResponseEntity.ok(Map.of("success", true, "message", "Da gui binh luan"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/interactions/author/posts/comments/{commentId}")
    public ResponseEntity<?> deleteAuthorPostComment(@PathVariable Long commentId, HttpSession session) {
        Long userId = getSessionUserId(session);
        if (userId == null) return unauthorized();
        try {
            interactionService.deleteAuthorPostComment(userId, commentId);
            return ResponseEntity.ok(Map.of("success", true, "message", "Da xoa binh luan"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/interactions/content-report")
    public ResponseEntity<?> reportContent(@RequestBody ReportContentRequest request, HttpSession session) {
        Long userId = getSessionUserId(session);
        if (userId == null) {
            return unauthorized();
        }
        try {
            Long reportId = interactionService.reportContent(userId, request.targetType(), request.targetId(), request.reason());
            return ResponseEntity.ok(Map.of("success", true, "message", "Đã gửi báo cáo vi phạm", "reportId", reportId, "reportScope", "CONTENT"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/interactions/reports/{reportId}/appeal")
    public ResponseEntity<?> appealReport(
            @PathVariable Long reportId,
            @RequestBody Map<String, String> body,
            HttpSession session) {
        Long userId = getSessionUserId(session);
        if (userId == null) {
            return unauthorized();
        }
        try {
            interactionService.createReportAppeal(userId, body.get("scope"), reportId, body.get("message"));
            return ResponseEntity.ok(Map.of("success", true, "message", "Đã gửi kháng nghị"));
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
