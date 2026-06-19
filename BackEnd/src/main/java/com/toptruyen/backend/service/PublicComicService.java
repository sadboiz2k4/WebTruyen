package com.toptruyen.backend.service;

import com.toptruyen.backend.dto.*;
import com.toptruyen.backend.dto.AuthorProfileResponse;
import jakarta.annotation.PostConstruct;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class PublicComicService {

    private final JdbcTemplate jdbcTemplate;
    private final WalletService walletService;

    public PublicComicService(JdbcTemplate jdbcTemplate, WalletService walletService) {
        this.jdbcTemplate = jdbcTemplate;
        this.walletService = walletService;
    }

    @PostConstruct
    public void ensureColumns() {
        jdbcTemplate.execute("ALTER TABLE published_comics ADD COLUMN IF NOT EXISTS is_featured TINYINT(1) NOT NULL DEFAULT 0");
    }

    public PublicComicListResponse getPublishedComics(int page, int size) {
        int offset = page * size;
        List<PublicComicItem> items = jdbcTemplate.query("""
                SELECT pc.id, pc.slug, pc.title, pc.cover_url, pc.description, pc.published_at,
                       ch.id AS latest_chapter_id, ch.chapter_no AS latest_chapter_no,
                       (SELECT COALESCE(SUM(view_count), 0) FROM published_chapters WHERE comic_id = pc.id) AS total_views,
                       (SELECT COUNT(1) FROM chapter_comments cc JOIN published_chapters pch ON pch.id = cc.chapter_id WHERE pch.comic_id = pc.id) AS total_comments,
                       (SELECT COALESCE(AVG(r.rating), 0.0) FROM comic_ratings r WHERE r.comic_id = pc.id) AS avg_rating
                FROM published_comics pc
                LEFT JOIN published_chapters ch ON ch.comic_id = pc.id
                    AND ch.chapter_no = (SELECT MAX(chapter_no) FROM published_chapters WHERE comic_id = pc.id AND COALESCE(status,'PUBLISHED') = 'PUBLISHED')
                WHERE pc.status = 'PUBLISHED'
                AND EXISTS (SELECT 1 FROM published_chapters WHERE comic_id = pc.id AND COALESCE(status,'PUBLISHED') = 'PUBLISHED')
                ORDER BY pc.published_at DESC
                LIMIT ? OFFSET ?
                """,
                (rs, rowNum) -> new PublicComicItem(
                        rs.getLong("id"),
                        rs.getString("slug"),
                        rs.getString("title"),
                        rs.getString("cover_url"),
                        rs.getString("description"),
                        rs.getString("published_at"),
                        rs.getObject("latest_chapter_id") != null ? rs.getLong("latest_chapter_id") : null,
                        rs.getObject("latest_chapter_no") != null ? rs.getInt("latest_chapter_no") : null,
                        rs.getLong("total_views"),
                        rs.getLong("total_comments"),
                        rs.getDouble("avg_rating")
                ),
                size, offset
        );
        Integer total = jdbcTemplate.queryForObject(
                "SELECT COUNT(1) FROM published_comics pc WHERE pc.status = 'PUBLISHED' AND EXISTS (SELECT 1 FROM published_chapters WHERE comic_id = pc.id AND COALESCE(status,'PUBLISHED') = 'PUBLISHED')",
                Integer.class
        );
        int totalItems = total != null ? total : 0;
        int totalPages = size > 0 ? (int) Math.ceil((double) totalItems / size) : 1;
        return new PublicComicListResponse(items, totalItems, totalPages, page);
    }

    public PublicComicDetailResponse getComicDetail(String slug) {
        List<PublicComicDetailResponse> comics = jdbcTemplate.query("""
                SELECT pc.id, pc.slug, pc.title, pc.cover_url, pc.description, pc.published_at,
                       pc.categories, u.display_name AS author_name,
                       (SELECT COALESCE(SUM(view_count), 0) FROM published_chapters WHERE comic_id = pc.id) AS total_views
                FROM published_comics pc
                LEFT JOIN users u ON pc.user_id = u.id
                WHERE pc.slug = ? AND pc.status = 'PUBLISHED'
                AND EXISTS (SELECT 1 FROM published_chapters WHERE comic_id = pc.id AND COALESCE(status,'PUBLISHED') = 'PUBLISHED')
                LIMIT 1
                """,
                (rs, rowNum) -> {
                    Long comicId = rs.getLong("id");
                    List<PublicChapterSummary> chapters = jdbcTemplate.query("""
                            SELECT id, chapter_no, title, published_at, COALESCE(price, 0) AS price
                            FROM published_chapters
                            WHERE comic_id = ? AND published_at <= NOW()
                            AND COALESCE(status, 'PUBLISHED') = 'PUBLISHED'
                            ORDER BY chapter_no ASC
                            """,
                            (crs, crow) -> new PublicChapterSummary(
                                    crs.getLong("id"),
                                    crs.getInt("chapter_no"),
                                    crs.getString("title"),
                                    crs.getString("published_at"),
                                    crs.getLong("price")
                            ),
                            comicId
                    );
                    return new PublicComicDetailResponse(
                            comicId,
                            rs.getString("slug"),
                            rs.getString("title"),
                            rs.getString("cover_url"),
                            rs.getString("description"),
                            rs.getString("published_at"),
                            chapters,
                            rs.getString("categories"),
                            rs.getString("author_name"),
                            rs.getLong("total_views")
                    );
                },
                slug
        );
        return comics.isEmpty() ? null : comics.get(0);
    }

    public List<SearchComicsResultItem> getRelatedComics(String slug, String categories, int limit) {
        if (categories == null || categories.isBlank()) return List.of();
        String[] cats = categories.split(",");
        if (cats.length == 0) return List.of();
        // Use the first category for matching
        String primaryCat = "%" + cats[0].trim() + "%";
        return jdbcTemplate.query("""
                SELECT pc.id, pc.slug, pc.title, pc.cover_url, pc.description, pc.published_at,
                       ch.chapter_no AS latest_chapter_no, ch.title AS latest_chapter_title,
                       u.display_name AS author_name
                FROM published_comics pc
                LEFT JOIN published_chapters ch ON ch.comic_id = pc.id
                    AND ch.chapter_no = (SELECT MAX(chapter_no) FROM published_chapters WHERE comic_id = pc.id AND published_at <= NOW())
                LEFT JOIN users u ON pc.user_id = u.id
                WHERE pc.status = 'PUBLISHED' AND pc.slug != ? AND pc.categories LIKE ?
                ORDER BY pc.published_at DESC
                LIMIT ?
                """,
                (rs, rowNum) -> new SearchComicsResultItem(
                        rs.getLong("id"),
                        rs.getString("slug"),
                        rs.getString("title"),
                        rs.getString("cover_url"),
                        rs.getString("description"),
                        rs.getObject("latest_chapter_no") != null ? rs.getInt("latest_chapter_no") : null,
                        rs.getString("latest_chapter_title"),
                        rs.getString("published_at"),
                        0L, 0L, 0L, 0.0,
                        rs.getString("author_name")
                ),
                slug, primaryCat, limit
        );
    }

    public PublicChapterDetailResponse getChapterDetail(Long chapterId, Long userId) {
        List<PublicChapterDetailResponse> chapters = jdbcTemplate.query("""
                SELECT ch.id, ch.comic_id, ch.chapter_no, ch.title, ch.content, ch.published_at,
                       COALESCE(ch.price, 0) AS price,
                       pc.slug AS comic_slug, pc.title AS comic_title
                FROM published_chapters ch
                JOIN published_comics pc ON ch.comic_id = pc.id
                WHERE ch.id = ?
                LIMIT 1
                """,
                (rs, rowNum) -> {
                    Long chapId = rs.getLong("id");
                    long price = rs.getLong("price");
                    boolean locked = price > 0 && !isUnlocked(userId, chapId);

                    List<PublicChapterPageItem> pages;
                    String rawContent;

                    if (locked) {
                        pages = List.of();
                        rawContent = null;
                    } else {
                        pages = jdbcTemplate.query("""
                                SELECT id, image_url, sort_order
                                FROM published_chapter_pages
                                WHERE chapter_id = ?
                                ORDER BY sort_order ASC
                                """,
                                (prs, prow) -> new PublicChapterPageItem(
                                        prs.getLong("id"),
                                        prs.getString("image_url"),
                                        String.valueOf(prs.getInt("sort_order") + 1),
                                        prs.getInt("sort_order") + 1
                                ),
                                chapId
                        );
                        String raw = rs.getString("content");
                        rawContent = raw != null
                                ? java.text.Normalizer.normalize(raw, java.text.Normalizer.Form.NFC)
                                : null;
                    }

                    return new PublicChapterDetailResponse(
                            chapId,
                            rs.getLong("comic_id"),
                            rs.getString("comic_slug"),
                            rs.getString("comic_title"),
                            rs.getInt("chapter_no"),
                            rs.getString("title"),
                            rawContent,
                            rs.getString("published_at"),
                            pages,
                            price,
                            locked
                    );
                },
                chapterId
        );
        if (!chapters.isEmpty() && !Boolean.TRUE.equals(chapters.get(0).locked())) {
            try {
                jdbcTemplate.update(
                        "UPDATE published_chapters SET view_count = view_count + 1 WHERE id = ?", chapterId);
            } catch (Exception ignored) {}
        }
        return chapters.isEmpty() ? null : chapters.get(0);
    }

    @Transactional
    public void unlockChapter(Long userId, Long chapterId) {
        Integer alreadyUnlocked = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM chapter_unlocks WHERE user_id = ? AND chapter_id = ?",
                Integer.class, userId, chapterId
        );
        if (alreadyUnlocked != null && alreadyUnlocked > 0) {
            throw new IllegalArgumentException("Bạn đã mở khóa chapter này rồi");
        }

        List<Long> prices = jdbcTemplate.query(
                "SELECT COALESCE(price, 0) FROM published_chapters WHERE id = ?",
                (rs, rowNum) -> rs.getLong(1), chapterId
        );
        if (prices.isEmpty()) {
            throw new IllegalArgumentException("Chapter không tồn tại");
        }
        long price = prices.get(0);
        if (price <= 0) {
            throw new IllegalArgumentException("Chapter này miễn phí, không cần mở khóa");
        }

        walletService.withdrawMoney(userId, price, "Mở khóa chapter #" + chapterId);

        jdbcTemplate.update(
                "INSERT INTO chapter_unlocks(user_id, chapter_id) VALUES (?, ?)",
                userId, chapterId
        );

        // 70% doanh thu chuyển cho tác giả
        try {
            List<Long> authorIds = jdbcTemplate.queryForList(
                    "SELECT pc.user_id FROM published_comics pc JOIN published_chapters ch ON ch.comic_id = pc.id WHERE ch.id = ?",
                    Long.class, chapterId);
            if (!authorIds.isEmpty() && authorIds.get(0) != null && !authorIds.get(0).equals(userId)) {
                long authorEarnings = Math.round(price * 0.7);
                if (authorEarnings > 0) {
                    walletService.depositMoney(authorIds.get(0), authorEarnings, "Thu nhập chapter #" + chapterId);
                }
            }
        } catch (Exception ignored) {}
    }

    private boolean isUnlocked(Long userId, Long chapterId) {
        if (userId == null) return false;
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM chapter_unlocks WHERE user_id = ? AND chapter_id = ?",
                Integer.class, userId, chapterId
        );
        return count != null && count > 0;
    }

    public SearchComicsResponse searchComics(SearchComicsRequest request) {
        int page = request.page();
        int size = request.size();
        int offset = page * size;
        String query = request.query() != null && !request.query().isBlank() ? "%" + request.query() + "%" : "%";
        boolean hasCategory = request.category() != null && !request.category().isBlank() && !"Tất cả".equals(request.category());
        String categoryLike = hasCategory ? "%" + request.category() + "%" : null;

        String statusFilter = null;
        if ("Hoàn thành".equals(request.status())) statusFilter = "COMPLETED";
        else if ("Đang tiến hành".equals(request.status())) statusFilter = "ONGOING";
        boolean hasStatus = statusFilter != null;

        boolean onlyFeatured = "featured".equals(request.sortBy());
        boolean onlyFree = "free".equals(request.paidType());
        boolean onlyPaid = "paid".equals(request.paidType());
        String orderBy = switch (request.sortBy() != null ? request.sortBy() : "updated") {
            case "new"      -> "ORDER BY pc.published_at DESC\n";
            case "rating"   -> "ORDER BY avg_rating DESC, pc.published_at DESC\n";
            case "follow"   -> "ORDER BY follow_count DESC, pc.published_at DESC\n";
            case "comment"  -> "ORDER BY total_comments DESC, pc.published_at DESC\n";
            case "featured" -> "ORDER BY pc.published_at DESC\n";
            default         -> "ORDER BY COALESCE((SELECT MAX(published_at) FROM published_chapters WHERE comic_id = pc.id AND published_at <= NOW()), '1900-01-01') DESC\n";
        };

        String baseWhere = """
                WHERE pc.status = 'PUBLISHED'
                  AND EXISTS (SELECT 1 FROM published_chapters WHERE comic_id = pc.id AND COALESCE(status, 'PUBLISHED') = 'PUBLISHED' AND published_at <= NOW())
                  AND (pc.title LIKE ? OR pc.description LIKE ? OR u.display_name LIKE ? OR pc.categories LIKE ?)
                """
                + (hasCategory   ? "  AND pc.categories LIKE ?\n" : "")
                + (hasStatus     ? "  AND pc.story_status = ?\n" : "")
                + (onlyFeatured  ? "  AND pc.is_featured = 1\n" : "")
                + (onlyFree      ? "  AND NOT EXISTS (SELECT 1 FROM published_chapters WHERE comic_id = pc.id AND COALESCE(price, 0) > 0)\n" : "")
                + (onlyPaid      ? "  AND EXISTS (SELECT 1 FROM published_chapters WHERE comic_id = pc.id AND COALESCE(price, 0) > 0)\n" : "");

        List<Object> params = new java.util.ArrayList<>(java.util.List.of(query, query, query, query));
        if (hasCategory) params.add(categoryLike);
        if (hasStatus)   params.add(statusFilter);

        List<SearchComicsResultItem> items = jdbcTemplate.query(
                """
                SELECT pc.id, pc.slug, pc.title, pc.cover_url, pc.description, pc.published_at,
                       ch.chapter_no AS latest_chapter_no, ch.title AS latest_chapter_title,
                       u.display_name AS author_name,
                       (SELECT COALESCE(AVG(r.rating), 0.0) FROM comic_ratings r WHERE r.comic_id = pc.id) AS avg_rating,
                       (SELECT COUNT(1) FROM chapter_comments cc JOIN published_chapters pch ON pch.id = cc.chapter_id WHERE pch.comic_id = pc.id) AS total_comments,
                       (SELECT COUNT(1) FROM published_follows pf WHERE pf.comic_id = pc.id) AS follow_count,
                       (SELECT COALESCE(SUM(view_count), 0) FROM published_chapters WHERE comic_id = pc.id) AS total_views
                FROM published_comics pc
                LEFT JOIN published_chapters ch ON ch.comic_id = pc.id
                    AND ch.chapter_no = (SELECT MAX(chapter_no) FROM published_chapters WHERE comic_id = pc.id AND COALESCE(status, 'PUBLISHED') = 'PUBLISHED' AND published_at <= NOW())
                LEFT JOIN users u ON pc.user_id = u.id
                """ + baseWhere + orderBy + "LIMIT ? OFFSET ?",
                (rs, rowNum) -> new SearchComicsResultItem(
                        rs.getLong("id"),
                        rs.getString("slug"),
                        rs.getString("title"),
                        rs.getString("cover_url"),
                        rs.getString("description"),
                        rs.getObject("latest_chapter_no") != null ? rs.getInt("latest_chapter_no") : null,
                        rs.getString("latest_chapter_title"),
                        rs.getString("published_at"),
                        rs.getLong("follow_count"),
                        rs.getLong("total_comments"),
                        rs.getLong("total_views"),
                        rs.getDouble("avg_rating"),
                        rs.getString("author_name")
                ),
                appendArgs(params, size, offset)
        );

        List<Object> countParams = new java.util.ArrayList<>(java.util.List.of(query, query, query, query));
        if (hasCategory) countParams.add(categoryLike);
        if (hasStatus)   countParams.add(statusFilter);

        Long total = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM published_comics pc LEFT JOIN users u ON pc.user_id = u.id " + baseWhere,
                Long.class,
                countParams.toArray()
        );
        total = total == null ? 0L : total;
        int totalPages = (int) Math.ceil((double) total / size);

        return new SearchComicsResponse(items, page, totalPages, total, size);
    }

    public AuthorProfileResponse getAuthorProfile(String authorName) {
        List<AuthorProfileResponse> result = jdbcTemplate.query("""
                SELECT u.id, u.display_name, u.bio, u.gender, u.avatar_url,
                       DATE_FORMAT(u.created_at, '%Y-%m-%d') AS joined_at,
                       COUNT(DISTINCT pc.id) AS comic_count,
                       COALESCE((SELECT COUNT(*) FROM author_follows af WHERE af.author_user_id = u.id), 0) AS total_follows,
                       COALESCE((SELECT SUM(ch2.view_count)
                           FROM published_chapters ch2
                           JOIN published_comics pc3 ON pc3.id = ch2.comic_id
                           WHERE pc3.user_id = u.id
                       ), 0) AS total_views
                FROM users u
                LEFT JOIN published_comics pc ON pc.user_id = u.id AND pc.status = 'PUBLISHED'
                WHERE u.display_name = ?
                GROUP BY u.id, u.display_name, u.bio, u.gender, u.avatar_url, u.created_at
                LIMIT 1
                """,
                (rs, rowNum) -> new AuthorProfileResponse(
                        rs.getLong("id"),
                        rs.getString("display_name"),
                        rs.getString("bio"),
                        rs.getString("gender"),
                        rs.getString("joined_at"),
                        rs.getInt("comic_count"),
                        rs.getLong("total_follows"),
                        rs.getLong("total_views"),
                        rs.getString("avatar_url")
                ),
                authorName
        );
        return result.isEmpty() ? null : result.get(0);
    }

    public List<java.util.Map<String, Object>> getAuthorReadingList(String authorName) {
        return jdbcTemplate.queryForList("""
                SELECT pc.id, pc.slug, pc.title, pc.cover_url,
                       ch.chapter_no AS latest_chapter_no,
                       DATE_FORMAT(pf.created_at, '%Y-%m-%d') AS followed_at
                FROM published_follows pf
                JOIN users u ON u.id = pf.user_id AND u.display_name = ?
                JOIN published_comics pc ON pc.id = pf.comic_id AND pc.status = 'PUBLISHED'
                LEFT JOIN published_chapters ch ON ch.comic_id = pc.id
                    AND ch.chapter_no = (SELECT MAX(chapter_no) FROM published_chapters WHERE comic_id = pc.id)
                ORDER BY pf.created_at DESC
                LIMIT 50
                """, authorName);
    }

    public List<java.util.Map<String, Object>> getAuthorFollowers(String authorName) {
        return jdbcTemplate.queryForList("""
                SELECT u.id, u.display_name, u.avatar_url,
                       DATE_FORMAT(af.followed_at, '%Y-%m-%d') AS followed_at
                FROM author_follows af
                JOIN users author ON author.id = af.author_user_id AND author.display_name = ?
                JOIN users u ON u.id = af.follower_user_id
                ORDER BY af.followed_at DESC
                LIMIT 100
                """, authorName);
    }

    public List<SearchComicsResultItem> getComicsByAuthor(String authorName) {
        return jdbcTemplate.query("""
                SELECT pc.id, pc.slug, pc.title, pc.cover_url, pc.description, pc.published_at,
                       ch.chapter_no AS latest_chapter_no, ch.title AS latest_chapter_title,
                       u.display_name AS author_name
                FROM published_comics pc
                LEFT JOIN published_chapters ch ON ch.comic_id = pc.id
                    AND ch.status = 'PUBLISHED'
                    AND ch.chapter_no = (SELECT MAX(chapter_no) FROM published_chapters WHERE comic_id = pc.id AND status = 'PUBLISHED' AND published_at <= NOW())
                LEFT JOIN users u ON pc.user_id = u.id
                WHERE pc.status = 'PUBLISHED' AND u.display_name = ?
                  AND EXISTS (SELECT 1 FROM published_chapters WHERE comic_id = pc.id AND status = 'PUBLISHED')
                ORDER BY pc.published_at DESC
                """,
                (rs, rowNum) -> new SearchComicsResultItem(
                        rs.getLong("id"),
                        rs.getString("slug"),
                        rs.getString("title"),
                        rs.getString("cover_url"),
                        rs.getString("description"),
                        rs.getObject("latest_chapter_no") != null ? rs.getInt("latest_chapter_no") : null,
                        rs.getString("latest_chapter_title"),
                        rs.getString("published_at"),
                        0L, 0L, 0L, 0.0,
                        rs.getString("author_name")
                ),
                authorName
        );
    }

    private Object[] appendArgs(List<Object> base, Object... extra) {
        List<Object> all = new java.util.ArrayList<>(base);
        all.addAll(java.util.Arrays.asList(extra));
        return all.toArray();
    }
}
