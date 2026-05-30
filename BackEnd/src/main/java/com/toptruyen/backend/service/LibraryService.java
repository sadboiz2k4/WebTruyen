package com.toptruyen.backend.service;

import com.toptruyen.backend.dto.LibraryFollowItem;
import com.toptruyen.backend.dto.LibraryHistoryItem;
import com.toptruyen.backend.repository.UserRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
public class LibraryService {

    private final UserRepository userRepository;
    private final JdbcTemplate jdbcTemplate;
    private final NotificationService notificationService;

    public LibraryService(
            UserRepository userRepository,
            JdbcTemplate jdbcTemplate,
            NotificationService notificationService
    ) {
        this.userRepository = userRepository;
        this.jdbcTemplate = jdbcTemplate;
        this.notificationService = notificationService;
    }

    @PostConstruct
    public void initTable() {
        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS published_read_history (
                    id BIGINT AUTO_INCREMENT PRIMARY KEY,
                    user_id BIGINT NOT NULL,
                    comic_id BIGINT NOT NULL,
                    chapter_id BIGINT NOT NULL,
                    chapter_no INT,
                    chapter_title VARCHAR(500),
                    last_read_at DATETIME NOT NULL,
                    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE KEY uq_user_comic (user_id, comic_id)
                )
                """);
        jdbcTemplate.execute(
                "ALTER TABLE published_follows ADD COLUMN IF NOT EXISTS read_status VARCHAR(32) NOT NULL DEFAULT 'READING'"
        );
        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS author_follows (
                    id BIGINT AUTO_INCREMENT PRIMARY KEY,
                    follower_user_id BIGINT NOT NULL,
                    author_user_id BIGINT NOT NULL,
                    followed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE KEY uq_follower_author (follower_user_id, author_user_id)
                )
                """);
    }

    public boolean isFollowingAuthor(Long followerId, String authorName) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(1) FROM author_follows af JOIN users u ON u.id = af.author_user_id WHERE af.follower_user_id = ? AND u.display_name = ?",
                Integer.class, followerId, authorName
        );
        return count != null && count > 0;
    }

    public void followAuthor(Long followerId, String authorName) {
        Long authorId = jdbcTemplate.queryForObject(
                "SELECT id FROM users WHERE display_name = ? LIMIT 1",
                Long.class, authorName
        );
        if (authorId == null) throw new IllegalArgumentException("Không tìm thấy tác giả");
        if (authorId.equals(followerId)) throw new IllegalArgumentException("Bạn không thể tự theo dõi mình");
        int inserted = jdbcTemplate.update(
                "INSERT IGNORE INTO author_follows (follower_user_id, author_user_id) VALUES (?, ?)",
                followerId, authorId
        );
        if (inserted > 0) {
            String followerName = jdbcTemplate.queryForObject(
                    "SELECT display_name FROM users WHERE id = ? LIMIT 1",
                    String.class, followerId
            );
            notificationService.createNotification(
                    authorId, "FOLLOW_AUTHOR",
                    "Bạn có người theo dõi mới",
                    (followerName != null ? followerName : "Ai đó") + " đã bắt đầu theo dõi bạn",
                    followerId, null
            );
        }
    }

    public void unfollowAuthor(Long followerId, String authorName) {
        jdbcTemplate.update(
                "DELETE af FROM author_follows af JOIN users u ON u.id = af.author_user_id WHERE af.follower_user_id = ? AND u.display_name = ?",
                followerId, authorName
        );
    }

    public boolean isFollowing(Long userId, Long comicId) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(1) FROM published_follows WHERE user_id = ? AND comic_id = ?",
                Integer.class, userId, comicId
        );
        return count != null && count > 0;
    }

    public void followComic(Long userId, Long comicId) {
        Integer exists = jdbcTemplate.queryForObject(
                "SELECT COUNT(1) FROM published_comics WHERE id = ? AND status = 'PUBLISHED'",
                Integer.class, comicId
        );
        if (exists == null || exists == 0) {
            throw new IllegalArgumentException("Truyen khong ton tai");
        }
        int inserted = jdbcTemplate.update(
                "INSERT IGNORE INTO published_follows (user_id, comic_id, read_status) VALUES (?, ?, 'PLAN_TO_READ')",
                userId, comicId
        );
        if (inserted > 0) {
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                    "SELECT user_id AS author_id, slug, title FROM published_comics WHERE id = ?", comicId
            );
            if (!rows.isEmpty()) {
                Long authorId = ((Number) rows.get(0).get("author_id")).longValue();
                if (!authorId.equals(userId)) {
                    String slug = (String) rows.get(0).get("slug");
                    String comicTitle = (String) rows.get(0).get("title");
                    notificationService.createNotification(
                            authorId, "FOLLOW_COMIC",
                            "Có người mới theo dõi truyện của bạn",
                            "Truyện \"" + comicTitle + "\" vừa có người theo dõi mới",
                            comicId, "/chi-tiet-truyen/" + slug
                    );
                }
            }
        }
    }

    public void unfollowComic(Long userId, Long comicId) {
        jdbcTemplate.update(
                "DELETE FROM published_follows WHERE user_id = ? AND comic_id = ?",
                userId, comicId
        );
    }

    public List<LibraryFollowItem> getFollowedComics(Long userId) {
        return jdbcTemplate.query("""
                        SELECT pc.id AS comic_id, pc.slug, pc.title, pc.cover_url,
                               (SELECT MAX(chapter_no) FROM published_chapters
                                WHERE comic_id = pc.id AND published_at <= NOW()) AS latest_chapter_no,
                               DATE_FORMAT(pc.published_at, '%Y-%m-%d') AS published_at,
                               DATE_FORMAT(pf.created_at, '%Y-%m-%d %H:%i:%s') AS followed_at,
                               CASE
                                   WHEN NOT EXISTS (SELECT 1 FROM published_read_history
                                                    WHERE user_id = pf.user_id AND comic_id = pc.id)
                                   THEN 'PLAN_TO_READ'
                                   WHEN (SELECT chapter_no FROM published_read_history
                                         WHERE user_id = pf.user_id AND comic_id = pc.id) >=
                                        (SELECT MAX(chapter_no) FROM published_chapters
                                         WHERE comic_id = pc.id AND published_at <= NOW())
                                   THEN 'COMPLETED'
                                   ELSE 'READING'
                               END AS read_status
                        FROM published_follows pf
                        JOIN published_comics pc ON pc.id = pf.comic_id
                        WHERE pf.user_id = ?
                        ORDER BY pf.created_at DESC
                        """,
                (rs, rowNum) -> new LibraryFollowItem(
                        rs.getLong("comic_id"),
                        rs.getString("slug"),
                        rs.getString("title"),
                        rs.getString("cover_url"),
                        rs.getString("latest_chapter_no"),
                        rs.getString("published_at"),
                        rs.getString("followed_at"),
                        rs.getString("read_status")
                ),
                userId);
    }

    public void updateFollowStatus(Long userId, Long comicId, String status) {
        List<String> valid = java.util.List.of("READING", "COMPLETED", "PLAN_TO_READ");
        if (!valid.contains(status)) {
            throw new IllegalArgumentException("Trạng thái không hợp lệ");
        }
        int updated = jdbcTemplate.update(
                "UPDATE published_follows SET read_status = ? WHERE user_id = ? AND comic_id = ?",
                status, userId, comicId
        );
        if (updated == 0) {
            throw new IllegalArgumentException("Bạn chưa theo dõi truyện này");
        }
    }

    public void deleteHistoryItem(Long userId, Long comicId) {
        jdbcTemplate.update(
                "DELETE FROM published_read_history WHERE user_id = ? AND comic_id = ?",
                userId, comicId
        );
    }

    public void clearAllHistory(Long userId) {
        jdbcTemplate.update(
                "DELETE FROM published_read_history WHERE user_id = ?",
                userId
        );
    }

    public List<LibraryHistoryItem> getReadHistory(Long userId) {
        return jdbcTemplate.query("""
                        SELECT prh.comic_id, pc.slug, pc.title AS comic_title,
                               prh.chapter_id, prh.chapter_no, prh.chapter_title,
                               DATE_FORMAT(prh.last_read_at, '%Y-%m-%d %H:%i:%s') AS last_read_at
                        FROM published_read_history prh
                        JOIN published_comics pc ON pc.id = prh.comic_id
                        WHERE prh.user_id = ?
                        ORDER BY prh.last_read_at DESC
                        """,
                (rs, rowNum) -> new LibraryHistoryItem(
                        rs.getLong("comic_id"),
                        rs.getString("slug"),
                        rs.getString("comic_title"),
                        rs.getLong("chapter_id"),
                        rs.getInt("chapter_no"),
                        rs.getString("chapter_title"),
                        rs.getString("last_read_at")
                ),
                userId
        );
    }

    @Transactional
    public void markChapterRead(Long userId, Long chapterId) {
        if (userId == null || !userRepository.existsById(userId)) {
            throw new IllegalArgumentException("User not found");
        }

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "SELECT chapter_no, title, comic_id FROM published_chapters WHERE id = ?",
                chapterId
        );
        if (rows.isEmpty()) {
            throw new IllegalArgumentException("Chapter not found");
        }

        Map<String, Object> ch = rows.get(0);
        Long comicId = ((Number) ch.get("comic_id")).longValue();
        Integer chapterNo = ch.get("chapter_no") != null ? ((Number) ch.get("chapter_no")).intValue() : null;
        String chapterTitle = (String) ch.get("title");

        jdbcTemplate.update("""
                INSERT INTO published_read_history
                    (user_id, comic_id, chapter_id, chapter_no, chapter_title, last_read_at, created_at)
                VALUES (?, ?, ?, ?, ?, NOW(), NOW())
                ON DUPLICATE KEY UPDATE
                    chapter_id = VALUES(chapter_id),
                    chapter_no = VALUES(chapter_no),
                    chapter_title = VALUES(chapter_title),
                    last_read_at = NOW()
                """,
                userId, comicId, chapterId, chapterNo, chapterTitle
        );
    }
}
