package com.toptruyen.backend.service;

import com.toptruyen.backend.dto.AuthorPostCommentItem;
import com.toptruyen.backend.dto.AuthorPostItem;
import com.toptruyen.backend.dto.CommentItemResponse;
import com.toptruyen.backend.dto.ComicRatingSummaryResponse;
import com.toptruyen.backend.dto.CommentReplyItem;
import jakarta.annotation.PostConstruct;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Set;

@Service
public class InteractionService {

    private static final Set<String> REPORT_TARGET_TYPES = Set.of("COMIC", "CHAPTER", "COMMENT");
    private static final int AUTO_FLAG_THRESHOLD = 3;

    private final JdbcTemplate jdbcTemplate;
    private final NotificationService notificationService;

    public InteractionService(JdbcTemplate jdbcTemplate, NotificationService notificationService) {
        this.jdbcTemplate = jdbcTemplate;
        this.notificationService = notificationService;
    }

    @PostConstruct
    public void ensureTables() {
        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS chapter_comments (
                    id BIGINT AUTO_INCREMENT PRIMARY KEY,
                    chapter_id BIGINT NOT NULL,
                    user_id BIGINT NOT NULL,
                    content TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX (chapter_id),
                    INDEX (user_id)
                )
                """);

        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS comic_ratings (
                    id BIGINT AUTO_INCREMENT PRIMARY KEY,
                    comic_id BIGINT NOT NULL,
                    user_id BIGINT NOT NULL,
                    rating INT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    UNIQUE KEY uk_comic_ratings_comic_user (comic_id, user_id),
                    INDEX (comic_id),
                    INDEX (user_id)
                )
                """);

        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS comment_replies (
                    id BIGINT AUTO_INCREMENT PRIMARY KEY,
                    parent_comment_id BIGINT NOT NULL,
                    user_id BIGINT NOT NULL,
                    content TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX (parent_comment_id, created_at),
                    INDEX (user_id)
                )
                """);

        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS comment_reports (
                    id BIGINT AUTO_INCREMENT PRIMARY KEY,
                    comment_id BIGINT NOT NULL,
                    user_id BIGINT NOT NULL,
                    reason VARCHAR(255) NOT NULL,
                    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
                    reviewed_by BIGINT NULL,
                    reviewer_note TEXT NULL,
                    reviewed_at TIMESTAMP NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX (comment_id, user_id)
                )
                """);

            // Ensure legacy databases have the expected columns
            if (!columnExists("comment_reports", "status")) {
                jdbcTemplate.update("ALTER TABLE comment_reports ADD COLUMN status VARCHAR(32) NOT NULL DEFAULT 'PENDING'");
            }
            if (!columnExists("comment_reports", "reviewer_note")) {
                jdbcTemplate.update("ALTER TABLE comment_reports ADD COLUMN reviewer_note TEXT NULL");
            }
            if (!columnExists("comment_reports", "reviewed_by")) {
                jdbcTemplate.update("ALTER TABLE comment_reports ADD COLUMN reviewed_by BIGINT NULL");
            }
            if (!columnExists("comment_reports", "reviewed_at")) {
                jdbcTemplate.update("ALTER TABLE comment_reports ADD COLUMN reviewed_at TIMESTAMP NULL");
            }

        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS content_reports (
                    id BIGINT AUTO_INCREMENT PRIMARY KEY,
                    user_id BIGINT NOT NULL,
                    target_type VARCHAR(32) NOT NULL,
                    target_id BIGINT NOT NULL,
                    reason TEXT NOT NULL,
                    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
                    reviewed_by BIGINT NULL,
                    reviewer_note TEXT NULL,
                    reviewed_at TIMESTAMP NULL,
                    auto_flagged TINYINT(1) NOT NULL DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX (target_type, target_id),
                    INDEX (user_id)
                )
                """);

            // Ensure legacy databases have the expected columns
            if (!columnExists("content_reports", "status")) {
                jdbcTemplate.update("ALTER TABLE content_reports ADD COLUMN status VARCHAR(32) NOT NULL DEFAULT 'PENDING'");
            }
            if (!columnExists("content_reports", "reviewer_note")) {
                jdbcTemplate.update("ALTER TABLE content_reports ADD COLUMN reviewer_note TEXT NULL");
            }
            if (!columnExists("content_reports", "reviewed_by")) {
                jdbcTemplate.update("ALTER TABLE content_reports ADD COLUMN reviewed_by BIGINT NULL");
            }
            if (!columnExists("content_reports", "reviewed_at")) {
                jdbcTemplate.update("ALTER TABLE content_reports ADD COLUMN reviewed_at TIMESTAMP NULL");
            }
            if (!columnExists("content_reports", "auto_flagged")) {
                jdbcTemplate.update("ALTER TABLE content_reports ADD COLUMN auto_flagged TINYINT(1) NOT NULL DEFAULT 0");
            }

        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS report_audit_logs (
                    id BIGINT AUTO_INCREMENT PRIMARY KEY,
                    report_scope VARCHAR(32) NOT NULL,
                    report_id BIGINT NOT NULL,
                    action VARCHAR(32) NOT NULL,
                    actor_user_id BIGINT NULL,
                    note TEXT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX (report_scope, report_id),
                    INDEX (actor_user_id)
                )
                """);

        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS report_appeals (
                    id BIGINT AUTO_INCREMENT PRIMARY KEY,
                    report_scope VARCHAR(32) NOT NULL,
                    report_id BIGINT NOT NULL,
                    reporter_user_id BIGINT NOT NULL,
                    message TEXT NOT NULL,
                    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
                    admin_note TEXT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    reviewed_at TIMESTAMP NULL,
                    INDEX (report_scope, report_id),
                    INDEX (reporter_user_id)
                )
                """);

        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS published_follows (
                    id BIGINT AUTO_INCREMENT PRIMARY KEY,
                    user_id BIGINT NOT NULL,
                    comic_id BIGINT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE KEY uk_published_follows (user_id, comic_id),
                    INDEX (user_id),
                    INDEX (comic_id)
                )
                """);

        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS chapter_unlocks (
                    id BIGINT AUTO_INCREMENT PRIMARY KEY,
                    user_id BIGINT NOT NULL,
                    chapter_id BIGINT NOT NULL,
                    unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE KEY uk_chapter_unlocks (user_id, chapter_id),
                    INDEX (user_id),
                    INDEX (chapter_id)
                )
                """);

        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS comic_comments (
                    id BIGINT AUTO_INCREMENT PRIMARY KEY,
                    comic_id BIGINT NOT NULL,
                    user_id BIGINT NOT NULL,
                    content TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX (comic_id),
                    INDEX (user_id)
                )
                """);

        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS comic_comment_replies (
                    id BIGINT AUTO_INCREMENT PRIMARY KEY,
                    parent_comment_id BIGINT NOT NULL,
                    user_id BIGINT NOT NULL,
                    content TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX (parent_comment_id, created_at),
                    INDEX (user_id)
                )
                """);

        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS author_posts (
                    id BIGINT AUTO_INCREMENT PRIMARY KEY,
                    author_page_name VARCHAR(255) NOT NULL,
                    user_id BIGINT NOT NULL,
                    content TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX (author_page_name, created_at),
                    INDEX (user_id)
                )
                """);

        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS author_post_comments (
                    id BIGINT AUTO_INCREMENT PRIMARY KEY,
                    post_id BIGINT NOT NULL,
                    user_id BIGINT NOT NULL,
                    content TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX (post_id, created_at),
                    INDEX (user_id)
                )
                """);
    }

    public List<CommentItemResponse> getChapterComments(Long chapterId, Long currentUserId, int page, int size) {
        if (!isPublishedChapter(chapterId)) {
            throw new IllegalArgumentException("Chapter khong ton tai");
        }

        int offset = page * size;
        Long uid = currentUserId == null ? -1L : currentUserId;
        return jdbcTemplate.query("""
                        SELECT c.id,
                               c.chapter_id,
                               c.user_id,
                               u.display_name,
                               c.content,
                               DATE_FORMAT(c.created_at, '%Y-%m-%d %H:%i:%s') AS created_at,
                               CASE WHEN c.user_id = ? THEN TRUE ELSE FALSE END AS own,
                               (SELECT COUNT(1) FROM comment_replies cr WHERE cr.parent_comment_id = c.id) AS reply_count
                        FROM chapter_comments c
                        JOIN users u ON u.id = c.user_id
                        WHERE c.chapter_id = ?
                        ORDER BY c.created_at DESC, c.id DESC
                        LIMIT ? OFFSET ?
                        """,
                (rs, rowNum) -> new CommentItemResponse(
                        rs.getLong("id"),
                        rs.getLong("chapter_id"),
                        rs.getLong("user_id"),
                        rs.getString("display_name"),
                        rs.getString("content"),
                        rs.getString("created_at"),
                        rs.getBoolean("own"),
                        rs.getInt("reply_count")
                ),
                uid,
                chapterId,
                size,
                offset
        );
    }

    public void createComment(Long userId, Long chapterId, String content) {
        if (!isPublishedChapter(chapterId)) {
            throw new IllegalArgumentException("Chapter khong ton tai");
        }

        String normalized = content == null ? "" : content.trim();
        if (normalized.isEmpty()) {
            throw new IllegalArgumentException("Noi dung binh luan khong duoc de trong");
        }

        jdbcTemplate.update("""
                        INSERT INTO chapter_comments(chapter_id, user_id, content)
                        VALUES (?, ?, ?)
                        """,
                chapterId,
                userId,
                normalized
        );

        try {
            List<java.util.Map<String, Object>> rows = jdbcTemplate.queryForList("""
                    SELECT pc.user_id AS author_id, pc.slug, pc.title AS comic_title,
                           ch.chapter_no, u.display_name AS commenter_name
                    FROM published_chapters ch
                    JOIN published_comics pc ON pc.id = ch.comic_id
                    JOIN users u ON u.id = ?
                    WHERE ch.id = ?
                    """, userId, chapterId);
            if (!rows.isEmpty()) {
                Long authorId = ((Number) rows.get(0).get("author_id")).longValue();
                if (!authorId.equals(userId)) {
                    String slug = (String) rows.get(0).get("slug");
                    String comicTitle = (String) rows.get(0).get("comic_title");
                    Integer chapterNo = (Integer) rows.get(0).get("chapter_no");
                    String commenterName = (String) rows.get(0).get("commenter_name");
                    notificationService.createNotification(
                            authorId, "COMMENT_ON_CHAPTER",
                            "Bình luận mới trên truyện của bạn",
                            commenterName + " đã bình luận trong \"" + comicTitle + "\" - Chương " + chapterNo,
                            chapterId, "/doc-truyen/" + slug + "/" + chapterId
                    );
                }
            }
        } catch (Exception ignored) {}
    }

    public void deleteComment(Long userId, Long commentId) {
        Integer affected = jdbcTemplate.update(
                "DELETE FROM chapter_comments WHERE id = ? AND user_id = ?",
                commentId,
                userId
        );

        if (affected == null || affected <= 0) {
            throw new IllegalArgumentException("Khong tim thay binh luan hoac ban khong co quyen xoa");
        }
    }

    public ComicRatingSummaryResponse getComicRatingSummary(Long comicId, Long userId) {
        if (!isPublishedComic(comicId)) {
            throw new IllegalArgumentException("Truyen khong ton tai");
        }

        AggregateRating aggregate = jdbcTemplate.queryForObject("""
                        SELECT COALESCE(AVG(rating), 0) AS avg_rating,
                               COUNT(1) AS total_ratings
                        FROM comic_ratings
                        WHERE comic_id = ?
                        """,
                (rs, rowNum) -> new AggregateRating(
                        rs.getDouble("avg_rating"),
                        rs.getLong("total_ratings")
                ),
                comicId
        );

        Integer currentUserRating = null;
        if (userId != null) {
            List<Integer> rows = jdbcTemplate.query(
                    "SELECT rating FROM comic_ratings WHERE comic_id = ? AND user_id = ? LIMIT 1",
                    (rs, rowNum) -> rs.getInt("rating"),
                    comicId,
                    userId
            );
            if (!rows.isEmpty()) {
                currentUserRating = rows.get(0);
            }
        }

        AggregateRating value = aggregate == null ? new AggregateRating(0, 0) : aggregate;
        return new ComicRatingSummaryResponse(
                comicId,
                value.averageRating(),
                value.totalRatings(),
                currentUserRating
        );
    }

    public void rateComic(Long userId, Long comicId, int rating) {
        if (!isPublishedComic(comicId)) {
            throw new IllegalArgumentException("Truyen khong ton tai");
        }

        if (rating < 1 || rating > 5) {
            throw new IllegalArgumentException("Danh gia khong hop le");
        }

        jdbcTemplate.update("""
                        INSERT INTO comic_ratings(comic_id, user_id, rating)
                        VALUES (?, ?, ?)
                        ON DUPLICATE KEY UPDATE rating = VALUES(rating), updated_at = CURRENT_TIMESTAMP
                        """,
                comicId,
                userId,
                rating
        );
    }

    public List<CommentReplyItem> getCommentReplies(Long parentCommentId) {
        return jdbcTemplate.query("""
                        SELECT cr.id, cr.parent_comment_id, cr.user_id, u.display_name, cr.content,
                               DATE_FORMAT(cr.created_at, '%Y-%m-%d %H:%i:%s') AS created_at
                        FROM comment_replies cr
                        JOIN users u ON u.id = cr.user_id
                        WHERE cr.parent_comment_id = ?
                        ORDER BY cr.created_at ASC
                        LIMIT 50
                        """,
                (rs, rowNum) -> new CommentReplyItem(
                        rs.getLong("id"),
                        rs.getLong("parent_comment_id"),
                        rs.getLong("user_id"),
                        rs.getString("display_name"),
                        rs.getString("content"),
                        rs.getString("created_at")
                ),
                parentCommentId
        );
    }

    public void createCommentReply(Long userId, Long parentCommentId, String content) {
        // Verify parent comment exists
        Integer commentExists = jdbcTemplate.queryForObject(
                "SELECT COUNT(1) FROM chapter_comments WHERE id = ?",
                Integer.class,
                parentCommentId
        );

        if (commentExists == null || commentExists <= 0) {
            throw new IllegalArgumentException("Binh luan goc khong ton tai");
        }

        String normalized = content == null ? "" : content.trim();
        if (normalized.isEmpty()) {
            throw new IllegalArgumentException("Noi dung tra loi khong duoc de trong");
        }

        jdbcTemplate.update(
                "INSERT INTO comment_replies (parent_comment_id, user_id, content) VALUES (?, ?, ?)",
                parentCommentId, userId, normalized
        );
    }

    public void deleteCommentReply(Long userId, Long replyId) {
        Integer affected = jdbcTemplate.update(
                "DELETE FROM comment_replies WHERE id = ? AND user_id = ?",
                replyId, userId
        );

        if (affected == null || affected <= 0) {
            throw new IllegalArgumentException("Khong tim thay tra loi hoac ban khong co quyen xoa");
        }
    }

    private boolean columnExists(String tableName, String columnName) {
        Integer cnt = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?",
                Integer.class,
                tableName,
                columnName
        );
        return cnt != null && cnt > 0;
    }

    public Long reportComment(Long userId, Long commentId, String reason) {
        // Verify comment exists
        Integer commentExists = jdbcTemplate.queryForObject(
                "SELECT COUNT(1) FROM chapter_comments WHERE id = ?",
                Integer.class,
                commentId
        );

        if (commentExists == null || commentExists <= 0) {
            throw new IllegalArgumentException("Binh luan khong ton tai");
        }

        String normalizedReason = reason == null ? "" : reason.trim();
        if (normalizedReason.isEmpty()) {
            throw new IllegalArgumentException("Ly do bao cao khong duoc de trong");
        }

        Integer existingActive = jdbcTemplate.queryForObject(
            "SELECT COUNT(1) FROM comment_reports WHERE comment_id = ? AND user_id = ? AND status IN ('PENDING', 'FLAGGED')",
            Integer.class,
            commentId,
            userId
        );
        if (existingActive != null && existingActive > 0) {
            throw new IllegalArgumentException("Ban da bao cao binh luan nay roi");
        }

        jdbcTemplate.update(
            "INSERT INTO comment_reports (comment_id, user_id, reason) VALUES (?, ?, ?)",
                commentId, userId, normalizedReason
        );
        Long reportId = jdbcTemplate.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
        if (reportId != null) {
            jdbcTemplate.update(
                "INSERT INTO report_audit_logs(report_scope, report_id, action, actor_user_id, note) VALUES ('COMMENT', ?, 'CREATED', ?, ?)",
                reportId, userId, normalizedReason
            );
            // Do not notify the owner at report creation; notifications are sent only
            // when an admin resolves and hides the content.
        }
        return reportId;
    }

    public List<CommentItemResponse> getComicDiscussionComments(Long comicId, Long currentUserId, int page, int size) {
        if (!isPublishedComic(comicId)) {
            throw new IllegalArgumentException("Truyen khong ton tai");
        }
        int offset = page * size;
        Long uid = currentUserId == null ? -1L : currentUserId;
        return jdbcTemplate.query("""
                        SELECT c.id,
                               c.comic_id,
                               c.user_id,
                               u.display_name,
                               c.content,
                               DATE_FORMAT(c.created_at, '%Y-%m-%d %H:%i:%s') AS created_at,
                               CASE WHEN c.user_id = ? THEN TRUE ELSE FALSE END AS own,
                               (SELECT COUNT(1) FROM comic_comment_replies cr WHERE cr.parent_comment_id = c.id) AS reply_count
                        FROM comic_comments c
                        JOIN users u ON u.id = c.user_id
                        WHERE c.comic_id = ?
                        ORDER BY c.created_at DESC, c.id DESC
                        LIMIT ? OFFSET ?
                        """,
                (rs, rowNum) -> new CommentItemResponse(
                        rs.getLong("id"),
                        rs.getLong("comic_id"),
                        rs.getLong("user_id"),
                        rs.getString("display_name"),
                        rs.getString("content"),
                        rs.getString("created_at"),
                        rs.getBoolean("own"),
                        rs.getInt("reply_count")
                ),
                uid, comicId, size, offset
        );
    }

    public void createComicDiscussionComment(Long userId, Long comicId, String content) {
        if (!isPublishedComic(comicId)) {
            throw new IllegalArgumentException("Truyen khong ton tai");
        }
        String normalized = content == null ? "" : content.trim();
        if (normalized.isEmpty()) {
            throw new IllegalArgumentException("Noi dung binh luan khong duoc de trong");
        }
        jdbcTemplate.update(
                "INSERT INTO comic_comments(comic_id, user_id, content) VALUES (?, ?, ?)",
                comicId, userId, normalized
        );
        try {
            List<java.util.Map<String, Object>> rows = jdbcTemplate.queryForList("""
                    SELECT pc.user_id AS author_id, pc.title AS comic_title, u.display_name AS commenter_name
                    FROM published_comics pc
                    JOIN users u ON u.id = ?
                    WHERE pc.id = ?
                    """, userId, comicId);
            if (!rows.isEmpty()) {
                Long authorId = ((Number) rows.get(0).get("author_id")).longValue();
                if (!authorId.equals(userId)) {
                    String comicTitle = (String) rows.get(0).get("comic_title");
                    String commenterName = (String) rows.get(0).get("commenter_name");
                    notificationService.createNotification(
                            authorId, "COMMENT_ON_COMIC",
                            "Bình luận mới trên truyện của bạn",
                            commenterName + " đã bình luận về truyện \"" + comicTitle + "\"",
                            comicId, null
                    );
                }
            }
        } catch (Exception ignored) {}
    }

    public void deleteComicDiscussionComment(Long userId, Long commentId) {
        Integer affected = jdbcTemplate.update(
                "DELETE FROM comic_comments WHERE id = ? AND user_id = ?",
                commentId, userId
        );
        if (affected == null || affected <= 0) {
            throw new IllegalArgumentException("Khong tim thay binh luan hoac ban khong co quyen xoa");
        }
        jdbcTemplate.update("DELETE FROM comic_comment_replies WHERE parent_comment_id = ?", commentId);
    }

    public List<CommentReplyItem> getComicDiscussionReplies(Long parentCommentId) {
        return jdbcTemplate.query("""
                        SELECT cr.id, cr.parent_comment_id, cr.user_id, u.display_name, cr.content,
                               DATE_FORMAT(cr.created_at, '%Y-%m-%d %H:%i:%s') AS created_at
                        FROM comic_comment_replies cr
                        JOIN users u ON u.id = cr.user_id
                        WHERE cr.parent_comment_id = ?
                        ORDER BY cr.created_at ASC
                        LIMIT 50
                        """,
                (rs, rowNum) -> new CommentReplyItem(
                        rs.getLong("id"),
                        rs.getLong("parent_comment_id"),
                        rs.getLong("user_id"),
                        rs.getString("display_name"),
                        rs.getString("content"),
                        rs.getString("created_at")
                ),
                parentCommentId
        );
    }

    public void createComicDiscussionReply(Long userId, Long parentCommentId, String content) {
        Integer commentExists = jdbcTemplate.queryForObject(
                "SELECT COUNT(1) FROM comic_comments WHERE id = ?",
                Integer.class, parentCommentId
        );
        if (commentExists == null || commentExists <= 0) {
            throw new IllegalArgumentException("Binh luan goc khong ton tai");
        }
        String normalized = content == null ? "" : content.trim();
        if (normalized.isEmpty()) {
            throw new IllegalArgumentException("Noi dung tra loi khong duoc de trong");
        }
        jdbcTemplate.update(
                "INSERT INTO comic_comment_replies(parent_comment_id, user_id, content) VALUES (?, ?, ?)",
                parentCommentId, userId, normalized
        );
    }

    public void deleteComicDiscussionReply(Long userId, Long replyId) {
        Integer affected = jdbcTemplate.update(
                "DELETE FROM comic_comment_replies WHERE id = ? AND user_id = ?",
                replyId, userId
        );
        if (affected == null || affected <= 0) {
            throw new IllegalArgumentException("Khong tim thay tra loi hoac ban khong co quyen xoa");
        }
    }

    public List<AuthorPostItem> getAuthorPosts(String authorPageName, Long currentUserId, int page, int size) {
        int offset = page * size;
        Long uid = currentUserId == null ? -1L : currentUserId;
        return jdbcTemplate.query("""
                        SELECT p.id,
                               p.author_page_name,
                               p.user_id,
                               u.display_name,
                               u.avatar_url,
                               CASE WHEN u.display_name = p.author_page_name THEN TRUE ELSE FALSE END AS is_author,
                               p.content,
                               DATE_FORMAT(p.created_at, '%Y-%m-%d %H:%i:%s') AS created_at,
                               CASE WHEN p.user_id = ? THEN TRUE ELSE FALSE END AS own,
                               (SELECT COUNT(1) FROM author_post_comments c WHERE c.post_id = p.id) AS comment_count
                        FROM author_posts p
                        JOIN users u ON u.id = p.user_id
                        WHERE p.author_page_name = ?
                        ORDER BY p.created_at DESC, p.id DESC
                        LIMIT ? OFFSET ?
                        """,
                (rs, rowNum) -> new AuthorPostItem(
                        rs.getLong("id"),
                        rs.getString("author_page_name"),
                        rs.getLong("user_id"),
                        rs.getString("display_name"),
                        rs.getString("avatar_url"),
                        rs.getBoolean("is_author"),
                        rs.getString("content"),
                        rs.getString("created_at"),
                        rs.getBoolean("own"),
                        rs.getInt("comment_count")
                ),
                uid, authorPageName, size, offset
        );
    }

    public void createAuthorPost(Long userId, String authorPageName, String content) {
        String normalized = content == null ? "" : content.trim();
        if (normalized.isEmpty()) {
            throw new IllegalArgumentException("Noi dung bai dang khong duoc de trong");
        }
        if (normalized.length() > 2000) {
            throw new IllegalArgumentException("Noi dung bai dang khong qua 2000 ky tu");
        }
        jdbcTemplate.update(
                "INSERT INTO author_posts(author_page_name, user_id, content) VALUES (?, ?, ?)",
                authorPageName, userId, normalized
        );
    }

    public void deleteAuthorPost(Long userId, Long postId) {
        Integer affected = jdbcTemplate.update(
                "DELETE FROM author_posts WHERE id = ? AND user_id = ?",
                postId, userId
        );
        if (affected == null || affected <= 0) {
            throw new IllegalArgumentException("Khong tim thay bai dang hoac ban khong co quyen xoa");
        }
        jdbcTemplate.update("DELETE FROM author_post_comments WHERE post_id = ?", postId);
    }

    public List<AuthorPostCommentItem> getAuthorPostComments(Long postId, String authorPageName, Long currentUserId) {
        Long uid = currentUserId == null ? -1L : currentUserId;
        return jdbcTemplate.query("""
                        SELECT c.id,
                               c.post_id,
                               c.user_id,
                               u.display_name,
                               u.avatar_url,
                               CASE WHEN u.display_name = ? THEN TRUE ELSE FALSE END AS is_author,
                               c.content,
                               DATE_FORMAT(c.created_at, '%Y-%m-%d %H:%i:%s') AS created_at,
                               CASE WHEN c.user_id = ? THEN TRUE ELSE FALSE END AS own
                        FROM author_post_comments c
                        JOIN users u ON u.id = c.user_id
                        WHERE c.post_id = ?
                        ORDER BY c.created_at ASC
                        LIMIT 100
                        """,
                (rs, rowNum) -> new AuthorPostCommentItem(
                        rs.getLong("id"),
                        rs.getLong("post_id"),
                        rs.getLong("user_id"),
                        rs.getString("display_name"),
                        rs.getString("avatar_url"),
                        rs.getBoolean("is_author"),
                        rs.getString("content"),
                        rs.getString("created_at"),
                        rs.getBoolean("own")
                ),
                authorPageName, uid, postId
        );
    }

    public void createAuthorPostComment(Long userId, Long postId, String content) {
        Integer postExists = jdbcTemplate.queryForObject(
                "SELECT COUNT(1) FROM author_posts WHERE id = ?",
                Integer.class, postId
        );
        if (postExists == null || postExists <= 0) {
            throw new IllegalArgumentException("Bai dang khong ton tai");
        }
        String normalized = content == null ? "" : content.trim();
        if (normalized.isEmpty()) {
            throw new IllegalArgumentException("Noi dung binh luan khong duoc de trong");
        }
        jdbcTemplate.update(
                "INSERT INTO author_post_comments(post_id, user_id, content) VALUES (?, ?, ?)",
                postId, userId, normalized
        );
    }

    public void deleteAuthorPostComment(Long userId, Long commentId) {
        Integer affected = jdbcTemplate.update(
                "DELETE FROM author_post_comments WHERE id = ? AND user_id = ?",
                commentId, userId
        );
        if (affected == null || affected <= 0) {
            throw new IllegalArgumentException("Khong tim thay binh luan hoac ban khong co quyen xoa");
        }
    }

    public Long reportContent(Long userId, String targetType, Long targetId, String reason) {
        if (!REPORT_TARGET_TYPES.contains(targetType)) {
            throw new IllegalArgumentException("Loại báo cáo không hợp lệ");
        }
        if ("COMIC".equals(targetType) && !isPublishedComic(targetId)) {
            throw new IllegalArgumentException("Truyện không tồn tại");
        }
        if ("CHAPTER".equals(targetType) && !isPublishedChapter(targetId)) {
            throw new IllegalArgumentException("Chapter không tồn tại");
        }
        if ("COMMENT".equals(targetType)) {
            Integer commentExists = jdbcTemplate.queryForObject(
                    "SELECT COUNT(1) FROM chapter_comments WHERE id = ?",
                    Integer.class,
                    targetId
            );
            if (commentExists == null || commentExists <= 0) {
                throw new IllegalArgumentException("Bình luận không tồn tại");
            }
        }

        String normalizedReason = reason == null ? "" : reason.trim();
        if (normalizedReason.isEmpty()) {
            throw new IllegalArgumentException("Lý do báo cáo không được để trống");
        }

        Integer existingActive = jdbcTemplate.queryForObject(
                "SELECT COUNT(1) FROM content_reports WHERE target_type = ? AND target_id = ? AND user_id = ? AND status IN ('PENDING', 'FLAGGED')",
                Integer.class,
                targetType,
                targetId,
                userId
        );
        if (existingActive != null && existingActive > 0) {
            throw new IllegalArgumentException("Ban da bao cao noi dung nay roi");
        }

        jdbcTemplate.update(
                "INSERT INTO content_reports(user_id, target_type, target_id, reason) VALUES (?, ?, ?, ?)",
                userId, targetType, targetId, normalizedReason
        );

        Long reportId = jdbcTemplate.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
        if (reportId != null) {
            Integer activeCount = jdbcTemplate.queryForObject(
                    "SELECT COUNT(1) FROM content_reports WHERE target_type = ? AND target_id = ? AND status IN ('PENDING', 'FLAGGED')",
                    Integer.class,
                    targetType,
                    targetId
            );
            if (activeCount != null && activeCount >= AUTO_FLAG_THRESHOLD) {
                jdbcTemplate.update("UPDATE content_reports SET status = 'FLAGGED', auto_flagged = 1 WHERE id = ?", reportId);
            }
            jdbcTemplate.update(
                    "INSERT INTO report_audit_logs(report_scope, report_id, action, actor_user_id, note) VALUES ('CONTENT', ?, 'CREATED', ?, ?)",
                    reportId, userId, normalizedReason
            );
            // Do not notify the owner at content report creation; authors are notified
            // only when an admin resolves and hides the content.
        }
        return reportId;
    }

    public void createReportAppeal(Long userId, String reportScope, Long reportId, String message) {
        String normalizedScope = reportScope == null ? "CONTENT" : reportScope.trim().toUpperCase();
        if (!"CONTENT".equals(normalizedScope) && !"COMMENT".equals(normalizedScope)) {
            throw new IllegalArgumentException("Loại kháng nghị không hợp lệ");
        }

        String normalizedMessage = message == null ? "" : message.trim();
        if (normalizedMessage.isEmpty()) {
            throw new IllegalArgumentException("Nội dung kháng nghị không được để trống");
        }

        Integer activeAppeal = jdbcTemplate.queryForObject(
                "SELECT COUNT(1) FROM report_appeals WHERE report_scope = ? AND report_id = ? AND reporter_user_id = ? AND status = 'PENDING'",
                Integer.class,
                normalizedScope,
                reportId,
                userId
        );
        if (activeAppeal != null && activeAppeal > 0) {
            throw new IllegalArgumentException("Bạn đã gửi kháng nghị cho báo cáo này rồi");
        }

        // Load report and verify it's eligible for appeal and that the current user is the owner of the reported target
        String reportQuery;
        if ("CONTENT".equals(normalizedScope)) {
            reportQuery = "SELECT target_type, target_id, status FROM content_reports WHERE id = ?";
        } else {
            // comment_reports stores comment_id as the target reference
            reportQuery = "SELECT 'COMMENT' AS target_type, comment_id AS target_id, status FROM comment_reports WHERE id = ?";
        }

        java.util.Map<String, Object> reportRow;
        try {
            reportRow = jdbcTemplate.queryForMap(reportQuery, reportId);
        } catch (org.springframework.dao.EmptyResultDataAccessException ex) {
            throw new IllegalArgumentException("Không tìm thấy báo cáo phù hợp để kháng nghị");
        }

        String status = (String) reportRow.get("status");
        if (status == null || !("RESOLVED".equals(status) || "DISMISSED".equals(status) || "FLAGGED".equals(status))) {
            throw new IllegalArgumentException("Không tìm thấy báo cáo phù hợp để kháng nghị");
        }

        String targetType = (String) reportRow.get("target_type");
        Number targetIdNum = (Number) reportRow.get("target_id");
        if (targetIdNum == null) throw new IllegalArgumentException("Không tìm thấy báo cáo phù hợp để kháng nghị");
        Long targetId = targetIdNum.longValue();

        // Vấn đề 5: kiểm tra còn trong thời hạn 7 ngày kháng cáo
        if ("CONTENT".equals(normalizedScope)) {
            Integer expired = jdbcTemplate.queryForObject(
                    "SELECT COUNT(1) FROM content_reports WHERE id = ? AND reviewed_at IS NOT NULL AND DATE_ADD(reviewed_at, INTERVAL 7 DAY) <= NOW()",
                    Integer.class, reportId);
            if (expired != null && expired > 0) {
                throw new IllegalArgumentException("Đã hết thời hạn 7 ngày kháng nghị cho báo cáo này");
            }
        }

        // Vấn đề 2: kiểm tra nội dung còn tồn tại
        if ("COMIC".equals(targetType)) {
            Integer exists = jdbcTemplate.queryForObject(
                    "SELECT COUNT(1) FROM published_comics WHERE id = ?", Integer.class, targetId);
            if (exists == null || exists == 0) {
                throw new IllegalArgumentException("Nội dung đã bị xóa vĩnh viễn, không thể kháng nghị");
            }
        } else if ("CHAPTER".equals(targetType)) {
            Integer exists = jdbcTemplate.queryForObject(
                    "SELECT COUNT(1) FROM published_chapters WHERE id = ?", Integer.class, targetId);
            if (exists == null || exists == 0) {
                throw new IllegalArgumentException("Nội dung đã bị xóa vĩnh viễn, không thể kháng nghị");
            }
        }

        // Prevent the original reporter from filing an appeal for the same report
        Long originalReporterId = null;
        if ("CONTENT".equals(normalizedScope)) {
            originalReporterId = jdbcTemplate.queryForObject("SELECT user_id FROM content_reports WHERE id = ?", Long.class, reportId);
        } else {
            originalReporterId = jdbcTemplate.queryForObject("SELECT user_id FROM comment_reports WHERE id = ?", Long.class, reportId);
        }
        if (originalReporterId != null && originalReporterId.equals(userId)) {
            throw new IllegalArgumentException("Người đã gửi báo cáo không thể kháng nghị báo cáo này");
        }

        Long ownerUserId = null;
        if ("COMIC".equals(targetType)) {
            ownerUserId = jdbcTemplate.queryForObject("SELECT user_id FROM published_comics WHERE id = ?", Long.class, targetId);
        } else if ("CHAPTER".equals(targetType)) {
            ownerUserId = jdbcTemplate.queryForObject("SELECT pc.user_id FROM published_chapters ch JOIN published_comics pc ON pc.id = ch.comic_id WHERE ch.id = ?", Long.class, targetId);
        } else if ("COMMENT".equals(targetType)) {
            ownerUserId = jdbcTemplate.queryForObject("SELECT user_id FROM chapter_comments WHERE id = ?", Long.class, targetId);
        }

        if (ownerUserId == null || !ownerUserId.equals(userId)) {
            throw new IllegalArgumentException("Bạn không có quyền kháng nghị cho báo cáo này");
        }

        jdbcTemplate.update(
                "INSERT INTO report_appeals(report_scope, report_id, reporter_user_id, message) VALUES (?, ?, ?, ?)",
                normalizedScope, reportId, userId, normalizedMessage
        );
        try {
            java.util.List<Long> adminIds = jdbcTemplate.queryForList(
                "SELECT ur.user_id FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE r.code IN ('ROLE_ADMIN','ADMIN')",
                Long.class
            );
            for (Long adminId : adminIds) {
            notificationService.createNotification(
                adminId,
                "APPEAL",
                "Có kháng nghị mới",
                "Kháng nghị cho báo cáo #" + reportId + " đã được gửi.",
                reportId,
                "/admin/reports/" + reportId
            );
            }
        } catch (Exception ignored) {
        }
    }

    private boolean isPublishedComic(Long comicId) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(1) FROM published_comics WHERE id = ? AND status = 'PUBLISHED'",
                Integer.class,
                comicId
        );
        return count != null && count > 0;
    }

    private boolean isPublishedChapter(Long chapterId) {
        Integer count = jdbcTemplate.queryForObject("""
                        SELECT COUNT(1)
                        FROM published_chapters ch
                        JOIN published_comics pc ON pc.id = ch.comic_id
                        WHERE ch.id = ? AND pc.status = 'PUBLISHED'
                        """,
                Integer.class,
                chapterId
        );
        return count != null && count > 0;
    }

    private record AggregateRating(double averageRating, long totalRatings) {
    }
}
