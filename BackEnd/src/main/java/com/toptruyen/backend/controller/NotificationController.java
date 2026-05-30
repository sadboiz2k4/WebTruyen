package com.toptruyen.backend.controller;

import com.toptruyen.backend.dto.NotificationResponse;
import com.toptruyen.backend.service.NotificationService;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private static final String SESSION_USER_ID = "SESSION_USER_ID";

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public ResponseEntity<?> getNotifications(
            HttpSession session,
            @RequestParam(name = "limit", required = false, defaultValue = "20") int limit
    ) {
        Long userId = getSessionUserId(session);
        if (userId == null) {
            return ResponseEntity.status(401).body("Not logged in");
        }
        return ResponseEntity.ok(notificationService.getNotifications(userId, limit));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<?> getUnreadCount(HttpSession session) {
        Long userId = getSessionUserId(session);
        if (userId == null) {
            return ResponseEntity.status(401).body("Not logged in");
        }
        return ResponseEntity.ok(notificationService.getUnreadCount(userId));
    }

    @PostMapping("/{notificationId}/read")
    public ResponseEntity<?> markAsRead(
            HttpSession session,
            @PathVariable Long notificationId
    ) {
        Long userId = getSessionUserId(session);
        if (userId == null) {
            return ResponseEntity.status(401).body("Not logged in");
        }
        notificationService.markAsRead(userId, notificationId);
        return ResponseEntity.ok("OK");
    }

    @PostMapping("/read-all")
    public ResponseEntity<?> markAllAsRead(HttpSession session) {
        Long userId = getSessionUserId(session);
        if (userId == null) {
            return ResponseEntity.status(401).body("Not logged in");
        }
        notificationService.markAllAsRead(userId);
        return ResponseEntity.ok("OK");
    }

    private Long getSessionUserId(HttpSession session) {
        Object userId = session.getAttribute(SESSION_USER_ID);
        if (userId == null) {
            return null;
        }
        return ((Number) userId).longValue();
    }
}
