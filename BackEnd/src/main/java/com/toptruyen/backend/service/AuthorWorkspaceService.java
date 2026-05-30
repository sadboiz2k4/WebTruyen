package com.toptruyen.backend.service;

import com.toptruyen.backend.dto.AuthorComicItem;
import com.toptruyen.backend.dto.AuthorDraftChapterItem;
import com.toptruyen.backend.dto.AuthorDraftPageItem;
import com.toptruyen.backend.dto.AuthorDraftRequest;
import com.toptruyen.backend.dto.AuthorDraftResponse;
import com.toptruyen.backend.dto.DeletePublishedChapterResponse;
import com.toptruyen.backend.dto.PublishComicResponse;
import jakarta.annotation.PostConstruct;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;

@Service
public class AuthorWorkspaceService {

    private final JdbcTemplate jdbcTemplate;
    private final NotificationService notificationService;

    public AuthorWorkspaceService(JdbcTemplate jdbcTemplate, NotificationService notificationService) {
        this.jdbcTemplate = jdbcTemplate;
        this.notificationService = notificationService;
    }

    @PostConstruct
    public void ensureTables() {
        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS author_drafts (
                    id BIGINT AUTO_INCREMENT PRIMARY KEY,
                    user_id BIGINT NOT NULL,
                    mode VARCHAR(20) NOT NULL,
                    title VARCHAR(255) NOT NULL,
                    slug VARCHAR(255) NOT NULL,
                    description TEXT NULL,
                    cover_url TEXT NULL,
                    font_family VARCHAR(120) NULL,
                    font_size INT NULL,
                    text_color VARCHAR(32) NULL,
                    background_color VARCHAR(32) NULL,
                    content LONGTEXT NULL,
                    chapter_title VARCHAR(255) NULL,
                    target_chapter_id BIGINT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    UNIQUE KEY uk_author_drafts_user_mode (user_id, mode)
                )
                """);

        jdbcTemplate.execute("ALTER TABLE author_drafts ADD COLUMN IF NOT EXISTS target_chapter_id BIGINT NULL");
        jdbcTemplate.execute("ALTER TABLE author_drafts ADD COLUMN IF NOT EXISTS chapter_price BIGINT NOT NULL DEFAULT 0");
        jdbcTemplate.execute("ALTER TABLE author_draft_chapters ADD COLUMN IF NOT EXISTS content LONGTEXT NULL");
        jdbcTemplate.execute("ALTER TABLE author_draft_chapters ADD COLUMN IF NOT EXISTS chapter_price BIGINT NOT NULL DEFAULT 0");
        jdbcTemplate.execute("ALTER TABLE author_draft_chapters ADD COLUMN IF NOT EXISTS target_chapter_id BIGINT NULL");
        jdbcTemplate.execute("ALTER TABLE author_draft_pages ADD COLUMN IF NOT EXISTS draft_chapter_id BIGINT NULL");
        jdbcTemplate.execute("ALTER TABLE published_comics ADD COLUMN IF NOT EXISTS story_status VARCHAR(32) NULL DEFAULT 'ONGOING'");
        jdbcTemplate.execute("ALTER TABLE published_comics ADD COLUMN IF NOT EXISTS categories VARCHAR(500) NULL");
        jdbcTemplate.execute("ALTER TABLE published_chapters ADD COLUMN IF NOT EXISTS view_count BIGINT NOT NULL DEFAULT 0");
        jdbcTemplate.execute("ALTER TABLE published_chapters ADD COLUMN IF NOT EXISTS price BIGINT NOT NULL DEFAULT 0");

        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS chapter_unlocks (
                    id BIGINT AUTO_INCREMENT PRIMARY KEY,
                    user_id BIGINT NOT NULL,
                    chapter_id BIGINT NOT NULL,
                    unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE KEY uk_chapter_unlocks (user_id, chapter_id),
                    INDEX (chapter_id)
                )
                """);

        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS author_draft_chapters (
                    id BIGINT AUTO_INCREMENT PRIMARY KEY,
                    draft_id BIGINT NOT NULL,
                    title VARCHAR(255) NOT NULL,
                    status VARCHAR(64) NOT NULL,
                    pages INT NULL,
                    sort_order INT NOT NULL DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    CONSTRAINT fk_author_draft_chapters_draft
                        FOREIGN KEY (draft_id) REFERENCES author_drafts(id)
                        ON DELETE CASCADE
                )
                """);

        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS author_draft_pages (
                    id BIGINT AUTO_INCREMENT PRIMARY KEY,
                    draft_id BIGINT NOT NULL,
                    file_name VARCHAR(255) NULL,
                    image_url TEXT NOT NULL,
                    sort_order INT NOT NULL DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    CONSTRAINT fk_author_draft_pages_draft
                        FOREIGN KEY (draft_id) REFERENCES author_drafts(id)
                        ON DELETE CASCADE
                )
                """);

        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS published_comics (
                    id BIGINT AUTO_INCREMENT PRIMARY KEY,
                    user_id BIGINT NOT NULL,
                    mode VARCHAR(20) NOT NULL,
                    slug VARCHAR(255) NOT NULL,
                    title VARCHAR(255) NOT NULL,
                    description TEXT NULL,
                    cover_url TEXT NULL,
                    status VARCHAR(32) NOT NULL DEFAULT 'PUBLISHED',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE KEY uk_published_comics_slug (slug)
                )
                """);

        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS published_chapters (
                    id BIGINT AUTO_INCREMENT PRIMARY KEY,
                    comic_id BIGINT NOT NULL,
                    chapter_no INT NOT NULL,
                    title VARCHAR(255) NOT NULL,
                    content LONGTEXT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    CONSTRAINT fk_published_chapters_comic
                        FOREIGN KEY (comic_id) REFERENCES published_comics(id)
                        ON DELETE CASCADE,
                    UNIQUE KEY uk_published_chapter_no (comic_id, chapter_no)
                )
                """);

        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS published_chapter_pages (
                    id BIGINT AUTO_INCREMENT PRIMARY KEY,
                    chapter_id BIGINT NOT NULL,
                    image_url TEXT NOT NULL,
                    file_name VARCHAR(255) NULL,
                    sort_order INT NOT NULL DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    CONSTRAINT fk_published_pages_chapter
                        FOREIGN KEY (chapter_id) REFERENCES published_chapters(id)
                        ON DELETE CASCADE
                )
                """);
    }

    @Transactional
    public AuthorDraftResponse getDraft(Long userId, String mode) {
        validateMode(mode);

        DraftRow draft = findDraft(userId, mode);
        if (draft == null) {
            draft = createDefaultDraft(userId, mode);
        }

        return toResponse(draft);
    }

    @Transactional
    public AuthorDraftResponse saveDraft(Long userId, String mode, AuthorDraftRequest request) {
        validateMode(mode);

        DraftRow draft = findDraft(userId, mode);
        if (draft == null) {
            draft = createDefaultDraft(userId, mode);
        }

        jdbcTemplate.update("""
                        UPDATE author_drafts
                        SET title = ?, slug = ?, description = ?, cover_url = ?,
                            font_family = ?, font_size = ?, text_color = ?, background_color = ?,
                            content = ?, chapter_title = ?, target_chapter_id = ?, chapter_price = ?,
                            updated_at = CURRENT_TIMESTAMP
                        WHERE id = ?
                        """,
                normalizeTitle(request.title(), mode),
                normalizeSlug(request.slug(), mode),
                request.description(),
                request.coverUrl(),
                request.fontFamily(),
                request.fontSize(),
                request.color(),
                request.background(),
                request.content(),
                request.chapterTitle(),
                request.targetChapterId(),
                request.chapterPrice() != null ? request.chapterPrice() : 0L,
                draft.id()
        );

        syncWorkspacePages(draft.id(), request.pages());

        DraftRow updatedDraft = findDraftById(draft.id());
        if (updatedDraft == null) {
            throw new IllegalStateException("Khong the tai draft sau khi luu");
        }

        return toResponse(updatedDraft);
    }

    @Transactional
    public AuthorDraftResponse commitChapterDraft(Long userId, String mode) {
        validateMode(mode);

        DraftRow draft = findDraft(userId, mode);
        if (draft == null) {
            throw new IllegalArgumentException("Chua co ban nhap");
        }

        List<AuthorDraftChapterItem> existing = getChapters(draft.id());
        String chapterTitle = (draft.chapterTitle() == null || draft.chapterTitle().isBlank())
                ? defaultChapterTitle(mode, existing.size())
                : draft.chapterTitle();

        int sortOrder = Objects.requireNonNullElse(
                jdbcTemplate.queryForObject(
                        "SELECT COALESCE(MAX(sort_order), -1) + 1 FROM author_draft_chapters WHERE draft_id = ?",
                        Integer.class, draft.id()
                ), 0
        );

        int workspacePageCount = Objects.requireNonNullElse(
                jdbcTemplate.queryForObject(
                        "SELECT COUNT(*) FROM author_draft_pages WHERE draft_id = ? AND draft_chapter_id IS NULL",
                        Integer.class, draft.id()
                ), 0
        );

        jdbcTemplate.update("""
                        INSERT INTO author_draft_chapters(draft_id, title, status, pages, sort_order, content, chapter_price, target_chapter_id)
                        VALUES (?, ?, 'Nháp', ?, ?, ?, ?, ?)
                        """,
                draft.id(), chapterTitle, workspacePageCount, sortOrder,
                draft.content(),
                draft.chapterPrice() != null ? draft.chapterPrice() : 0L,
                draft.targetChapterId()
        );

        Long newChapterId = jdbcTemplate.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
        if (newChapterId == null || newChapterId == 0) {
            throw new IllegalStateException("Khong the tao chapter draft");
        }

        jdbcTemplate.update(
                "UPDATE author_draft_pages SET draft_chapter_id = ? WHERE draft_id = ? AND draft_chapter_id IS NULL",
                newChapterId, draft.id()
        );

        jdbcTemplate.update(
                "UPDATE author_drafts SET chapter_title = '', content = NULL, target_chapter_id = NULL, chapter_price = 0 WHERE id = ?",
                draft.id()
        );

        return toResponse(findDraftById(draft.id()));
    }

    @Transactional
    public AuthorDraftResponse deleteDraftChapterById(Long userId, String mode, Long draftChapterId) {
        validateMode(mode);

        DraftRow draft = findDraft(userId, mode);
        if (draft == null) {
            throw new IllegalArgumentException("Chua co ban nhap");
        }

        jdbcTemplate.update("DELETE FROM author_draft_pages WHERE draft_chapter_id = ?", draftChapterId);

        int deleted = jdbcTemplate.update(
                "DELETE FROM author_draft_chapters WHERE id = ? AND draft_id = ?",
                draftChapterId, draft.id()
        );
        if (deleted == 0) {
            throw new IllegalArgumentException("Chapter nháp không tồn tại hoặc không có quyền xóa");
        }

        return toResponse(findDraftById(draft.id()));
    }

    @Transactional
    public PublishComicResponse publishDraftChapterById(Long userId, String mode, Long draftChapterId, String scheduledAt) {
        validateMode(mode);

        DraftRow draft = findDraft(userId, mode);
        if (draft == null) {
            throw new IllegalArgumentException("Chua co ban nhap");
        }

        List<java.util.Map<String, Object>> rows = jdbcTemplate.queryForList("""
                SELECT title, content, COALESCE(chapter_price, 0) AS chapter_price, target_chapter_id
                FROM author_draft_chapters WHERE id = ? AND draft_id = ?
                """, draftChapterId, draft.id());

        if (rows.isEmpty()) {
            throw new IllegalArgumentException("Chapter nháp không tồn tại");
        }

        java.util.Map<String, Object> row = rows.get(0);
        String chTitle = (String) row.get("title");
        String chContent = (String) row.get("content");
        long chPrice = ((Number) row.get("chapter_price")).longValue();
        Long chTargetId = row.get("target_chapter_id") != null ? ((Number) row.get("target_chapter_id")).longValue() : null;
        List<AuthorDraftPageItem> chPages = getDraftChapterPages(draftChapterId);

        PublishComicResponse result = doPublish(userId, mode, draft, chTitle, chContent, chPrice, chTargetId, chPages, scheduledAt);

        jdbcTemplate.update("DELETE FROM author_draft_pages WHERE draft_chapter_id = ?", draftChapterId);
        jdbcTemplate.update("DELETE FROM author_draft_chapters WHERE id = ?", draftChapterId);

        return result;
    }

    @Transactional
    public PublishComicResponse publishDraft(Long userId, String mode, String scheduledAt) {
        validateMode(mode);

        DraftRow draft = findDraft(userId, mode);
        if (draft == null) {
            throw new IllegalArgumentException("Chua co du lieu ban nhap de dang");
        }

        return doPublish(userId, mode, draft,
                draft.chapterTitle(), draft.content(),
                draft.chapterPrice() != null ? draft.chapterPrice() : 0L,
                draft.targetChapterId(), getDraftPages(draft.id()), scheduledAt);
    }

    @Transactional
    private PublishComicResponse doPublish(Long userId, String mode, DraftRow draft,
            String reqChapterTitle, String reqContent, long reqChapterPrice,
            Long reqTargetChapterId, List<AuthorDraftPageItem> reqPages, String scheduledAt) {

        String slug = (draft.slug() == null || draft.slug().isBlank()) ? defaultSlug(mode) : draft.slug();
        String title = (draft.title() == null || draft.title().isBlank()) ? defaultTitle(mode) : draft.title();
        Long targetChapterId = reqTargetChapterId;

        Long comicId = findPublishedComicIdBySlug(slug);
        boolean isNewComic = (comicId == null);
        if (comicId == null) {
            jdbcTemplate.update("""
                            INSERT INTO published_comics(user_id, mode, slug, title, description, cover_url, status, published_at)
                            VALUES (?, ?, ?, ?, ?, ?, 'PUBLISHED', CURRENT_TIMESTAMP)
                            """,
                    userId,
                    mode,
                    slug,
                    title,
                    draft.description(),
                    draft.coverUrl()
            );
            comicId = findPublishedComicIdBySlug(slug);
        } else {
            jdbcTemplate.update("""
                            UPDATE published_comics
                            SET title = ?, description = ?, cover_url = ?, status = 'PUBLISHED',
                                updated_at = CURRENT_TIMESTAMP, published_at = CURRENT_TIMESTAMP
                            WHERE id = ?
                            """,
                    title,
                    draft.description(),
                    draft.coverUrl(),
                    comicId
            );
        }

        if (comicId == null) {
            throw new IllegalStateException("Khong the tao comic publish");
        }

        PublishedChapterRow targetChapter = null;
        int chapterNo;
        String chapterTitle;

        if (targetChapterId != null) {
            targetChapter = findPublishedChapterById(targetChapterId);
            if (targetChapter == null) {
                throw new IllegalArgumentException("Chapter can cap nhat khong ton tai");
            }
            if (!Objects.equals(targetChapter.comicId(), comicId)) {
                throw new IllegalArgumentException("Chapter can cap nhat khong thuoc truyen nay");
            }

            chapterNo = targetChapter.chapterNo();
            chapterTitle = (reqChapterTitle == null || reqChapterTitle.isBlank())
                    ? targetChapter.title()
                    : reqChapterTitle;
        } else {
            chapterNo = Objects.requireNonNullElse(
                jdbcTemplate.queryForObject(
                    "SELECT COALESCE(MAX(chapter_no), 0) + 1 FROM published_chapters WHERE comic_id = ?",
                    Integer.class,
                    comicId
                ),
                1
            );

            chapterTitle = (reqChapterTitle == null || reqChapterTitle.isBlank())
                    ? defaultChapterTitle(mode, chapterNo - 1)
                    : reqChapterTitle;
        }

        if ("comic".equals(mode) && targetChapter == null) {
            if (reqPages.isEmpty()) {
                throw new IllegalArgumentException("Truyen anh can it nhat 1 trang truoc khi dang");
            }
        }

        Long chapterId;

        Timestamp scheduledTs = parseScheduledAt(scheduledAt);

        if (targetChapter != null) {
            if (scheduledTs != null) {
                jdbcTemplate.update("""
                                UPDATE published_chapters
                                SET title = ?, content = ?, price = ?, published_at = ?
                                WHERE id = ?
                                """,
                        chapterTitle, reqContent, reqChapterPrice, scheduledTs, targetChapter.id()
                );
            } else {
                jdbcTemplate.update("""
                                UPDATE published_chapters
                                SET title = ?, content = ?, price = ?, published_at = CURRENT_TIMESTAMP
                                WHERE id = ?
                                """,
                        chapterTitle, reqContent, reqChapterPrice, targetChapter.id()
                );
            }
            chapterId = targetChapter.id();
            if ("comic".equals(mode) && !reqPages.isEmpty()) {
                replacePublishedChapterPages(chapterId, reqPages);
            }
        } else {
            if (scheduledTs != null) {
                jdbcTemplate.update("""
                                INSERT INTO published_chapters(comic_id, chapter_no, title, content, price, published_at)
                                VALUES (?, ?, ?, ?, ?, ?)
                                """,
                        comicId, chapterNo, chapterTitle, reqContent, reqChapterPrice, scheduledTs
                );
            } else {
                jdbcTemplate.update("""
                                INSERT INTO published_chapters(comic_id, chapter_no, title, content, price, published_at)
                                VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                                """,
                        comicId, chapterNo, chapterTitle, reqContent, reqChapterPrice
                );
            }

            chapterId = Objects.requireNonNullElse(
                jdbcTemplate.queryForObject(
                    "SELECT id FROM published_chapters WHERE comic_id = ? AND chapter_no = ? LIMIT 1",
                    Long.class,
                    comicId,
                    chapterNo
                ),
                0L
            );

            if (chapterId <= 0) {
                throw new IllegalStateException("Khong the tao chapter publish");
            }

            if ("comic".equals(mode)) {
                replacePublishedChapterPages(chapterId, reqPages);
            }

            if (isNewComic) {
                try {
                    List<Long> authorFollowerIds = jdbcTemplate.queryForList(
                        "SELECT follower_user_id FROM author_follows WHERE author_user_id = ?",
                        Long.class, userId
                    );
                    for (Long followerId : authorFollowerIds) {
                        try {
                            notificationService.createNotification(
                                followerId, "NEW_COMIC",
                                "Tác phẩm mới từ tác giả bạn theo dõi",
                                "\"" + title + "\" vừa được xuất bản",
                                comicId, "/chi-tiet-truyen/" + slug
                            );
                        } catch (Exception ignored) {}
                    }
                } catch (Exception ignored) {}
            } else {
                try {
                    List<Long> comicFollowerIds = jdbcTemplate.queryForList(
                        "SELECT user_id FROM published_follows WHERE comic_id = ?",
                        Long.class, comicId
                    );
                    for (Long followerId : comicFollowerIds) {
                        try {
                            notificationService.createNotification(
                                followerId, "NEW_CHAPTER",
                                "Chương mới: " + chapterTitle,
                                title + " vừa ra Chương " + chapterNo,
                                chapterId, "/doc-truyen/" + slug + "/" + chapterId
                            );
                        } catch (Exception ignored) {}
                    }
                } catch (Exception ignored) {}
            }
        }

        return new PublishComicResponse(
                true,
                "Dang truyen thanh cong",
                comicId,
                chapterId,
                chapterNo,
                slug,
                chapterTitle
        );
    }

    public List<AuthorComicItem> getMyComics(Long userId) {
        return jdbcTemplate.query("""
                        SELECT pc.id, pc.slug, pc.title, pc.cover_url, pc.mode, pc.published_at, pc.story_status, pc.description,
                               pc.categories,
                               (SELECT COUNT(*) FROM published_chapters ch WHERE ch.comic_id = pc.id) AS chapter_count
                        FROM published_comics pc
                        WHERE pc.user_id = ? AND pc.status = 'PUBLISHED'
                        ORDER BY pc.published_at DESC
                        """,
                (rs, rowNum) -> new AuthorComicItem(
                        rs.getLong("id"),
                        rs.getString("slug"),
                        rs.getString("title"),
                        rs.getString("cover_url"),
                        rs.getString("mode"),
                        rs.getInt("chapter_count"),
                        rs.getString("published_at"),
                        rs.getString("story_status"),
                        rs.getString("description"),
                        rs.getString("categories")
                ),
                userId
        );
    }

    public void updateStoryInfo(Long userId, String slug, String title, String coverUrl, String description, String categories) {
        int updated = jdbcTemplate.update(
                "UPDATE published_comics SET title = ?, cover_url = ?, description = ?, categories = ?, updated_at = CURRENT_TIMESTAMP WHERE slug = ? AND user_id = ?",
                title, coverUrl, description, categories, slug, userId
        );
        if (updated == 0) {
            throw new IllegalArgumentException("Truyen khong ton tai hoac khong co quyen cap nhat");
        }
    }

    public java.util.Map<String, Object> getStoryStats(Long userId, String slug) {
        List<Long> comicIds = jdbcTemplate.query(
                "SELECT id FROM published_comics WHERE slug = ? AND user_id = ? LIMIT 1",
                (rs, rowNum) -> rs.getLong("id"), slug, userId
        );
        if (comicIds.isEmpty()) throw new IllegalArgumentException("Truyen khong ton tai");
        Long comicId = comicIds.get(0);
        Long totalViews = jdbcTemplate.queryForObject(
                "SELECT COALESCE(SUM(view_count), 0) FROM published_chapters WHERE comic_id = ?",
                Long.class, comicId
        );
        Integer totalChapters = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM published_chapters WHERE comic_id = ?",
                Integer.class, comicId
        );
        Long totalRatings = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM comic_ratings WHERE comic_id = ?",
                Long.class, comicId
        );
        Double averageRating = jdbcTemplate.queryForObject(
                "SELECT COALESCE(AVG(rating), 0.0) FROM comic_ratings WHERE comic_id = ?",
                Double.class, comicId
        );
        Long totalComments = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM chapter_comments cc JOIN published_chapters pc ON cc.chapter_id = pc.id WHERE pc.comic_id = ?",
                Long.class, comicId
        );
        return java.util.Map.of(
            "totalViews", totalViews == null ? 0L : totalViews,
            "totalChapters", totalChapters == null ? 0 : totalChapters,
            "totalRatings", totalRatings == null ? 0L : totalRatings,
            "averageRating", averageRating == null ? 0.0 : averageRating,
            "totalComments", totalComments == null ? 0L : totalComments
        );
    }

    public List<java.util.Map<String, Object>> getStoryComments(Long userId, String slug) {
        List<Long> comicIds = jdbcTemplate.query(
                "SELECT id FROM published_comics WHERE slug = ? AND user_id = ? LIMIT 1",
                (rs, rowNum) -> rs.getLong("id"), slug, userId
        );
        if (comicIds.isEmpty()) throw new IllegalArgumentException("Truyen khong ton tai hoac khong co quyen");
        Long comicId = comicIds.get(0);
        return jdbcTemplate.query("""
                SELECT cc.id, cc.content,
                       DATE_FORMAT(cc.created_at, '%Y-%m-%d %H:%i') AS created_at,
                       u.display_name AS user_name,
                       pc.chapter_no, pc.title AS chapter_title
                FROM chapter_comments cc
                JOIN published_chapters pc ON cc.chapter_id = pc.id
                JOIN users u ON cc.user_id = u.id
                WHERE pc.comic_id = ?
                ORDER BY cc.created_at DESC
                LIMIT 200
                """,
                (rs, rowNum) -> {
                    java.util.Map<String, Object> row = new java.util.LinkedHashMap<>();
                    row.put("id", rs.getLong("id"));
                    row.put("content", rs.getString("content"));
                    row.put("createdAt", rs.getString("created_at"));
                    row.put("userName", rs.getString("user_name"));
                    row.put("chapterNo", rs.getInt("chapter_no"));
                    row.put("chapterTitle", rs.getString("chapter_title"));
                    return row;
                },
                comicId
        );
    }

    public void deleteCommentAsAuthor(Long userId, Long commentId) {
        List<Long> verify = jdbcTemplate.query("""
                SELECT cc.id FROM chapter_comments cc
                JOIN published_chapters pc ON cc.chapter_id = pc.id
                JOIN published_comics pco ON pc.comic_id = pco.id
                WHERE cc.id = ? AND pco.user_id = ?
                LIMIT 1
                """,
                (rs, rowNum) -> rs.getLong("id"),
                commentId, userId
        );
        if (verify.isEmpty()) {
            throw new IllegalArgumentException("Bình luận không tồn tại hoặc không có quyền xóa");
        }
        jdbcTemplate.update("DELETE FROM chapter_comments WHERE id = ?", commentId);
    }

    @Transactional
    public void swapChapterOrder(Long userId, Long chapterId1, Long chapterId2) {
        String verifyQuery = """
                SELECT ch.id, ch.chapter_no FROM published_chapters ch
                JOIN published_comics pc ON ch.comic_id = pc.id
                WHERE ch.id IN (?, ?) AND pc.user_id = ?
                """;
        List<long[]> rows = jdbcTemplate.query(verifyQuery,
                (rs, rowNum) -> new long[]{ rs.getLong("id"), rs.getLong("chapter_no") },
                chapterId1, chapterId2, userId);
        if (rows.size() != 2) throw new IllegalArgumentException("Chapter khong ton tai hoac khong co quyen");
        long no1 = rows.get(0)[0] == chapterId1 ? rows.get(0)[1] : rows.get(1)[1];
        long no2 = rows.get(0)[0] == chapterId2 ? rows.get(0)[1] : rows.get(1)[1];
        jdbcTemplate.update("UPDATE published_chapters SET chapter_no = -1 WHERE id = ?", chapterId1);
        jdbcTemplate.update("UPDATE published_chapters SET chapter_no = ? WHERE id = ?", no1, chapterId2);
        jdbcTemplate.update("UPDATE published_chapters SET chapter_no = ? WHERE id = ?", no2, chapterId1);
    }

    @Transactional
    public void deleteStory(Long userId, String slug) {
        List<Long> ids = jdbcTemplate.query(
                "SELECT id FROM published_comics WHERE slug = ? AND user_id = ? LIMIT 1",
                (rs, rowNum) -> rs.getLong("id"),
                slug, userId
        );
        if (ids.isEmpty()) {
            throw new IllegalArgumentException("Truyen khong ton tai hoac khong co quyen xoa");
        }
        jdbcTemplate.update("DELETE FROM published_comics WHERE slug = ? AND user_id = ?", slug, userId);
    }

    public void updateStoryStatus(Long userId, String slug, String storyStatus) {
        int updated = jdbcTemplate.update(
                "UPDATE published_comics SET story_status = ?, updated_at = CURRENT_TIMESTAMP WHERE slug = ? AND user_id = ?",
                storyStatus, slug, userId
        );
        if (updated == 0) {
            throw new IllegalArgumentException("Truyen khong ton tai hoac khong co quyen cap nhat");
        }
    }

    @Transactional
    public DeletePublishedChapterResponse deletePublishedChapter(Long userId, Long chapterId) {
        if (chapterId == null || chapterId <= 0) {
            throw new IllegalArgumentException("Chapter khong hop le");
        }

        PublishedChapterDetailRow chapter = findPublishedChapterDetailByIdAndUser(userId, chapterId);
        if (chapter == null) {
            throw new IllegalArgumentException("Chapter khong ton tai hoac khong co quyen xoa");
        }

        jdbcTemplate.update("DELETE FROM published_chapters WHERE id = ?", chapterId);
        jdbcTemplate.update(
                "UPDATE author_drafts SET target_chapter_id = NULL WHERE user_id = ? AND target_chapter_id = ?",
                userId,
                chapterId
        );

        return new DeletePublishedChapterResponse(
                true,
                "Da xoa chapter thanh cong",
                chapter.comicId(),
                chapter.id(),
                chapter.chapterNo(),
                chapter.comicSlug(),
                chapter.title()
        );
    }

    public java.util.Map<String, Object> getRevenue(Long userId, String slug) {
        List<Long> comicIds = jdbcTemplate.query(
                "SELECT id FROM published_comics WHERE slug = ? AND user_id = ? LIMIT 1",
                (rs, rowNum) -> rs.getLong("id"), slug, userId
        );
        if (comicIds.isEmpty()) throw new IllegalArgumentException("Truyen khong ton tai");
        Long comicId = comicIds.get(0);

        List<java.util.Map<String, Object>> items = jdbcTemplate.query("""
                SELECT ch.id AS chapter_id, ch.chapter_no, ch.title AS chapter_title,
                       COUNT(wt.id) AS unlock_count,
                       COALESCE(SUM(wt.amount), 0) AS chapter_revenue
                FROM published_chapters ch
                LEFT JOIN wallet_transactions wt
                    ON wt.user_id = ? AND wt.reason = CONCAT('Thu nhập chapter #', ch.id)
                WHERE ch.comic_id = ?
                GROUP BY ch.id, ch.chapter_no, ch.title
                ORDER BY chapter_revenue DESC, ch.chapter_no ASC
                """,
                (rs, rowNum) -> {
                    java.util.Map<String, Object> row = new java.util.LinkedHashMap<>();
                    row.put("chapterId", rs.getLong("chapter_id"));
                    row.put("chapterNo", rs.getInt("chapter_no"));
                    row.put("chapterTitle", rs.getString("chapter_title"));
                    row.put("unlockCount", rs.getLong("unlock_count"));
                    row.put("chapterRevenue", rs.getLong("chapter_revenue"));
                    return row;
                },
                userId, comicId
        );

        long totalRevenue = items.stream()
                .mapToLong(item -> ((Number) item.get("chapterRevenue")).longValue())
                .sum();

        java.util.Map<String, Object> result = new java.util.LinkedHashMap<>();
        result.put("totalRevenue", totalRevenue);
        result.put("items", items);
        return result;
    }

    public java.util.Map<String, Object> getAllRevenue(Long userId) {
        // Query actual earnings from wallet_transactions (70% of chapter price per unlock)
        List<java.util.Map<String, Object>> rows = jdbcTemplate.query("""
                SELECT
                    COALESCE(pc.id, 0)          AS comic_id,
                    COALESCE(pc.slug, '')        AS slug,
                    COALESCE(pc.title, 'Truyện đã xóa') AS comic_title,
                    COALESCE(ch.id, 0)           AS chapter_id,
                    COALESCE(ch.chapter_no, 0)   AS chapter_no,
                    COALESCE(ch.title, 'Chapter đã xóa') AS chapter_title,
                    COUNT(wt.id)                 AS unlock_count,
                    SUM(wt.amount)               AS chapter_revenue
                FROM wallet_transactions wt
                LEFT JOIN published_chapters ch
                    ON ch.id = CAST(REPLACE(wt.reason, 'Thu nhập chapter #', '') AS UNSIGNED)
                LEFT JOIN published_comics pc ON pc.id = ch.comic_id
                WHERE wt.user_id = ? AND wt.reason LIKE 'Thu nhập chapter #%'
                GROUP BY pc.id, pc.slug, pc.title, ch.id, ch.chapter_no, ch.title
                ORDER BY pc.id ASC, ch.chapter_no ASC
                """,
                (rs, rowNum) -> {
                    java.util.Map<String, Object> row = new java.util.LinkedHashMap<>();
                    row.put("comicId", rs.getLong("comic_id"));
                    row.put("slug", rs.getString("slug"));
                    row.put("comicTitle", rs.getString("comic_title"));
                    row.put("chapterId", rs.getLong("chapter_id"));
                    row.put("chapterNo", rs.getInt("chapter_no"));
                    row.put("chapterTitle", rs.getString("chapter_title"));
                    row.put("unlockCount", rs.getLong("unlock_count"));
                    row.put("chapterRevenue", rs.getLong("chapter_revenue"));
                    return row;
                },
                userId
        );

        // Group by comic
        java.util.LinkedHashMap<Long, java.util.Map<String, Object>> comicMap = new java.util.LinkedHashMap<>();
        for (java.util.Map<String, Object> row : rows) {
            Long comicId = ((Number) row.get("comicId")).longValue();
            comicMap.computeIfAbsent(comicId, id -> {
                java.util.Map<String, Object> comic = new java.util.LinkedHashMap<>();
                comic.put("comicId", id);
                comic.put("slug", row.get("slug"));
                comic.put("comicTitle", row.get("comicTitle"));
                comic.put("comicRevenue", 0L);
                comic.put("chapters", new java.util.ArrayList<>());
                return comic;
            });
            java.util.Map<String, Object> comic = comicMap.get(comicId);

            java.util.Map<String, Object> chapter = new java.util.LinkedHashMap<>();
            chapter.put("chapterId", row.get("chapterId"));
            chapter.put("chapterNo", row.get("chapterNo"));
            chapter.put("chapterTitle", row.get("chapterTitle"));
            chapter.put("unlockCount", row.get("unlockCount"));
            chapter.put("chapterRevenue", row.get("chapterRevenue"));

            @SuppressWarnings("unchecked")
            java.util.List<Object> chapters = (java.util.List<Object>) comic.get("chapters");
            chapters.add(chapter);

            long chapterRevenue = ((Number) row.get("chapterRevenue")).longValue();
            comic.put("comicRevenue", ((Number) comic.get("comicRevenue")).longValue() + chapterRevenue);
        }

        long totalRevenue = comicMap.values().stream()
                .mapToLong(c -> ((Number) c.get("comicRevenue")).longValue())
                .sum();

        java.util.List<java.util.Map<String, Object>> comicList = comicMap.values().stream()
                .filter(c -> ((Number) c.get("comicId")).longValue() != 0)
                .collect(java.util.stream.Collectors.toList());

        java.util.Map<String, Object> result = new java.util.LinkedHashMap<>();
        result.put("totalRevenue", totalRevenue);
        result.put("comics", comicList);
        return result;
    }

    public java.util.List<java.util.Map<String, Object>> getMonthlyRevenue(Long userId) {
        return jdbcTemplate.queryForList("""
                SELECT
                    DATE_FORMAT(wt.created_at, '%Y-%m') AS month,
                    COALESCE(SUM(wt.amount), 0) AS revenue
                FROM wallet_transactions wt
                WHERE wt.user_id = ? AND wt.reason LIKE 'Thu nhập chapter #%'
                    AND wt.created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
                GROUP BY DATE_FORMAT(wt.created_at, '%Y-%m')
                ORDER BY month ASC
                """, userId);
    }

    private Timestamp parseScheduledAt(String scheduledAt) {
        if (scheduledAt == null || scheduledAt.isBlank()) return null;
        try {
            // datetime-local input sends "yyyy-MM-ddTHH:mm" (no seconds) — append ":00"
            String normalized = scheduledAt.length() == 16 ? scheduledAt + ":00" : scheduledAt;
            return Timestamp.valueOf(LocalDateTime.parse(normalized));
        } catch (Exception e) {
            return null;
        }
    }

    private void replacePublishedChapterPages(Long chapterId, List<AuthorDraftPageItem> draftPages) {
        jdbcTemplate.update("DELETE FROM published_chapter_pages WHERE chapter_id = ?", chapterId);

        for (int i = 0; i < draftPages.size(); i++) {
            AuthorDraftPageItem page = draftPages.get(i);
            jdbcTemplate.update("""
                            INSERT INTO published_chapter_pages(chapter_id, image_url, file_name, sort_order)
                            VALUES (?, ?, ?, ?)
                            """,
                    chapterId,
                    page.url(),
                    page.name(),
                    i
            );
        }
    }

    private void syncWorkspacePages(Long draftId, List<AuthorDraftPageItem> pages) {
        jdbcTemplate.update("DELETE FROM author_draft_pages WHERE draft_id = ? AND draft_chapter_id IS NULL", draftId);

        List<AuthorDraftPageItem> input = pages == null ? List.of() : pages;
        for (int i = 0; i < input.size(); i++) {
            AuthorDraftPageItem page = input.get(i);
            if (page.url() == null || page.url().isBlank()) {
                continue;
            }
            jdbcTemplate.update("""
                            INSERT INTO author_draft_pages(draft_id, file_name, image_url, sort_order)
                            VALUES (?, ?, ?, ?)
                            """,
                    draftId,
                    page.name(),
                    page.url(),
                    page.sortOrder() == null ? i : page.sortOrder()
            );
        }
    }

    private DraftRow createDefaultDraft(Long userId, String mode) {
        jdbcTemplate.update("""
                        INSERT INTO author_drafts(
                            user_id, mode, title, slug, description, cover_url,
                            font_family, font_size, text_color, background_color, content, chapter_title, chapter_price
                        )
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
                        """,
                userId,
                mode,
                defaultTitle(mode),
                defaultSlug(mode),
                defaultDescription(mode),
                null,
                "text".equals(mode) ? "Georgia" : null,
                "text".equals(mode) ? 18 : null,
                "text".equals(mode) ? "#2b2f36" : null,
                "text".equals(mode) ? "#fffaf3" : null,
                "text".equals(mode) ? "Nhập nội dung chương ở đây để xem trước với font và màu chữ tùy chỉnh." : null,
                "comic".equals(mode) ? "Chap 1" : null
        );

        DraftRow draft = findDraft(userId, mode);
        if (draft == null) {
            throw new IllegalStateException("Khong the tao draft");
        }

        return draft;
    }

    private List<AuthorDraftChapterItem> getChapters(Long draftId) {
        List<AuthorDraftChapterItem> chapters = jdbcTemplate.query("""
                        SELECT id, title, status, pages, sort_order,
                               content, COALESCE(chapter_price, 0) AS chapter_price, target_chapter_id
                        FROM author_draft_chapters
                        WHERE draft_id = ?
                        ORDER BY sort_order ASC, id ASC
                        """,
                (rs, rowNum) -> new AuthorDraftChapterItem(
                        rs.getLong("id"),
                        rs.getString("title"),
                        rs.getString("status"),
                        (Integer) rs.getObject("pages"),
                        rs.getInt("sort_order"),
                        rs.getString("content"),
                        rs.getLong("chapter_price"),
                        (Long) rs.getObject("target_chapter_id"),
                        null
                ),
                draftId
        );
        return chapters.stream().map(ch ->
                new AuthorDraftChapterItem(
                        ch.id(), ch.title(), ch.status(), ch.pages(), ch.sortOrder(),
                        ch.content(), ch.chapterPrice(), ch.targetChapterId(),
                        getDraftChapterPages(ch.id())
                )
        ).toList();
    }

    private List<AuthorDraftPageItem> getDraftChapterPages(Long draftChapterId) {
        return jdbcTemplate.query("""
                        SELECT id, file_name, image_url, sort_order
                        FROM author_draft_pages
                        WHERE draft_chapter_id = ?
                        ORDER BY sort_order ASC, id ASC
                        """,
                (rs, rowNum) -> new AuthorDraftPageItem(
                        String.valueOf(rs.getLong("id")),
                        rs.getString("file_name"),
                        rs.getString("image_url"),
                        rs.getInt("sort_order")
                ),
                draftChapterId
        );
    }

    private List<AuthorDraftPageItem> getDraftPages(Long draftId) {
        return jdbcTemplate.query("""
                        SELECT id, file_name, image_url, sort_order
                        FROM author_draft_pages
                        WHERE draft_id = ? AND draft_chapter_id IS NULL
                        ORDER BY sort_order ASC, id ASC
                        """,
                (rs, rowNum) -> new AuthorDraftPageItem(
                        String.valueOf(rs.getLong("id")),
                        rs.getString("file_name"),
                        rs.getString("image_url"),
                        rs.getInt("sort_order")
                ),
                draftId
        );
    }

    private DraftRow findDraft(Long userId, String mode) {
        List<DraftRow> rows = jdbcTemplate.query("""
                           SELECT id, mode, title, slug, description, cover_url,
                               font_family, font_size, text_color, background_color, content, chapter_title,
                               target_chapter_id, COALESCE(chapter_price, 0) AS chapter_price
                        FROM author_drafts
                        WHERE user_id = ? AND mode = ?
                        LIMIT 1
                        """,
                (rs, rowNum) -> new DraftRow(
                        rs.getLong("id"),
                        rs.getString("mode"),
                        rs.getString("title"),
                        rs.getString("slug"),
                        rs.getString("description"),
                        rs.getString("cover_url"),
                        rs.getString("font_family"),
                        (Integer) rs.getObject("font_size"),
                        rs.getString("text_color"),
                        rs.getString("background_color"),
                        rs.getString("content"),
                        rs.getString("chapter_title"),
                        (Long) rs.getObject("target_chapter_id"),
                        rs.getLong("chapter_price")
                ),
                userId,
                mode
        );

        return rows.isEmpty() ? null : rows.get(0);
    }

    private DraftRow findDraftById(Long draftId) {
        List<DraftRow> rows = jdbcTemplate.query("""
                           SELECT id, mode, title, slug, description, cover_url,
                               font_family, font_size, text_color, background_color, content, chapter_title,
                               target_chapter_id, COALESCE(chapter_price, 0) AS chapter_price
                        FROM author_drafts
                        WHERE id = ?
                        LIMIT 1
                        """,
                (rs, rowNum) -> new DraftRow(
                        rs.getLong("id"),
                        rs.getString("mode"),
                        rs.getString("title"),
                        rs.getString("slug"),
                        rs.getString("description"),
                        rs.getString("cover_url"),
                        rs.getString("font_family"),
                        (Integer) rs.getObject("font_size"),
                        rs.getString("text_color"),
                        rs.getString("background_color"),
                        rs.getString("content"),
                        rs.getString("chapter_title"),
                        (Long) rs.getObject("target_chapter_id"),
                        rs.getLong("chapter_price")
                ),
                draftId
        );

        return rows.isEmpty() ? null : rows.get(0);
    }

    private Long findPublishedComicIdBySlug(String slug) {
        List<Long> rows = jdbcTemplate.query(
                "SELECT id FROM published_comics WHERE slug = ? LIMIT 1",
                (rs, rowNum) -> rs.getLong("id"),
                slug
        );
        return rows.isEmpty() ? null : rows.get(0);
    }

    private AuthorDraftResponse toResponse(DraftRow draft) {
        List<AuthorDraftChapterItem> chapters = getChapters(draft.id());
        List<AuthorDraftPageItem> pages = getDraftPages(draft.id());

        return new AuthorDraftResponse(
                draft.id(),
                draft.mode(),
                draft.title(),
                draft.slug(),
                draft.description(),
                draft.coverUrl(),
                draft.fontFamily(),
                draft.fontSize(),
                draft.color(),
                draft.background(),
                draft.content(),
                draft.chapterTitle(),
                draft.targetChapterId(),
                draft.chapterPrice(),
                chapters,
                pages
        );
    }

    private void validateMode(String mode) {
        if (!"text".equals(mode) && !"comic".equals(mode)) {
            throw new IllegalArgumentException("Mode khong hop le");
        }
    }

    private String normalizeTitle(String title, String mode) {
        return title == null ? defaultTitle(mode) : title;
    }

    private String normalizeSlug(String slug, String mode) {
        return slug == null ? defaultSlug(mode) : slug;
    }

    private String defaultTitle(String mode) {
        return "text".equals(mode) ? "Bản thảo truyện chữ" : "Bản thảo truyện hình";
    }

    private String defaultSlug(String mode) {
        return "text".equals(mode) ? "ban-thao-truyen-chu" : "ban-thao-truyen-hinh";
    }

    private String defaultDescription(String mode) {
        return "text".equals(mode)
                ? "Phác thảo nội dung truyện chữ và tùy chỉnh định dạng trước khi đăng."
                : "Tải ảnh trang truyện và quản lý chapter một cách mượt mà.";
    }

    private String defaultChapterTitle(String mode, int index) {
        if ("comic".equals(mode)) {
            return "Chap " + (index + 1);
        }
        return "Chương " + (index + 1);
    }

    private PublishedChapterRow findPublishedChapterById(Long chapterId) {
        List<PublishedChapterRow> rows = jdbcTemplate.query("""
                        SELECT id, comic_id, chapter_no, title
                        FROM published_chapters
                        WHERE id = ?
                        LIMIT 1
                        """,
                (rs, rowNum) -> new PublishedChapterRow(
                        rs.getLong("id"),
                        rs.getLong("comic_id"),
                        rs.getInt("chapter_no"),
                        rs.getString("title")
                ),
                chapterId
        );

        return rows.isEmpty() ? null : rows.get(0);
    }

    private PublishedChapterDetailRow findPublishedChapterDetailByIdAndUser(Long userId, Long chapterId) {
        List<PublishedChapterDetailRow> rows = jdbcTemplate.query("""
                        SELECT ch.id, ch.comic_id, ch.chapter_no, ch.title, pc.slug
                        FROM published_chapters ch
                        JOIN published_comics pc ON ch.comic_id = pc.id
                        WHERE ch.id = ? AND pc.user_id = ?
                        LIMIT 1
                        """,
                (rs, rowNum) -> new PublishedChapterDetailRow(
                        rs.getLong("id"),
                        rs.getLong("comic_id"),
                        rs.getInt("chapter_no"),
                        rs.getString("title"),
                        rs.getString("slug")
                ),
                chapterId,
                userId
        );

        return rows.isEmpty() ? null : rows.get(0);
    }

    private record DraftRow(
            Long id,
            String mode,
            String title,
            String slug,
            String description,
            String coverUrl,
            String fontFamily,
            Integer fontSize,
            String color,
            String background,
            String content,
            String chapterTitle,
            Long targetChapterId,
            Long chapterPrice
    ) {
    }

            private record PublishedChapterRow(
                Long id,
                Long comicId,
                Integer chapterNo,
                String title
            ) {
            }

    private record PublishedChapterDetailRow(
            Long id,
            Long comicId,
            Integer chapterNo,
            String title,
            String comicSlug
    ) {
    }
}
