package com.toptruyen.backend.service;

import com.toptruyen.backend.dto.AuthorStatsResponse;
import com.toptruyen.backend.dto.ChapterStatsItem;
import com.toptruyen.backend.dto.ReportedCommentItem;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AuthorAnalyticsService {

    private final JdbcTemplate jdbcTemplate;

    public AuthorAnalyticsService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public AuthorStatsResponse getComicStats(Long userId, Long comicId) {
        // Verify author owns this comic (simplified check)
        Integer isOwner = jdbcTemplate.queryForObject(
                "SELECT COUNT(1) FROM published_comics WHERE id = ? AND user_id = ?",
                Integer.class,
                comicId,
                userId
        );

        if (isOwner == null || isOwner <= 0) {
            throw new IllegalArgumentException("Ban khong co quyen truy cap thong ke nay");
        }

        // Get comic basic info
        List<String> titles = jdbcTemplate.queryForList(
                "SELECT title FROM published_comics WHERE id = ?",
                String.class,
                comicId
        );
        String comicTitle = titles.isEmpty() ? "Unknown" : titles.get(0);

        // Get follows
        Long totalFollows = jdbcTemplate.queryForObject(
                "SELECT COUNT(1) FROM published_follows WHERE comic_id = ?",
                Long.class,
                comicId
        );
        totalFollows = totalFollows == null ? 0 : totalFollows;

        // Get comments aggregate
        Long totalComments = jdbcTemplate.queryForObject("""
                        SELECT COUNT(1) FROM chapter_comments c
                        JOIN published_chapters ch ON c.chapter_id = ch.id
                        WHERE ch.comic_id = ?
                        """,
                Long.class,
                comicId
        );
        totalComments = totalComments == null ? 0 : totalComments;

        // Get ratings aggregate
        Long totalRatings = jdbcTemplate.queryForObject(
                "SELECT COUNT(1) FROM comic_ratings WHERE comic_id = ?",
                Long.class,
                comicId
        );
        totalRatings = totalRatings == null ? 0 : totalRatings;

        // Get average rating
        Double averageRating = jdbcTemplate.queryForObject(
                "SELECT COALESCE(AVG(rating), 0) FROM comic_ratings WHERE comic_id = ?",
                Double.class,
                comicId
        );
        averageRating = averageRating == null ? 0 : averageRating;

        // Get chapter count
        Integer totalChapters = jdbcTemplate.queryForObject(
                "SELECT COUNT(1) FROM published_chapters WHERE comic_id = ?",
                Integer.class,
                comicId
        );
        totalChapters = totalChapters == null ? 0 : totalChapters;

        // Get chapter stats
        List<ChapterStatsItem> chapterStats = jdbcTemplate.query("""
                        SELECT ch.id, ch.chapter_no, ch.title,
                               COALESCE(cc.comment_count, 0) AS comment_count,
                               COALESCE(cr.reply_count, 0) AS reply_count,
                               COALESCE(rep.report_count, 0) AS report_count,
                               DATE_FORMAT(ch.published_at, '%Y-%m-%d %H:%i:%s') AS published_at
                        FROM published_chapters ch
                        LEFT JOIN (SELECT chapter_id, COUNT(1) AS comment_count FROM chapter_comments GROUP BY chapter_id) cc ON cc.chapter_id = ch.id
                        LEFT JOIN (SELECT ch2.id, COUNT(1) AS reply_count FROM comment_replies cr JOIN chapter_comments cc ON cr.parent_comment_id = cc.id JOIN published_chapters ch2 ON cc.chapter_id = ch2.id GROUP BY ch2.id) cr ON cr.id = ch.id
                        LEFT JOIN (SELECT ch2.id, COUNT(1) AS report_count FROM comment_reports crep JOIN chapter_comments cc ON crep.comment_id = cc.id JOIN published_chapters ch2 ON cc.chapter_id = ch2.id GROUP BY ch2.id) rep ON rep.id = ch.id
                        WHERE ch.comic_id = ?
                        ORDER BY ch.chapter_no DESC
                        """,
                (rs, rowNum) -> new ChapterStatsItem(
                        rs.getLong("id"),
                        rs.getInt("chapter_no"),
                        rs.getString("title"),
                        rs.getLong("comment_count"),
                        rs.getLong("reply_count"),
                        rs.getLong("report_count"),
                        rs.getString("published_at")
                ),
                comicId
        );

        return new AuthorStatsResponse(
                comicTitle,
                totalFollows,
                totalComments,
                totalRatings,
                averageRating,
                totalChapters,
                chapterStats
        );
    }

    public List<ReportedCommentItem> getReportedComments(Long userId, Long comicId) {
        // Verify author owns this comic
        Integer isOwner = jdbcTemplate.queryForObject(
                "SELECT COUNT(1) FROM published_comics WHERE id = ? AND user_id = ?",
                Integer.class,
                comicId,
                userId
        );

        if (isOwner == null || isOwner <= 0) {
            throw new IllegalArgumentException("Ban khong co quyen truy cap");
        }

        return jdbcTemplate.query("""
                        SELECT rep.id, cc.id AS comment_id, ch.id AS chapter_id, cc.content,
                               rep.reason, rep.status, u.display_name,
                               DATE_FORMAT(rep.created_at, '%Y-%m-%d %H:%i:%s') AS created_at
                        FROM comment_reports rep
                        JOIN chapter_comments cc ON rep.comment_id = cc.id
                        JOIN published_chapters ch ON cc.chapter_id = ch.id
                        JOIN users u ON rep.user_id = u.id
                        WHERE ch.comic_id = ? AND rep.status = 'PENDING'
                        ORDER BY rep.created_at DESC
                        LIMIT 100
                        """,
                (rs, rowNum) -> new ReportedCommentItem(
                        rs.getLong("id"),
                        rs.getLong("comment_id"),
                        rs.getLong("chapter_id"),
                        rs.getString("content"),
                        rs.getString("reason"),
                        rs.getString("status"),
                        rs.getString("display_name"),
                        rs.getString("created_at")
                ),
                comicId
        );
    }

    public List<java.util.Map<String, Object>> getAllMyComicsStats(Long userId) {
        return jdbcTemplate.queryForList("""
                SELECT pc.id AS comicId, pc.title, pc.cover_url AS coverUrl, pc.slug,
                       COALESCE(v.total_views, 0)      AS totalViews,
                       COALESCE(c.total_comments, 0)   AS totalComments,
                       COALESCE(r.total_ratings, 0)    AS totalRatings,
                       COALESCE(r.avg_rating, 0)       AS avgRating,
                       COALESCE(f.total_follows, 0)    AS totalFollows,
                       COALESCE(ch.total_chapters, 0)  AS totalChapters
                FROM published_comics pc
                LEFT JOIN (
                    SELECT comic_id, SUM(view_count) AS total_views
                    FROM published_chapters GROUP BY comic_id
                ) v ON v.comic_id = pc.id
                LEFT JOIN (
                    SELECT ch2.comic_id, COUNT(1) AS total_comments
                    FROM chapter_comments cc
                    JOIN published_chapters ch2 ON cc.chapter_id = ch2.id
                    GROUP BY ch2.comic_id
                ) c ON c.comic_id = pc.id
                LEFT JOIN (
                    SELECT comic_id, COUNT(1) AS total_ratings, AVG(rating) AS avg_rating
                    FROM comic_ratings GROUP BY comic_id
                ) r ON r.comic_id = pc.id
                LEFT JOIN (
                    SELECT comic_id, COUNT(1) AS total_follows
                    FROM published_follows GROUP BY comic_id
                ) f ON f.comic_id = pc.id
                LEFT JOIN (
                    SELECT comic_id, COUNT(1) AS total_chapters
                    FROM published_chapters GROUP BY comic_id
                ) ch ON ch.comic_id = pc.id
                WHERE pc.user_id = ?
                ORDER BY COALESCE(v.total_views, 0) DESC
                """, userId);
    }

    public void dismissReport(Long userId, Long reportId) {
        // Verify the user is the author of the comic containing this reported comment
        Integer isAuthor = jdbcTemplate.queryForObject("""
                        SELECT COUNT(1) FROM comment_reports rep
                        JOIN chapter_comments cc ON rep.comment_id = cc.id
                        JOIN published_chapters ch ON cc.chapter_id = ch.id
                        JOIN published_comics pc ON ch.comic_id = pc.id
                        WHERE rep.id = ? AND pc.user_id = ?
                        """,
                Integer.class,
                reportId,
                userId
        );

        if (isAuthor == null || isAuthor <= 0) {
            throw new IllegalArgumentException("Ban khong co quyen");
        }

                jdbcTemplate.update("UPDATE comment_reports SET status = 'DISMISSED', reviewed_at = NOW() WHERE id = ?", reportId);
    }

    public List<java.util.Map<String, Object>> getComicReports(Long userId, Long comicId) {
        Integer isOwner = jdbcTemplate.queryForObject(
                "SELECT COUNT(1) FROM published_comics WHERE id = ? AND user_id = ?",
                Integer.class,
                comicId,
                userId
        );

        if (isOwner == null || isOwner <= 0) {
            throw new IllegalArgumentException("Ban khong co quyen truy cap");
        }

        return jdbcTemplate.queryForList("""
                SELECT cr.id, cr.target_type AS targetType, cr.target_id AS targetId,
                       CASE
                         WHEN cr.target_type = 'COMIC' THEN pc.title
                         WHEN cr.target_type = 'CHAPTER' THEN ch.title
                         ELSE NULL
                       END AS targetTitle,
                       cr.reason, cr.status,
                       DATE_FORMAT(cr.reviewed_at, '%Y-%m-%d %H:%i') AS reviewedAt,
                       DATE_ADD(cr.reviewed_at, INTERVAL 7 DAY) AS appealDeadline,
                       CASE WHEN ra.id IS NOT NULL THEN true ELSE false END AS hasAppeal,
                       ra.status AS appealStatus
                FROM content_reports cr
                LEFT JOIN published_comics pc ON pc.id = cr.target_id AND cr.target_type = 'COMIC'
                LEFT JOIN published_chapters ch ON ch.id = cr.target_id AND cr.target_type = 'CHAPTER'
                LEFT JOIN report_appeals ra ON ra.report_id = cr.id AND ra.report_scope = 'CONTENT'
                WHERE (
                  (cr.target_type = 'COMIC' AND cr.target_id = ?)
                  OR (cr.target_type = 'CHAPTER' AND ch.comic_id = ?)
                )
                AND cr.status IN ('RESOLVED', 'FLAGGED')
                ORDER BY cr.reviewed_at DESC
                """, comicId, comicId);
    }

    public java.util.Map<String, Object> getAppealStatus(Long userId, Long reportId) {
        var report = jdbcTemplate.queryForMap(
                "SELECT target_type, target_id FROM content_reports WHERE id = ?", reportId);

        String targetType = (String) report.get("target_type");
        Long targetId = ((Number) report.get("target_id")).longValue();

        if ("COMIC".equals(targetType)) {
            Integer isOwner = jdbcTemplate.queryForObject(
                    "SELECT COUNT(1) FROM published_comics WHERE id = ? AND user_id = ?",
                    Integer.class,
                    targetId,
                    userId
            );
            if (isOwner == null || isOwner <= 0) {
                throw new IllegalArgumentException("Ban khong co quyen");
            }
        } else if ("CHAPTER".equals(targetType)) {
            Integer isOwner = jdbcTemplate.queryForObject(
                    "SELECT COUNT(1) FROM published_chapters ch JOIN published_comics pc ON pc.id = ch.comic_id WHERE ch.id = ? AND pc.user_id = ?",
                    Integer.class,
                    targetId,
                    userId
            );
            if (isOwner == null || isOwner <= 0) {
                throw new IllegalArgumentException("Ban khong co quyen");
            }
        }

        List<java.util.Map<String, Object>> appeals = jdbcTemplate.queryForList(
            "SELECT id, status, message, admin_note, DATE_FORMAT(reviewed_at, '%Y-%m-%d %H:%i') AS reviewedAt FROM report_appeals WHERE report_id = ? AND report_scope = 'CONTENT'",
            reportId
        );

        if (appeals.isEmpty()) {
            // No appeal yet - return report info so frontend can show title/reason/reportedAt
            java.util.Map<String, Object> reportRow = jdbcTemplate.queryForMap(
                "SELECT cr.id, cr.reason, DATE_FORMAT(cr.created_at, '%Y-%m-%d %H:%i') AS reportedAt, pc.title AS targetTitle, ch.title AS chapterTitle, cr.target_type FROM content_reports cr LEFT JOIN published_comics pc ON pc.id = cr.target_id AND cr.target_type = 'COMIC' LEFT JOIN published_chapters ch ON ch.id = cr.target_id AND cr.target_type = 'CHAPTER' WHERE cr.id = ?",
                reportId
            );

            String reportRowTargetType = (String) reportRow.get("target_type");
            String targetTitle = null;
            if ("COMIC".equals(reportRowTargetType)) targetTitle = (String) reportRow.get("targetTitle");
            else if ("CHAPTER".equals(reportRowTargetType)) targetTitle = (String) reportRow.get("chapterTitle");

            java.util.Map<String, Object> result = new java.util.HashMap<>();
            result.put("found", false);
            result.put("reason", reportRow.get("reason"));
            result.put("reportedAt", reportRow.get("reportedAt"));
            result.put("targetTitle", targetTitle);
            return result;
        }
        return new java.util.HashMap<>(appeals.get(0));
    }
}
