package com.toptruyen.backend.controller;

import com.toptruyen.backend.service.AuthorAnalyticsService;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Map;

@RestController
@RequestMapping("/api/author")
public class AuthorAnalyticsController {

    private static final String SESSION_USER_ID = "SESSION_USER_ID";
    private static final Logger log = LoggerFactory.getLogger(AuthorAnalyticsController.class);

    private final AuthorAnalyticsService authorAnalyticsService;

    public AuthorAnalyticsController(AuthorAnalyticsService authorAnalyticsService) {
        this.authorAnalyticsService = authorAnalyticsService;
    }

    @GetMapping("/comics/{comicId}/reports")
    public ResponseEntity<?> getComicReports(@PathVariable Long comicId, HttpSession session) {
        Long userId = getSessionUserId(session);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Chưa đăng nhập"));
        }
        try {
            return ResponseEntity.ok(authorAnalyticsService.getComicReports(userId, comicId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/reports/{reportId}/appeal-status")
    public ResponseEntity<?> getAppealStatus(@PathVariable Long reportId, HttpSession session) {
        Long userId = getSessionUserId(session);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Chưa đăng nhập"));
        }
        try {
            return ResponseEntity.ok(authorAnalyticsService.getAppealStatus(userId, reportId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/my-comics-stats")
    public ResponseEntity<?> getAllMyComicsStats(HttpSession session) {
        Long userId = getSessionUserId(session);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Chưa đăng nhập"));
        }
        try {
            return ResponseEntity.ok(authorAnalyticsService.getAllMyComicsStats(userId));
        } catch (Exception e) {
            log.error("Lỗi tải thống kê truyện cho user {}: {}", userId, e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of("message", "Lỗi tải thống kê: " + e.getMessage()));
        }
    }

    @GetMapping("/comics/{comicId}/stats")
    public ResponseEntity<?> getComicStats(@PathVariable Long comicId, HttpSession session) {
        Long userId = getSessionUserId(session);
        if (userId == null) {
            return ResponseEntity.status(401).body("Not logged in");
        }

        try {
            return ResponseEntity.ok(authorAnalyticsService.getComicStats(userId, comicId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/comics/{comicId}/reported-comments")
    public ResponseEntity<?> getReportedComments(@PathVariable Long comicId, HttpSession session) {
        Long userId = getSessionUserId(session);
        if (userId == null) {
            return ResponseEntity.status(401).body("Not logged in");
        }

        try {
            return ResponseEntity.ok(authorAnalyticsService.getReportedComments(userId, comicId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/reports/{reportId}")
    public ResponseEntity<?> dismissReport(@PathVariable Long reportId, HttpSession session) {
        Long userId = getSessionUserId(session);
        if (userId == null) {
            return ResponseEntity.status(401).body("Not logged in");
        }

        try {
            authorAnalyticsService.dismissReport(userId, reportId);
            return ResponseEntity.ok(Map.of("success", true, "message", "Da huy bao cao"));
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
}
