package com.toptruyen.backend.service;

import com.toptruyen.backend.dto.NotificationItem;
import com.toptruyen.backend.dto.NotificationResponse;
import jakarta.annotation.PostConstruct;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class NotificationService {

    private final JdbcTemplate jdbcTemplate;

    public NotificationService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @PostConstruct
    public void createTableIfNotExists() {
        try {
            jdbcTemplate.execute("""
                    CREATE TABLE IF NOT EXISTS notifications (
                        id BIGINT AUTO_INCREMENT PRIMARY KEY,
                        user_id BIGINT NOT NULL,
                        type VARCHAR(50) NOT NULL,
                        title VARCHAR(255) NOT NULL,
                        message TEXT,
                        related_id BIGINT,
                        related_url VARCHAR(500),
                        is_read BOOLEAN DEFAULT FALSE,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        INDEX (user_id, is_read, created_at)
                    )
                    """);
            jdbcTemplate.execute(
                    "ALTER TABLE notifications ADD COLUMN IF NOT EXISTS related_url VARCHAR(500)"
            );
        } catch (Exception e) {
            System.err.println("Error creating notifications table: " + e.getMessage());
        }
    }

    public NotificationResponse getNotifications(Long userId, int limit) {
        limit = Math.min(limit, 50);

        List<NotificationItem> notifications = jdbcTemplate.query("""
                        SELECT id, type, title, message, related_id, related_url, is_read, DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') AS created_at
                        FROM notifications
                        WHERE user_id = ?
                        ORDER BY created_at DESC
                        LIMIT ?
                        """,
                (rs, rowNum) -> new NotificationItem(
                        rs.getLong("id"),
                        rs.getString("type"),
                        rs.getString("title"),
                        rs.getString("message"),
                        (Long) rs.getObject("related_id"),
                        rs.getString("related_url"),
                        rs.getBoolean("is_read"),
                        rs.getString("created_at")
                ),
                userId, limit
        );

        Long unreadCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(1) FROM notifications WHERE user_id = ? AND is_read = FALSE",
                Long.class,
                userId
        );
        unreadCount = unreadCount == null ? 0 : unreadCount;

        int totalCount = notifications.size();

        return new NotificationResponse(notifications, unreadCount, totalCount);
    }

    public void markAsRead(Long userId, Long notificationId) {
        jdbcTemplate.update(
                "UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?",
                notificationId, userId
        );
    }

    public void markAllAsRead(Long userId) {
        jdbcTemplate.update(
                "UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE",
                userId
        );
    }

    public void createNotification(Long userId, String type, String title, String message, Long relatedId, String relatedUrl) {
        jdbcTemplate.update(
                "INSERT INTO notifications (user_id, type, title, message, related_id, related_url) VALUES (?, ?, ?, ?, ?, ?)",
                userId, type, title, message, relatedId, relatedUrl
        );
    }

    public Long getUnreadCount(Long userId) {
        Long count = jdbcTemplate.queryForObject(
                "SELECT COUNT(1) FROM notifications WHERE user_id = ? AND is_read = FALSE",
                Long.class,
                userId
        );
        return count == null ? 0 : count;
    }

    public void sendNotificationToUser(Long userId, String title, String message, String type, Long relatedId) {
        createNotification(userId, type, title, message, relatedId, null);
    }
}
