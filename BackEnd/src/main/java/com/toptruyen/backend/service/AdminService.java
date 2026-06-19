package com.toptruyen.backend.service;

import com.toptruyen.backend.dto.*;
import org.springframework.context.annotation.Lazy;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AdminService {

    private final JdbcTemplate jdbcTemplate;
    private final WalletService walletService;
    private final NotificationService notificationService;

    public AdminService(JdbcTemplate jdbcTemplate, @Lazy WalletService walletService, NotificationService notificationService) {
        this.jdbcTemplate = jdbcTemplate;
        this.walletService = walletService;
        this.notificationService = notificationService;
    }

    public boolean isAdmin(Long userId) {
        if (userId == null) return false;
        try {
            Integer count = jdbcTemplate.queryForObject(
                    """
                    SELECT COUNT(1) FROM user_roles ur
                    JOIN roles r ON r.id = ur.role_id
                    WHERE ur.user_id = ? AND r.code IN ('ROLE_ADMIN', 'ADMIN')
                    """,
                    Integer.class, userId
            );
            return count != null && count > 0;
        } catch (Exception e) {
            return false;
        }
    }

    public AdminStatsResponse getStats() {
        Long totalUsers = jdbcTemplate.queryForObject("SELECT COUNT(1) FROM users", Long.class);
        Long totalComics = jdbcTemplate.queryForObject("SELECT COUNT(1) FROM published_comics", Long.class);
        Long totalChapters = jdbcTemplate.queryForObject("SELECT COUNT(1) FROM published_chapters", Long.class);
        Long totalComments = jdbcTemplate.queryForObject("SELECT COUNT(1) FROM chapter_comments", Long.class);
        Long totalReports = jdbcTemplate.queryForObject("""
            SELECT COUNT(1) FROM (
                SELECT id FROM content_reports
                UNION ALL
                SELECT id FROM comment_reports
            ) report
            """, Long.class);
        Long pendingReports = jdbcTemplate.queryForObject("""
            SELECT COUNT(1) FROM (
                SELECT status FROM content_reports
                UNION ALL
                SELECT status FROM comment_reports
            ) report
            WHERE report.status IN ('PENDING', 'FLAGGED')
            """, Long.class);
        return new AdminStatsResponse(
                orZero(totalUsers), orZero(totalComics), orZero(totalChapters),
                orZero(totalComments), orZero(totalReports), orZero(pendingReports)
        );
    }

    public List<AdminUserItem> getUsers(int page, int size) {
        int offset = page * size;
        return jdbcTemplate.query("""
                SELECT u.id, u.email, u.display_name, u.status,
                       DATE_FORMAT(u.created_at, '%Y-%m-%d') AS created_at,
                       COALESCE(w.balance, 0) AS wallet_balance,
                       (SELECT COUNT(1) FROM published_comics pc WHERE pc.user_id = u.id) AS comic_count,
                       EXISTS(SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id
                              WHERE ur.user_id = u.id AND r.code IN ('ROLE_ADMIN', 'ADMIN')) AS is_admin
                FROM users u
                LEFT JOIN user_wallets w ON w.user_id = u.id
                ORDER BY u.created_at DESC
                LIMIT ? OFFSET ?
                """,
                (rs, rowNum) -> new AdminUserItem(
                        rs.getLong("id"),
                        rs.getString("email"),
                        rs.getString("display_name"),
                        rs.getString("status"),
                        rs.getString("created_at"),
                        rs.getLong("wallet_balance"),
                        rs.getInt("comic_count"),
                        rs.getBoolean("is_admin")
                ),
                size, offset
        );
    }

    public long countUsers() {
        Long count = jdbcTemplate.queryForObject("SELECT COUNT(1) FROM users", Long.class);
        return orZero(count);
    }

    public void setUserStatus(Long userId, String status) {
        if (!"ACTIVE".equals(status) && !"BANNED".equals(status)) {
            throw new IllegalArgumentException("Trạng thái không hợp lệ");
        }
        jdbcTemplate.update("UPDATE users SET status = ? WHERE id = ?", status, userId);
    }

    public void setAdminRole(Long userId, boolean grant) {
        Integer userExists = jdbcTemplate.queryForObject(
                "SELECT COUNT(1) FROM users WHERE id = ?", Integer.class, userId);
        if (userExists == null || userExists == 0) {
            throw new IllegalArgumentException("Người dùng không tồn tại");
        }

        // Tạo role nếu chưa có
        List<Long> roleIds = jdbcTemplate.queryForList(
                "SELECT id FROM roles WHERE code IN ('ROLE_ADMIN', 'ADMIN') LIMIT 1", Long.class);
        Long roleId;
        if (roleIds.isEmpty()) {
            jdbcTemplate.update(
                    "INSERT INTO roles(code, name) VALUES ('ROLE_ADMIN', 'Quản trị viên')");
            roleId = jdbcTemplate.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
        } else {
            roleId = roleIds.get(0);
        }

        if (grant) {
            Integer already = jdbcTemplate.queryForObject(
                    "SELECT COUNT(1) FROM user_roles WHERE user_id = ? AND role_id = ?",
                    Integer.class, userId, roleId);
            if (already != null && already > 0) return;
            jdbcTemplate.update("INSERT INTO user_roles(user_id, role_id) VALUES (?, ?)", userId, roleId);
        } else {
            jdbcTemplate.update("DELETE FROM user_roles WHERE user_id = ? AND role_id = ?", userId, roleId);
        }
    }

    public List<AdminComicItem> getComics(int page, int size, String status) {
        int offset = page * size;
        String where = (status != null && !status.isBlank()) ? "WHERE pc.status = ?" : "";
        Object[] params = (status != null && !status.isBlank())
                ? new Object[]{status, size, offset}
                : new Object[]{size, offset};

        jdbcTemplate.execute("ALTER TABLE published_comics ADD COLUMN IF NOT EXISTS is_featured TINYINT(1) NOT NULL DEFAULT 0");
        return jdbcTemplate.query("""
                SELECT pc.id, pc.slug, pc.title, pc.status,
                       COALESCE(pc.is_featured, 0) AS is_featured,
                       u.display_name AS author_name,
                       DATE_FORMAT(pc.published_at, '%Y-%m-%d') AS published_at,
                       (SELECT COUNT(1) FROM published_chapters WHERE comic_id = pc.id) AS chapter_count,
                       (SELECT COALESCE(SUM(view_count), 0) FROM published_chapters WHERE comic_id = pc.id) AS total_views
                FROM published_comics pc
                LEFT JOIN users u ON u.id = pc.user_id
                """ + where + """
                ORDER BY pc.published_at DESC
                LIMIT ? OFFSET ?
                """,
                (rs, rowNum) -> new AdminComicItem(
                        rs.getLong("id"),
                        rs.getString("slug"),
                        rs.getString("title"),
                        rs.getString("status"),
                        rs.getString("author_name"),
                        rs.getInt("chapter_count"),
                        rs.getLong("total_views"),
                        rs.getString("published_at"),
                        rs.getInt("is_featured") == 1
                ),
                params
        );
    }

    public long countComics(String status) {
        if (status != null && !status.isBlank()) {
            Long count = jdbcTemplate.queryForObject(
                    "SELECT COUNT(1) FROM published_comics WHERE status = ?", Long.class, status);
            return orZero(count);
        }
        Long count = jdbcTemplate.queryForObject("SELECT COUNT(1) FROM published_comics", Long.class);
        return orZero(count);
    }

    public void setComicStatus(Long comicId, String status) {
        if (!"PUBLISHED".equals(status) && !"HIDDEN".equals(status)) {
            throw new IllegalArgumentException("Trạng thái không hợp lệ");
        }
        jdbcTemplate.update("UPDATE published_comics SET status = ? WHERE id = ?", status, comicId);
    }

    public void deleteComic(Long comicId) {
        jdbcTemplate.update("DELETE FROM published_comics WHERE id = ?", comicId);
    }

    public List<AdminReportItem> getReports(int page, int size, String status) {
        int offset = page * size;
        boolean hasStatus = status != null && !status.isBlank();
        String where = hasStatus ? "WHERE report.status = ?" : "";
        Object[] params = hasStatus
                ? new Object[]{status, size, offset}
                : new Object[]{size, offset};

        return jdbcTemplate.query("""
                SELECT * FROM (
                    SELECT cr.id,
                           cr.user_id,
                           u.display_name AS reporter_name,
                           'CONTENT' AS report_scope,
                           cr.target_type,
                           cr.target_id,
                           CASE
                             WHEN cr.target_type = 'COMIC' THEN pc_direct.title
                             WHEN cr.target_type = 'CHAPTER' THEN CONCAT(pc_ch.title, ' / Chapter #', ch_direct.chapter_no)
                             WHEN cr.target_type = 'COMMENT' THEN pc_comment.title
                             ELSE NULL
                           END AS target_title,
                           CASE
                             WHEN cr.target_type = 'COMIC' THEN pc_direct.slug
                             WHEN cr.target_type = 'CHAPTER' THEN pc_ch.slug
                             WHEN cr.target_type = 'COMMENT' THEN pc_comment.slug
                             ELSE NULL
                           END AS target_slug,
                           CASE
                             WHEN cr.target_type = 'COMMENT' THEN cc_join.content
                             WHEN cr.target_type = 'CHAPTER' THEN ch_direct.title
                             WHEN cr.target_type = 'COMIC' THEN pc_direct.title
                             ELSE NULL
                           END AS target_preview,
                           cr.reason,
                           cr.status,
                           cr.reviewer_note,
                           cr.auto_flagged,
                           DATE_FORMAT(cr.created_at, '%Y-%m-%d %H:%i') AS created_at
                    FROM content_reports cr
                    LEFT JOIN users u ON u.id = cr.user_id
                    LEFT JOIN published_comics pc_direct ON pc_direct.id = cr.target_id AND cr.target_type = 'COMIC'
                    LEFT JOIN published_chapters ch_direct ON ch_direct.id = cr.target_id AND cr.target_type = 'CHAPTER'
                    LEFT JOIN published_comics pc_ch ON pc_ch.id = ch_direct.comic_id
                    LEFT JOIN chapter_comments cc_join ON cc_join.id = cr.target_id AND cr.target_type = 'COMMENT'
                    LEFT JOIN published_chapters ch_comment ON ch_comment.id = cc_join.chapter_id
                    LEFT JOIN published_comics pc_comment ON pc_comment.id = ch_comment.comic_id

                    UNION ALL

                    SELECT rr.id,
                           rr.user_id,
                           u.display_name AS reporter_name,
                           'COMMENT' AS report_scope,
                           'COMMENT' AS target_type,
                           rr.comment_id AS target_id,
                           pc.title AS target_title,
                           pc.slug AS target_slug,
                           cc.content AS target_preview,
                           rr.reason,
                           rr.status,
                           rr.reviewer_note,
                           0 AS auto_flagged,
                           DATE_FORMAT(rr.created_at, '%Y-%m-%d %H:%i') AS created_at
                    FROM comment_reports rr
                    LEFT JOIN users u ON u.id = rr.user_id
                    LEFT JOIN chapter_comments cc ON cc.id = rr.comment_id
                    LEFT JOIN published_chapters ch ON ch.id = cc.chapter_id
                    LEFT JOIN published_comics pc ON pc.id = ch.comic_id
                ) report
                """ + where + """
                ORDER BY report.created_at DESC
                LIMIT ? OFFSET ?
                """,
                (rs, rowNum) -> new AdminReportItem(
                        rs.getLong("id"),
                        rs.getLong("user_id"),
                        rs.getString("reporter_name"),
                        rs.getString("report_scope"),
                        rs.getString("target_type"),
                        rs.getLong("target_id"),
                        rs.getString("target_title"),
                        rs.getString("target_slug"),
                        rs.getString("target_preview"),
                        rs.getString("reason"),
                        rs.getString("status"),
                        rs.getString("reviewer_note"),
                        rs.getInt("auto_flagged"),
                        rs.getString("created_at")
                ),
                params
        );
    }

    public long countReports(String status) {
        if (status != null && !status.isBlank()) {
            Long count = jdbcTemplate.queryForObject("""
                    SELECT COUNT(1) FROM (
                        SELECT status FROM content_reports
                        UNION ALL
                        SELECT status FROM comment_reports
                    ) report
                    WHERE report.status = ?
                    """, Long.class, status);
            return orZero(count);
        }
        Long count = jdbcTemplate.queryForObject("""
                SELECT COUNT(1) FROM (
                    SELECT id FROM content_reports
                    UNION ALL
                    SELECT id FROM comment_reports
                ) report
                """, Long.class);
        return orZero(count);
    }

    public void resolveReport(Long adminUserId, Long reportId, String reportScope, String newStatus, String reviewerNote) {
        if (!"RESOLVED".equals(newStatus) && !"DISMISSED".equals(newStatus) && !"FLAGGED".equals(newStatus)) {
            throw new IllegalArgumentException("Trạng thái không hợp lệ");
        }
        String normalizedScope = reportScope == null ? "CONTENT" : reportScope.trim().toUpperCase();
        String note = reviewerNote == null ? "" : reviewerNote.trim();

        if ("COMMENT".equals(normalizedScope)) {
            jdbcTemplate.update("UPDATE comment_reports SET status = ?, reviewed_by = ?, reviewer_note = ?, reviewed_at = NOW() WHERE id = ?",
                    newStatus, adminUserId, note.isEmpty() ? null : note, reportId);

            if ("RESOLVED".equals(newStatus) || "FLAGGED".equals(newStatus)) {
                var commentRows = jdbcTemplate.queryForList(
                        "SELECT cc.user_id, cc.content FROM comment_reports cr JOIN chapter_comments cc ON cc.id = cr.comment_id WHERE cr.id = ?",
                        reportId);
                if (!commentRows.isEmpty()) {
                    Long commentOwnerId = ((Number) commentRows.get(0).get("user_id")).longValue();
                    String commentPreview = (String) commentRows.get(0).get("content");
                    String preview = commentPreview != null && commentPreview.length() > 50
                            ? commentPreview.substring(0, 50) + "..." : commentPreview;
                    notificationService.sendNotificationToUser(
                            commentOwnerId,
                            "Bình luận bị xử lý do vi phạm",
                            "Bình luận của bạn\"" + preview + "\" đã bị xử lý do vi phạm nội dung." +
                                    (note.isEmpty() ? "" : " Ghi chú: " + note),
                            "REPORT",
                            reportId
                    );
                }
            }
        } else {
            var report = jdbcTemplate.queryForMap(
                    "SELECT target_type, target_id FROM content_reports WHERE id = ?", reportId);

            jdbcTemplate.update("UPDATE content_reports SET status = ?, reviewed_by = ?, reviewer_note = ?, reviewed_at = NOW() WHERE id = ?",
                    newStatus, adminUserId, note.isEmpty() ? null : note, reportId);

            if ("RESOLVED".equals(newStatus) || "FLAGGED".equals(newStatus)) {
                String targetType = (String) report.get("target_type");
                Long targetId = ((Number) report.get("target_id")).longValue();

                if ("COMIC".equals(targetType)) {
                    var comic = jdbcTemplate.queryForMap(
                            "SELECT user_id, title FROM published_comics WHERE id = ?", targetId);
                    Long authorId = ((Number) comic.get("user_id")).longValue();
                    String title = (String) comic.get("title");

                    // Only change status and notify if the comic was not already hidden
                    String currentComicStatus = jdbcTemplate.queryForObject(
                            "SELECT status FROM published_comics WHERE id = ?",
                            String.class,
                            targetId
                    );
                    boolean willHideComic = currentComicStatus == null || !"HIDDEN".equals(currentComicStatus);
                    if (willHideComic) {
                        jdbcTemplate.update("UPDATE published_comics SET status = 'HIDDEN' WHERE id = ?", targetId);

                        java.util.Map<String, Object> reportInfo = jdbcTemplate.queryForMap(
                            "SELECT reason, DATE_FORMAT(created_at, '%Y-%m-%d %H:%i') AS reported_at FROM content_reports WHERE id = ?",
                            reportId
                        );
                        String reason = reportInfo.get("reason") == null ? "" : String.valueOf(reportInfo.get("reason"));
                        String reportedAt = reportInfo.get("reported_at") == null ? "" : String.valueOf(reportInfo.get("reported_at"));
                        String message = "Truyện \"" + title + "\" đã bị ẩn.\n" +
                            "Lý do: " + reason + "\n" +
                            (note.isEmpty() ? "" : ("Ghi chú admin: " + note + "\n")) +
                            (reportedAt.isEmpty() ? "" : ("Thời gian báo cáo: " + reportedAt + "\n")) +
                            "Bạn có 7 ngày để kháng nghị.";

                        notificationService.sendNotificationToUser(
                                authorId,
                                "Truyện bị ẩn do vi phạm",
                                message,
                                "REPORT",
                                reportId
                        );
                    }
                } else if ("CHAPTER".equals(targetType)) {
                    var chapter = jdbcTemplate.queryForMap(
                            "SELECT comic_id, title FROM published_chapters WHERE id = ?", targetId);
                    Long comicId = ((Number) chapter.get("comic_id")).longValue();
                    String chapterTitle = (String) chapter.get("title");

                    var comic = jdbcTemplate.queryForMap(
                            "SELECT user_id, title FROM published_comics WHERE id = ?", comicId);
                    Long authorId = ((Number) comic.get("user_id")).longValue();
                    String comicTitle = (String) comic.get("title");

                    // Only change status and notify if the chapter was not already hidden
                    String currentChapterStatus = jdbcTemplate.queryForObject(
                            "SELECT status FROM published_chapters WHERE id = ?",
                            String.class,
                            targetId
                    );
                    boolean willHideChapter = currentChapterStatus == null || !"HIDDEN".equals(currentChapterStatus);
                    if (willHideChapter) {
                        jdbcTemplate.update("UPDATE published_chapters SET status = 'HIDDEN' WHERE id = ?", targetId);

                        java.util.Map<String, Object> reportInfo = jdbcTemplate.queryForMap(
                            "SELECT reason, DATE_FORMAT(created_at, '%Y-%m-%d %H:%i') AS reported_at FROM content_reports WHERE id = ?",
                            reportId
                        );
                        String reason = reportInfo.get("reason") == null ? "" : String.valueOf(reportInfo.get("reason"));
                        String reportedAt = reportInfo.get("reported_at") == null ? "" : String.valueOf(reportInfo.get("reported_at"));
                        String message = "Chương \"" + chapterTitle + "\" của \"" + comicTitle + "\" đã bị ẩn.\n" +
                            "Lý do: " + reason + "\n" +
                            (note.isEmpty() ? "" : ("Ghi chú admin: " + note + "\n")) +
                            (reportedAt.isEmpty() ? "" : ("Thời gian báo cáo: " + reportedAt + "\n")) +
                            "Bạn có 7 ngày để kháng nghị.";

                        notificationService.sendNotificationToUser(
                                authorId,
                                "Chương bị ẩn do vi phạm",
                                message,
                                "REPORT",
                                reportId
                        );
                    }
                }
            }
        }
        jdbcTemplate.update("INSERT INTO report_audit_logs(report_scope, report_id, action, actor_user_id, note) VALUES (?, ?, ?, ?, ?)",
                normalizedScope, reportId, newStatus, adminUserId, note.isEmpty() ? null : note);
    }

        public java.util.Map<String, Object> getReportDetail(Long reportId, String scope) {
        String normalized = scope == null ? "CONTENT" : scope.trim().toUpperCase();
        if ("COMMENT".equals(normalized)) {
                List<java.util.Map<String, Object>> rows = jdbcTemplate.queryForList(
                    "SELECT rr.id, rr.comment_id AS target_id, cc.content AS target_preview, ch.id AS chapter_id, pc.slug AS target_slug, pc.title AS target_title, rr.reason, rr.status, rr.reviewer_note, rr.user_id AS reporter_id, u.display_name AS reporter_name, DATE_FORMAT(rr.created_at, '%Y-%m-%d %H:%i') AS created_at FROM comment_reports rr LEFT JOIN chapter_comments cc ON cc.id = rr.comment_id LEFT JOIN published_chapters ch ON ch.id = cc.chapter_id LEFT JOIN published_comics pc ON pc.id = ch.comic_id LEFT JOIN users u ON u.id = rr.user_id WHERE rr.id = ?",
                    reportId
                );
            if (rows.isEmpty()) throw new IllegalArgumentException("Report not found");
            java.util.Map<String, Object> detail = new java.util.HashMap<>(rows.get(0));
            List<java.util.Map<String, Object>> logs = jdbcTemplate.queryForList(
                "SELECT ral.action, ral.actor_user_id, COALESCE(u.display_name, CONCAT('User #', ral.actor_user_id)) AS actor_display_name, ral.note, DATE_FORMAT(ral.created_at, '%Y-%m-%d %H:%i') AS ts FROM report_audit_logs ral LEFT JOIN users u ON u.id = ral.actor_user_id WHERE ral.report_scope = 'COMMENT' AND ral.report_id = ? ORDER BY ral.created_at DESC",
                reportId
            );
            detail.put("auditLogs", logs);
            return detail;
        } else {
            List<java.util.Map<String, Object>> rows = jdbcTemplate.queryForList(
                "SELECT cr.id, cr.target_type, cr.target_id, cr.reason, cr.status, cr.reviewer_note, cr.user_id AS reporter_id, u.display_name AS reporter_name, DATE_FORMAT(cr.created_at, '%Y-%m-%d %H:%i') AS created_at, pc.slug AS target_slug, pc.title AS target_title, ch.title AS chapter_title FROM content_reports cr LEFT JOIN published_comics pc ON pc.id = cr.target_id AND cr.target_type = 'COMIC' LEFT JOIN published_chapters ch ON ch.id = cr.target_id AND cr.target_type = 'CHAPTER' LEFT JOIN users u ON u.id = cr.user_id WHERE cr.id = ?",
                reportId
            );
            if (rows.isEmpty()) throw new IllegalArgumentException("Report not found");
            java.util.Map<String, Object> detail = new java.util.HashMap<>(rows.get(0));
            List<java.util.Map<String, Object>> logs = jdbcTemplate.queryForList(
                "SELECT ral.action, ral.actor_user_id, COALESCE(u.display_name, CONCAT('User #', ral.actor_user_id)) AS actor_display_name, ral.note, DATE_FORMAT(ral.created_at, '%Y-%m-%d %H:%i') AS ts FROM report_audit_logs ral LEFT JOIN users u ON u.id = ral.actor_user_id WHERE ral.report_scope = 'CONTENT' AND ral.report_id = ? ORDER BY ral.created_at DESC",
                reportId
            );
            detail.put("auditLogs", logs);
            return detail;
        }
        }

    public List<AdminReportAppealItem> getAppeals(int page, int size, String status) {
        int offset = page * size;
        boolean hasStatus = status != null && !status.isBlank();
        String where = hasStatus ? "WHERE appeal.status = ?" : "";
        Object[] params = hasStatus ? new Object[]{status, size, offset} : new Object[]{size, offset};

        return jdbcTemplate.query("""
                SELECT * FROM (
                    SELECT ra.id,
                           ra.report_scope,
                           ra.report_id,
                           ra.reporter_user_id,
                           u.display_name AS reporter_name,
                           COALESCE(cr.target_type, 'COMMENT') AS target_type,
                           COALESCE(cr.target_id, rr.comment_id) AS target_id,
                           CASE
                             WHEN cr.target_type = 'COMIC' THEN pc_direct.title
                             WHEN cr.target_type = 'CHAPTER' THEN CONCAT(pc_ch.title, ' / Chapter #', ch_direct.chapter_no)
                             WHEN cr.target_type = 'COMMENT' THEN pc_comment.title
                             ELSE CONCAT('Báo cáo #', ra.report_id)
                           END AS target_title,
                           CASE
                             WHEN cr.target_type = 'COMMENT' THEN cc_join.content
                             WHEN cr.target_type = 'CHAPTER' THEN ch_direct.title
                             WHEN cr.target_type = 'COMIC' THEN pc_direct.title
                             ELSE rr.reason
                           END AS target_preview,
                           ra.message,
                           ra.status,
                           ra.admin_note,
                           DATE_FORMAT(ra.created_at, '%Y-%m-%d %H:%i') AS created_at,
                           CASE WHEN ra.reviewed_at IS NULL THEN NULL ELSE DATE_FORMAT(ra.reviewed_at, '%Y-%m-%d %H:%i') END AS reviewed_at
                    FROM report_appeals ra
                    LEFT JOIN users u ON u.id = ra.reporter_user_id
                    LEFT JOIN content_reports cr ON cr.id = ra.report_id AND ra.report_scope = 'CONTENT'
                    LEFT JOIN comment_reports rr ON rr.id = ra.report_id AND ra.report_scope = 'COMMENT'
                    LEFT JOIN published_comics pc_direct ON pc_direct.id = cr.target_id AND cr.target_type = 'COMIC'
                    LEFT JOIN published_chapters ch_direct ON ch_direct.id = cr.target_id AND cr.target_type = 'CHAPTER'
                    LEFT JOIN published_comics pc_ch ON pc_ch.id = ch_direct.comic_id
                    LEFT JOIN chapter_comments cc_join ON cc_join.id = cr.target_id AND cr.target_type = 'COMMENT'
                    LEFT JOIN published_chapters ch_comment ON ch_comment.id = cc_join.chapter_id
                    LEFT JOIN published_comics pc_comment ON pc_comment.id = ch_comment.comic_id
                    ORDER BY ra.created_at DESC
                ) appeal
                """ + where + """
                LIMIT ? OFFSET ?
                """,
                (rs, rowNum) -> {
                    String appealStatus = rs.getString("status");
                    java.util.List<String> allowed = "PENDING".equals(appealStatus)
                        ? java.util.List.of("APPROVED", "REJECTED")
                        : java.util.List.of();
                    return new AdminReportAppealItem(
                        rs.getLong("id"),
                        rs.getString("report_scope"),
                        rs.getLong("report_id"),
                        rs.getLong("reporter_user_id"),
                        rs.getString("reporter_name"),
                        rs.getString("target_type"),
                        rs.getLong("target_id"),
                        rs.getString("target_title"),
                        rs.getString("target_preview"),
                        rs.getString("message"),
                            appealStatus,
                        rs.getString("admin_note"),
                        rs.getString("created_at"),
                        rs.getString("reviewed_at"),
                        allowed
                    );
                },
                params
        );
    }

    public long countAppeals(String status) {
        if (status != null && !status.isBlank()) {
            Long count = jdbcTemplate.queryForObject(
                    "SELECT COUNT(1) FROM report_appeals WHERE status = ?",
                    Long.class,
                    status
            );
            return orZero(count);
        }
        Long count = jdbcTemplate.queryForObject("SELECT COUNT(1) FROM report_appeals", Long.class);
        return orZero(count);
    }

    public void resolveAppeal(Long adminUserId, Long appealId, String newStatus, String adminNote) {
        if (!"APPROVED".equals(newStatus) && !"REJECTED".equals(newStatus)) {
            throw new IllegalArgumentException("Trạng thái kháng nghị không hợp lệ");
        }

        String note = adminNote == null ? "" : adminNote.trim();
        List<java.util.Map<String, Object>> rows = jdbcTemplate.queryForList(
                "SELECT report_scope, report_id, status, reporter_user_id FROM report_appeals WHERE id = ?",
                appealId
        );
        if (rows.isEmpty()) {
            throw new IllegalArgumentException("Kháng nghị không tồn tại");
        }

        if (!"PENDING".equals(String.valueOf(rows.get(0).get("status")))) {
            throw new IllegalArgumentException("Kháng nghị này đã được xử lý");
        }

        String reportScope = String.valueOf(rows.get(0).get("report_scope"));
        Long reportId = ((Number) rows.get(0).get("report_id")).longValue();
        Long appealAuthorId = ((Number) rows.get(0).get("reporter_user_id")).longValue();

        jdbcTemplate.update(
                "UPDATE report_appeals SET status = ?, admin_note = ?, reviewed_at = NOW() WHERE id = ?",
                newStatus,
                note.isEmpty() ? null : note,
                appealId
        );

        if ("CONTENT".equals(reportScope)) {
            var report = jdbcTemplate.queryForMap(
                    "SELECT target_type, target_id FROM content_reports WHERE id = ?", reportId);
            String targetType = (String) report.get("target_type");
            Long targetId = ((Number) report.get("target_id")).longValue();

            if ("APPROVED".equals(newStatus)) {
                boolean restored = false;
                if ("COMIC".equals(targetType)) {
                    int updated = jdbcTemplate.update(
                            "UPDATE published_comics SET status = 'PUBLISHED' WHERE id = ?", targetId);
                    restored = updated > 0;
                } else if ("CHAPTER".equals(targetType)) {
                    int updated = jdbcTemplate.update(
                            "UPDATE published_chapters SET status = 'PUBLISHED' WHERE id = ?", targetId);
                    restored = updated > 0;
                }

                if (restored) {
                    notificationService.sendNotificationToUser(
                            appealAuthorId,
                            "Kháng nghị được phê duyệt",
                            "Kháng nghị của bạn đã được phê duyệt. Nội dung đã được khôi phục.",
                            "APPEAL_APPROVED",
                            targetId
                    );
                } else {
                    // Nội dung đã bị xóa trước khi kháng cáo được duyệt
                    notificationService.sendNotificationToUser(
                            appealAuthorId,
                            "Kháng nghị được phê duyệt",
                            "Kháng nghị của bạn đã được phê duyệt. Tuy nhiên nội dung đã bị xóa vĩnh viễn trước đó nên không thể khôi phục.",
                            "APPEAL_APPROVED",
                            null
                    );
                }
            } else {
                // REJECTED
                notificationService.sendNotificationToUser(
                        appealAuthorId,
                        "Kháng nghị bị từ chối",
                        "Kháng nghị của bạn đã bị từ chối." + (note.isEmpty() ? "" : " Lý do: " + note),
                        "APPEAL_REJECTED",
                        targetId
                );
            }
        } else {
            // COMMENT scope
            if ("APPROVED".equals(newStatus)) {
                notificationService.sendNotificationToUser(
                        appealAuthorId,
                        "Kháng nghị được phê duyệt",
                        "Kháng nghị của bạn về bình luận đã được phê duyệt.",
                        "APPEAL_APPROVED",
                        null
                );
            } else {
                // REJECTED
                notificationService.sendNotificationToUser(
                        appealAuthorId,
                        "Kháng nghị bị từ chối",
                        "Kháng nghị của bạn về bình luận đã bị từ chối." + (note.isEmpty() ? "" : " Lý do: " + note),
                        "APPEAL_REJECTED",
                        null
                );
            }
        }

        jdbcTemplate.update(
                "INSERT INTO report_audit_logs(report_scope, report_id, action, actor_user_id, note) VALUES (?, ?, ?, ?, ?)",
                reportScope,
                reportId,
                "APPEAL_" + newStatus,
                adminUserId,
                note.isEmpty() ? null : note
        );
    }

    public void deleteComment(Long commentId) {
        jdbcTemplate.update("DELETE FROM chapter_comments WHERE id = ?", commentId);
    }

    public List<AdminCommentItem> getComments(int page, int size, String comicSlug) {
        int offset = page * size;
        boolean hasSlug = comicSlug != null && !comicSlug.isBlank();
        String where = hasSlug ? "WHERE pc.slug = ?" : "";
        Object[] params = hasSlug
                ? new Object[]{comicSlug, size, offset}
                : new Object[]{size, offset};

        return jdbcTemplate.query("""
                SELECT cc.id, cc.user_id, u.display_name AS user_name,
                       cc.chapter_id, pc.title AS comic_title, pc.slug AS comic_slug,
                       ch.chapter_no, cc.content,
                       DATE_FORMAT(cc.created_at, '%Y-%m-%d %H:%i') AS created_at
                FROM chapter_comments cc
                JOIN published_chapters ch ON ch.id = cc.chapter_id
                JOIN published_comics pc ON pc.id = ch.comic_id
                LEFT JOIN users u ON u.id = cc.user_id
                """ + where + """
                ORDER BY cc.created_at DESC
                LIMIT ? OFFSET ?
                """,
                (rs, rowNum) -> new AdminCommentItem(
                        rs.getLong("id"),
                        rs.getLong("user_id"),
                        rs.getString("user_name"),
                        rs.getLong("chapter_id"),
                        rs.getString("comic_title"),
                        rs.getString("comic_slug"),
                        rs.getInt("chapter_no"),
                        rs.getString("content"),
                        rs.getString("created_at")
                ),
                params
        );
    }

    public long countComments(String comicSlug) {
        if (comicSlug != null && !comicSlug.isBlank()) {
            Long count = jdbcTemplate.queryForObject(
                    """
                    SELECT COUNT(1) FROM chapter_comments cc
                    JOIN published_chapters ch ON ch.id = cc.chapter_id
                    JOIN published_comics pc ON pc.id = ch.comic_id
                    WHERE pc.slug = ?
                    """,
                    Long.class, comicSlug);
            return orZero(count);
        }
        Long count = jdbcTemplate.queryForObject("SELECT COUNT(1) FROM chapter_comments", Long.class);
        return orZero(count);
    }

    public List<AdminChapterItem> getChapters(int page, int size, String comicSlug) {
        int offset = page * size;
        boolean hasSlug = comicSlug != null && !comicSlug.isBlank();
        String where = hasSlug ? "WHERE pc.slug = ?" : "";
        Object[] params = hasSlug
                ? new Object[]{comicSlug, size, offset}
                : new Object[]{size, offset};

        return jdbcTemplate.query("""
                SELECT ch.id, ch.comic_id, pc.slug AS comic_slug, pc.title AS comic_title,
                       ch.chapter_no, ch.title, COALESCE(ch.price, 0) AS price,
                       COALESCE(ch.view_count, 0) AS view_count,
                       DATE_FORMAT(ch.published_at, '%Y-%m-%d') AS published_at
                FROM published_chapters ch
                JOIN published_comics pc ON pc.id = ch.comic_id
                """ + where + """
                ORDER BY ch.published_at DESC, ch.chapter_no DESC
                LIMIT ? OFFSET ?
                """,
                (rs, rowNum) -> new AdminChapterItem(
                        rs.getLong("id"),
                        rs.getLong("comic_id"),
                        rs.getString("comic_slug"),
                        rs.getString("comic_title"),
                        rs.getInt("chapter_no"),
                        rs.getString("title"),
                        rs.getLong("price"),
                        rs.getLong("view_count"),
                        rs.getString("published_at")
                ),
                params
        );
    }

    public long countChapters(String comicSlug) {
        if (comicSlug != null && !comicSlug.isBlank()) {
            Long count = jdbcTemplate.queryForObject(
                    "SELECT COUNT(1) FROM published_chapters ch JOIN published_comics pc ON pc.id = ch.comic_id WHERE pc.slug = ?",
                    Long.class, comicSlug);
            return orZero(count);
        }
        Long count = jdbcTemplate.queryForObject("SELECT COUNT(1) FROM published_chapters", Long.class);
        return orZero(count);
    }

    public void deleteChapter(Long chapterId) {
        jdbcTemplate.update("DELETE FROM published_chapters WHERE id = ?", chapterId);
    }

    public java.util.Map<String, Object> getChapterContent(Long chapterId) {
        java.util.Map<String, Object> result = new java.util.LinkedHashMap<>(
            jdbcTemplate.queryForMap("""
                SELECT pc.id, pc.chapter_no, pc.title, pc.content, pc.status,
                       pc.moderation_reason, pc.matched_chapter_id,
                       pco.title AS comic_title, pco.slug AS comic_slug,
                       u.display_name AS author_name
                FROM published_chapters pc
                JOIN published_comics pco ON pc.comic_id = pco.id
                JOIN users u ON pco.user_id = u.id
                WHERE pc.id = ?
                """, chapterId)
        );

        // Lấy pages nếu là chapter ảnh
        try {
            java.util.List<String> pages = jdbcTemplate.queryForList(
                    "SELECT image_url FROM published_chapter_pages WHERE chapter_id = ? ORDER BY sort_order ASC",
                    String.class, chapterId);
            if (!pages.isEmpty()) result.put("pages", pages);
        } catch (Exception ignored) {}

        // Lấy nội dung chương gốc bị trùng lặp (nếu có)
        Object matchedId = result.get("matched_chapter_id");
        if (matchedId != null) {
            try {
                java.util.Map<String, Object> matched = new java.util.LinkedHashMap<>(jdbcTemplate.queryForMap("""
                        SELECT pc.id, pc.chapter_no, pc.title, pc.content,
                               pco.title AS comic_title, pco.slug AS comic_slug
                        FROM published_chapters pc
                        JOIN published_comics pco ON pc.comic_id = pco.id
                        WHERE pc.id = ?
                        """, ((Number) matchedId).longValue()));
                // Pages của chapter gốc (nếu có)
                java.util.List<String> matchedPages = jdbcTemplate.queryForList(
                        "SELECT image_url FROM published_chapter_pages WHERE chapter_id = ? ORDER BY sort_order ASC",
                        String.class, ((Number) matchedId).longValue());
                if (!matchedPages.isEmpty()) matched.put("pages", matchedPages);
                result.put("matchedChapter", matched);
            } catch (Exception ignored) {}
        }

        return result;
    }

    public java.util.List<java.util.Map<String, Object>> getPendingChapters() {
        return jdbcTemplate.queryForList("""
                SELECT pc.id, pc.chapter_no, pc.title, pc.moderation_reason,
                       pc.published_at, pco.title AS comic_title, pco.slug AS comic_slug,
                       u.display_name AS author_name
                FROM published_chapters pc
                JOIN published_comics pco ON pc.comic_id = pco.id
                JOIN users u ON pco.user_id = u.id
                WHERE pc.status = 'PENDING_REVIEW'
                ORDER BY pc.published_at ASC
                """);
    }

    public void approveChapter(Long chapterId) {
        jdbcTemplate.update("""
                UPDATE published_chapters SET status = 'PUBLISHED', moderation_reason = NULL
                WHERE id = ? AND status = 'PENDING_REVIEW'
                """, chapterId);
        jdbcTemplate.update("""
                UPDATE published_comics SET published_at = CURRENT_TIMESTAMP
                WHERE id = (SELECT comic_id FROM published_chapters WHERE id = ?)
                """, chapterId);
        // Gửi thông báo cho tác giả
        try {
            java.util.List<java.util.Map<String, Object>> rows = jdbcTemplate.queryForList("""
                    SELECT pco.user_id, pc.title AS chapter_title, pco.slug, pc.id AS chapter_id
                    FROM published_chapters pc
                    JOIN published_comics pco ON pc.comic_id = pco.id
                    WHERE pc.id = ?
                    """, chapterId);
            if (!rows.isEmpty()) {
                java.util.Map<String, Object> row = rows.get(0);
                Long authorId = ((Number) row.get("user_id")).longValue();
                String chapterTitle = (String) row.get("chapter_title");
                String slug = (String) row.get("slug");
                notificationService.createNotification(authorId, "MODERATION",
                        "Chương được duyệt xuất bản",
                        "\"" + chapterTitle + "\" đã được Admin duyệt và hiển thị công khai.",
                        chapterId, "/doc-truyen/" + slug + "/" + chapterId);
            }
        } catch (Exception ignored) {}
    }

    public void rejectChapter(Long chapterId, String reason) {
        // Xóa chapter bị từ chối
        try {
            java.util.List<java.util.Map<String, Object>> rows = jdbcTemplate.queryForList("""
                    SELECT pco.user_id, pc.title AS chapter_title
                    FROM published_chapters pc
                    JOIN published_comics pco ON pc.comic_id = pco.id
                    WHERE pc.id = ? AND pc.status = 'PENDING_REVIEW'
                    """, chapterId);
            if (!rows.isEmpty()) {
                java.util.Map<String, Object> row = rows.get(0);
                Long authorId = ((Number) row.get("user_id")).longValue();
                String chapterTitle = (String) row.get("chapter_title");
                notificationService.createNotification(authorId, "MODERATION",
                        "Chương bị từ chối xuất bản",
                        "\"" + chapterTitle + "\" bị Admin từ chối. Lý do: " + reason,
                        chapterId, "/sang-tac?view=manage");
            }
        } catch (Exception ignored) {}
        jdbcTemplate.update("UPDATE published_chapters SET status = 'REJECTED', moderation_reason = ? WHERE id = ? AND status = 'PENDING_REVIEW'", reason, chapterId);
    }

    /**
     * Duyệt lại tất cả chapter đang PENDING vì AI offline.
     * Gọi tự động khi AI Service khởi động lại.
     */
    public java.util.Map<String, Object> recheckSingleChapter(Long chapterId, ModerationService moderationService) {
        java.util.List<java.util.Map<String, Object>> rows = jdbcTemplate.queryForList("""
                SELECT pc.id, pc.content, pco.id AS comic_id, pco.mode
                FROM published_chapters pc
                JOIN published_comics pco ON pc.comic_id = pco.id
                WHERE pc.id = ? AND pc.status = 'PENDING_REVIEW'
                """, chapterId);

        if (rows.isEmpty()) return java.util.Map.of("error", "Chapter không tồn tại hoặc không ở trạng thái chờ duyệt");

        java.util.Map<String, Object> row = rows.get(0);
        Long comicId = ((Number) row.get("comic_id")).longValue();
        String mode  = (String) row.get("mode");
        String content = (String) row.get("content");

        try {
            ModerationService.ModerationResult result;
            if ("text".equals(mode) && content != null && !content.isBlank()) {
                result = moderationService.moderate(content, comicId);
            } else {
                java.util.List<String> urls = jdbcTemplate.queryForList(
                        "SELECT image_url FROM published_chapter_pages WHERE chapter_id = ? ORDER BY sort_order ASC",
                        String.class, chapterId);
                result = moderationService.moderateImages(urls, comicId);
            }

            String newStatus;
            String newReason;
            switch (result.decision()) {
                case APPROVED -> { newStatus = "PUBLISHED"; newReason = null; }
                case REJECTED -> { newStatus = "REJECTED"; newReason = result.rejectReason(); }
                case AI_UNAVAILABLE -> { return java.util.Map.of("status", "AI_UNAVAILABLE", "message", "AI Service chưa sẵn sàng, thử lại sau."); }
                default -> { newStatus = "PENDING_REVIEW"; newReason = result.rejectReason(); }
            }

            jdbcTemplate.update("UPDATE published_chapters SET status=?, moderation_reason=? WHERE id=?", newStatus, newReason, chapterId);

            if ("PUBLISHED".equals(newStatus)) {
                try {
                    java.util.List<java.util.Map<String, Object>> info = jdbcTemplate.queryForList(
                            "SELECT pco.user_id, pc.title, pco.slug FROM published_chapters pc JOIN published_comics pco ON pc.comic_id=pco.id WHERE pc.id=?", chapterId);
                    if (!info.isEmpty()) {
                        Long uid = ((Number) info.get(0).get("user_id")).longValue();
                        String title = (String) info.get(0).get("title");
                        notificationService.createNotification(uid, "MODERATION", "Chương được AI duyệt lại", "\"" + title + "\" đã qua kiểm tra AI và được xuất bản.", chapterId, "/sang-tac?view=manage");
                    }
                } catch (Exception ignored) {}
            }

            return java.util.Map.of("status", newStatus, "reason", newReason != null ? newReason : "");
        } catch (Exception e) {
            return java.util.Map.of("error", e.getMessage());
        }
    }

    public java.util.Map<String, Object> recheckAiPendingChapters(ModerationService moderationService) {
        // Lấy tất cả chapter đang chờ do AI unavailable
        java.util.List<java.util.Map<String, Object>> pendingRows = jdbcTemplate.queryForList("""
                SELECT pc.id, pc.content, pc.moderation_reason,
                       pco.id AS comic_id, pco.mode
                FROM published_chapters pc
                JOIN published_comics pco ON pc.comic_id = pco.id
                WHERE pc.status = 'PENDING_REVIEW'
                  AND pc.moderation_reason LIKE '%AI tạm thời không khả dụng%'
                """);

        int approved = 0, rejected = 0, stillPending = 0;

        for (java.util.Map<String, Object> row : pendingRows) {
            Long chapterId = ((Number) row.get("id")).longValue();
            Long comicId   = ((Number) row.get("comic_id")).longValue();
            String mode    = (String) row.get("mode");
            String content = (String) row.get("content");

            try {
                ModerationService.ModerationResult result;

                if ("text".equals(mode) && content != null && !content.isBlank()) {
                    result = moderationService.moderate(content, comicId);
                } else if ("comic".equals(mode)) {
                    java.util.List<String> urls = jdbcTemplate.queryForList(
                            "SELECT image_url FROM published_chapter_pages WHERE chapter_id = ? ORDER BY sort_order ASC",
                            String.class, chapterId);
                    result = moderationService.moderateImages(urls, comicId);
                } else {
                    continue;
                }

                switch (result.decision()) {
                    case APPROVED -> {
                        jdbcTemplate.update("UPDATE published_chapters SET status='PUBLISHED', moderation_reason=NULL WHERE id=?", chapterId);
                        jdbcTemplate.update("UPDATE published_comics SET published_at=CURRENT_TIMESTAMP WHERE id=?", comicId);
                        // Index vào kho AI
                        if ("text".equals(mode)) {
                            final String fc = content; final Long fch = chapterId; final Long fco = comicId;
                            new Thread(() -> moderationService.indexChapter(fco, fch, "", fc)).start();
                        } else {
                            java.util.List<String> urls = jdbcTemplate.queryForList(
                                    "SELECT image_url FROM published_chapter_pages WHERE chapter_id = ? ORDER BY sort_order ASC",
                                    String.class, chapterId);
                            final Long fch = chapterId; final Long fco = comicId; final java.util.List<String> fu = urls;
                            new Thread(() -> moderationService.indexImageChapter(fco, fch, "", fu)).start();
                        }
                        // Thông báo tác giả
                        try {
                            java.util.List<java.util.Map<String, Object>> info = jdbcTemplate.queryForList(
                                    "SELECT pco.user_id, pc.title, pco.slug FROM published_chapters pc JOIN published_comics pco ON pc.comic_id=pco.id WHERE pc.id=?", chapterId);
                            if (!info.isEmpty()) {
                                Long uid = ((Number) info.get(0).get("user_id")).longValue();
                                String title = (String) info.get(0).get("title");
                                notificationService.createNotification(uid, "MODERATION", "Chương đã được AI duyệt", "\"" + title + "\" đã được AI kiểm duyệt và xuất bản.", chapterId, "/sang-tac?view=manage");
                            }
                        } catch (Exception ignored) {}
                        approved++;
                    }
                    case REJECTED, PENDING_REVIEW -> {
                        jdbcTemplate.update("UPDATE published_chapters SET moderation_reason=? WHERE id=?", result.rejectReason(), chapterId);
                        stillPending++;
                    }
                    case AI_UNAVAILABLE -> stillPending++;
                }
            } catch (Exception e) {
                stillPending++;
            }
        }

        return java.util.Map.of("total", pendingRows.size(), "approved", approved, "rejected", rejected, "stillPending", stillPending);
    }

    public java.util.Map<String, Object> getRevenueStats() {
        Long totalRevenue = jdbcTemplate.queryForObject(
                "SELECT COALESCE(SUM(amount), 0) FROM wallet_transactions WHERE reason LIKE 'Thu nhập chapter #%'",
                Long.class);

        Long totalDeposit = jdbcTemplate.queryForObject(
                "SELECT COALESCE(SUM(amount), 0) FROM wallet_transactions WHERE type = 'DEPOSIT' AND reason LIKE 'Nạp tiền%'",
                Long.class);

        List<java.util.Map<String, Object>> topAuthors = jdbcTemplate.queryForList("""
                SELECT u.display_name AS author_name,
                       COALESCE(SUM(wt.amount), 0) AS total_earned,
                       COUNT(DISTINCT wt.reason) AS chapter_count
                FROM wallet_transactions wt
                JOIN users u ON u.id = wt.user_id
                WHERE wt.reason LIKE 'Thu nhập chapter #%'
                GROUP BY wt.user_id, u.display_name
                ORDER BY total_earned DESC
                LIMIT 10
                """);

        List<java.util.Map<String, Object>> recentTx = jdbcTemplate.queryForList("""
                SELECT DATE_FORMAT(wt.created_at, '%Y-%m-%d %H:%i') AS tx_date,
                       u.display_name AS author_name,
                       wt.reason AS chapter_ref,
                       wt.amount
                FROM wallet_transactions wt
                JOIN users u ON u.id = wt.user_id
                WHERE wt.reason LIKE 'Thu nhập chapter #%'
                ORDER BY wt.created_at DESC
                LIMIT 20
                """);

        java.util.Map<String, Object> result = new java.util.LinkedHashMap<>();
        result.put("totalRevenue", orZero(totalRevenue));
        result.put("totalDeposit", orZero(totalDeposit));
        result.put("topAuthors", topAuthors);
        result.put("recentTransactions", recentTx);
        return result;
    }

    public java.util.List<java.util.Map<String, Object>> getMonthlyRevenue() {
        return jdbcTemplate.queryForList("""
                SELECT
                    DATE_FORMAT(wt.created_at, '%Y-%m') AS month,
                    COALESCE(SUM(CASE WHEN wt.reason LIKE 'Thu nhập chapter #%' THEN wt.amount ELSE 0 END), 0) AS revenue,
                    COALESCE(SUM(CASE WHEN wt.type = 'DEPOSIT' AND wt.reason LIKE 'Nạp tiền%' THEN wt.amount ELSE 0 END), 0) AS deposits
                FROM wallet_transactions wt
                WHERE wt.created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
                GROUP BY DATE_FORMAT(wt.created_at, '%Y-%m')
                ORDER BY month ASC
                """);
    }

    // ── Transactions ─────────────────────────────────────────────────────────

    public java.util.Map<String, Object> getAllTransactions(int page, int size, String type) {
        int offset = page * size;
        boolean hasType = type != null && !type.isBlank();
        String where = hasType ? "WHERE wt.type = ?" : "";
        Object[] params = hasType
                ? new Object[]{type, size, offset}
                : new Object[]{size, offset};

        List<java.util.Map<String, Object>> rows = jdbcTemplate.queryForList("""
                SELECT wt.id, wt.user_id, u.display_name AS user_name,
                       wt.amount, wt.type,
                       wt.reason,
                       DATE_FORMAT(wt.created_at, '%Y-%m-%d %H:%i') AS created_at
                FROM wallet_transactions wt
                LEFT JOIN users u ON u.id = wt.user_id
                """ + where + """
                ORDER BY wt.created_at DESC
                LIMIT ? OFFSET ?
                """, params);

        String countSql = hasType
                ? "SELECT COUNT(1) FROM wallet_transactions WHERE type = ?"
                : "SELECT COUNT(1) FROM wallet_transactions";
        Long total = hasType
                ? jdbcTemplate.queryForObject(countSql, Long.class, type)
                : jdbcTemplate.queryForObject(countSql, Long.class);

        return java.util.Map.of(
                "data", rows,
                "total", orZero(total),
                "page", page,
                "totalPages", (int) Math.ceil((double) orZero(total) / size)
        );
    }

    // ── Withdrawal Requests ──────────────────────────────────────────────────

    public java.util.Map<String, Object> getWithdrawalRequests(int page, int size, String status) {
        int offset = page * size;
        boolean hasStatus = status != null && !status.isBlank();
        String where = hasStatus ? "WHERE wr.status = ?" : "";
        Object[] params = hasStatus
                ? new Object[]{status, size, offset}
                : new Object[]{size, offset};

        List<java.util.Map<String, Object>> rows = jdbcTemplate.queryForList("""
                SELECT wr.id, wr.user_id, u.display_name AS user_name,
                       wr.amount, wr.bank_info, wr.note, wr.status, wr.admin_note,
                       DATE_FORMAT(wr.created_at, '%Y-%m-%d %H:%i') AS created_at,
                       DATE_FORMAT(wr.processed_at, '%Y-%m-%d %H:%i') AS processed_at
                FROM withdrawal_requests wr
                LEFT JOIN users u ON u.id = wr.user_id
                """ + where + """
                ORDER BY wr.created_at DESC
                LIMIT ? OFFSET ?
                """, params);

        String countSql = hasStatus
                ? "SELECT COUNT(1) FROM withdrawal_requests WHERE status = ?"
                : "SELECT COUNT(1) FROM withdrawal_requests";
        Long total = hasStatus
                ? jdbcTemplate.queryForObject(countSql, Long.class, status)
                : jdbcTemplate.queryForObject(countSql, Long.class);

        return java.util.Map.of(
                "data", rows,
                "total", orZero(total),
                "page", page,
                "totalPages", (int) Math.ceil((double) orZero(total) / size)
        );
    }

    public void processWithdrawal(Long requestId, String newStatus, String adminNote) {
        if (!"APPROVED".equals(newStatus) && !"REJECTED".equals(newStatus))
            throw new IllegalArgumentException("Trạng thái không hợp lệ");

        List<java.util.Map<String, Object>> rows = jdbcTemplate.queryForList(
                "SELECT user_id, amount, status FROM withdrawal_requests WHERE id = ?", requestId);
        if (rows.isEmpty()) throw new IllegalArgumentException("Yêu cầu không tồn tại");

        java.util.Map<String, Object> row = rows.get(0);
        if (!"PENDING".equals(row.get("status")))
            throw new IllegalArgumentException("Yêu cầu này đã được xử lý");

        long userId = ((Number) row.get("user_id")).longValue();
        long amount = ((Number) row.get("amount")).longValue();

        jdbcTemplate.update(
                "UPDATE withdrawal_requests SET status = ?, admin_note = ?, processed_at = NOW() WHERE id = ?",
                newStatus, adminNote, requestId);

        // Tiền đã bị giữ lúc tạo yêu cầu
        String note = adminNote == null ? "" : adminNote.trim();
        if ("APPROVED".equals(newStatus)) {
            // Tiền đã trừ rồi, không cần trừ lại
            notificationService.sendNotificationToUser(
                    userId,
                    "Yêu cầu rút tiền được duyệt",
                    String.format("Yêu cầu rút %,d xu đã được duyệt. Tiền sẽ chuyển về tài khoản ngân hàng trong 3–5 ngày làm việc.%s",
                            amount, note.isEmpty() ? "" : " Ghi chú: " + note),
                    "WITHDRAWAL",
                    requestId
            );
        } else {
            // Hoàn tiền lại cho tác giả
            walletService.depositMoney(userId, amount, "Hoàn tiền yêu cầu rút #" + requestId + " bị từ chối");
            notificationService.sendNotificationToUser(
                    userId,
                    "Yêu cầu rút tiền bị từ chối",
                    String.format("Yêu cầu rút %,d xu đã bị từ chối. %,d xu đã được hoàn lại vào ví.%s",
                            amount, amount, note.isEmpty() ? "" : " Lý do: " + note),
                    "WITHDRAWAL",
                    requestId
            );
        }
    }

    // ── Featured Comics ───────────────────────────────────────────────────────

    public void setFeaturedStatus(Long comicId, boolean featured) {
        jdbcTemplate.execute("ALTER TABLE published_comics ADD COLUMN IF NOT EXISTS is_featured TINYINT(1) NOT NULL DEFAULT 0");
        jdbcTemplate.update("UPDATE published_comics SET is_featured = ? WHERE id = ?",
                featured ? 1 : 0, comicId);
    }

    private long orZero(Long v) {
        return v == null ? 0L : v;
    }
}
