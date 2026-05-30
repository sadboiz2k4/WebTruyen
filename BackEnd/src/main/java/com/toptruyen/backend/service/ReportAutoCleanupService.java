package com.toptruyen.backend.service;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
public class ReportAutoCleanupService {

    private final JdbcTemplate jdbcTemplate;
    private final NotificationService notificationService;

    public ReportAutoCleanupService(JdbcTemplate jdbcTemplate, NotificationService notificationService) {
        this.jdbcTemplate = jdbcTemplate;
        this.notificationService = notificationService;
    }

    @Scheduled(cron = "0 0 0 * * ?")
    public void deleteUnappealedReportedContent() {
        sendDeletionReminders();

        var resolvedReports = jdbcTemplate.queryForList("""
                SELECT DISTINCT cr.target_type, cr.target_id
                FROM content_reports cr
                WHERE cr.status IN ('RESOLVED', 'FLAGGED')
                AND cr.reviewed_at IS NOT NULL
                AND DATE_ADD(cr.reviewed_at, INTERVAL 7 DAY) <= NOW()
                AND NOT EXISTS (
                    SELECT 1 FROM report_appeals ra
                    WHERE ra.report_scope = 'CONTENT'
                    AND ra.report_id = cr.id
                    AND ra.status = 'PENDING'
                )
                """);

        for (var report : resolvedReports) {
            String targetType = (String) report.get("target_type");
            Long targetId = ((Number) report.get("target_id")).longValue();

            if ("COMIC".equals(targetType)) {
                var rows = jdbcTemplate.queryForList(
                        "SELECT user_id, title FROM published_comics WHERE id = ?", targetId);
                if (!rows.isEmpty()) {
                    Long authorId = ((Number) rows.get(0).get("user_id")).longValue();
                    String title = (String) rows.get(0).get("title");
                    jdbcTemplate.update("DELETE FROM published_comics WHERE id = ?", targetId);
                    notificationService.sendNotificationToUser(
                            authorId,
                            "Truyện bị xóa vĩnh viễn",
                            "Truyện \"" + title + "\" đã bị xóa vĩnh viễn do vi phạm nội dung.",
                            "CONTENT_DELETED",
                            null
                    );
                }
            } else if ("CHAPTER".equals(targetType)) {
                var chRows = jdbcTemplate.queryForList(
                        "SELECT ch.title, pc.user_id, pc.title AS comic_title FROM published_chapters ch JOIN published_comics pc ON pc.id = ch.comic_id WHERE ch.id = ?",
                        targetId);
                if (!chRows.isEmpty()) {
                    Long authorId = ((Number) chRows.get(0).get("user_id")).longValue();
                    String chapterTitle = (String) chRows.get(0).get("title");
                    String comicTitle = (String) chRows.get(0).get("comic_title");
                    jdbcTemplate.update("DELETE FROM published_chapters WHERE id = ?", targetId);
                    notificationService.sendNotificationToUser(
                            authorId,
                            "Chương bị xóa vĩnh viễn",
                            "Chương \"" + chapterTitle + "\" của truyện \"" + comicTitle + "\" đã bị xóa vĩnh viễn.",
                            "CONTENT_DELETED",
                            null
                    );
                }
            }
        }
    }

    private void sendDeletionReminders() {
        // Tìm các report sắp bị xóa (còn đúng 2 ngày), chưa có appeal, chưa gửi reminder
        var upcomingReports = jdbcTemplate.queryForList("""
                SELECT cr.id, cr.target_type, cr.target_id
                FROM content_reports cr
                WHERE cr.status IN ('RESOLVED', 'FLAGGED')
                AND cr.reviewed_at IS NOT NULL
                AND DATE_ADD(cr.reviewed_at, INTERVAL 5 DAY) <= NOW()
                AND DATE_ADD(cr.reviewed_at, INTERVAL 7 DAY) > NOW()
                AND NOT EXISTS (
                    SELECT 1 FROM report_appeals ra
                    WHERE ra.report_scope = 'CONTENT'
                    AND ra.report_id = cr.id
                    AND ra.status = 'PENDING'
                )
                AND NOT EXISTS (
                    SELECT 1 FROM report_audit_logs ral
                    WHERE ral.report_scope = 'CONTENT'
                    AND ral.report_id = cr.id
                    AND ral.action = 'DELETION_REMINDER'
                )
                """);

        for (var report : upcomingReports) {
            Long reportId = ((Number) report.get("id")).longValue();
            String targetType = (String) report.get("target_type");
            Long targetId = ((Number) report.get("target_id")).longValue();

            if ("COMIC".equals(targetType)) {
                var rows = jdbcTemplate.queryForList(
                        "SELECT user_id, title FROM published_comics WHERE id = ?", targetId);
                if (!rows.isEmpty()) {
                    Long authorId = ((Number) rows.get(0).get("user_id")).longValue();
                    String title = (String) rows.get(0).get("title");
                    notificationService.sendNotificationToUser(
                            authorId,
                            "Nhắc nhở: Truyện sắp bị xóa vĩnh viễn",
                            "Truyện \"" + title + "\" sẽ bị xóa vĩnh viễn sau 2 ngày nữa do vi phạm nội dung. Nếu bạn muốn kháng nghị, hãy thực hiện ngay.",
                            "DELETION_REMINDER",
                            reportId
                    );
                    jdbcTemplate.update(
                            "INSERT INTO report_audit_logs(report_scope, report_id, action, actor_user_id, note) VALUES ('CONTENT', ?, 'DELETION_REMINDER', NULL, NULL)",
                            reportId
                    );
                }
            } else if ("CHAPTER".equals(targetType)) {
                var chRows = jdbcTemplate.queryForList(
                        "SELECT ch.title, pc.user_id, pc.title AS comic_title FROM published_chapters ch JOIN published_comics pc ON pc.id = ch.comic_id WHERE ch.id = ?",
                        targetId);
                if (!chRows.isEmpty()) {
                    Long authorId = ((Number) chRows.get(0).get("user_id")).longValue();
                    String chapterTitle = (String) chRows.get(0).get("title");
                    String comicTitle = (String) chRows.get(0).get("comic_title");
                    notificationService.sendNotificationToUser(
                            authorId,
                            "Nhắc nhở: Chương sắp bị xóa vĩnh viễn",
                            "Chương \"" + chapterTitle + "\" của truyện \"" + comicTitle + "\" sẽ bị xóa vĩnh viễn sau 2 ngày nữa. Nếu bạn muốn kháng nghị, hãy thực hiện ngay.",
                            "DELETION_REMINDER",
                            reportId
                    );
                    jdbcTemplate.update(
                            "INSERT INTO report_audit_logs(report_scope, report_id, action, actor_user_id, note) VALUES ('CONTENT', ?, 'DELETION_REMINDER', NULL, NULL)",
                            reportId
                    );
                }
            }
        }
    }
}
