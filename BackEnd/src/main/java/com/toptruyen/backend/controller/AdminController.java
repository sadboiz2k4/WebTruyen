package com.toptruyen.backend.controller;

import com.toptruyen.backend.dto.*;
import com.toptruyen.backend.service.AdminService;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private static final String SESSION_USER_ID = "SESSION_USER_ID";

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    // ── Stats ────────────────────────────────────────────────────────────────

    @GetMapping("/stats")
    public ResponseEntity<?> getStats(HttpSession session) {
        if (!checkAdmin(session)) return forbidden();
        return ResponseEntity.ok(adminService.getStats());
    }

    @GetMapping("/revenue")
    public ResponseEntity<?> getRevenue(HttpSession session) {
        if (!checkAdmin(session)) return forbidden();
        return ResponseEntity.ok(adminService.getRevenueStats());
    }

    @GetMapping("/revenue/monthly")
    public ResponseEntity<?> getMonthlyRevenue(HttpSession session) {
        if (!checkAdmin(session)) return forbidden();
        return ResponseEntity.ok(adminService.getMonthlyRevenue());
    }

    // ── Users ────────────────────────────────────────────────────────────────

    @GetMapping("/users")
    public ResponseEntity<?> listUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            HttpSession session) {
        if (!checkAdmin(session)) return forbidden();
        List<AdminUserItem> items = adminService.getUsers(page, Math.min(size, 50));
        long total = adminService.countUsers();
        return ResponseEntity.ok(Map.of(
                "data", items,
                "total", total,
                "page", page,
                "totalPages", (int) Math.ceil((double) total / size)
        ));
    }

    @PatchMapping("/users/{userId}/status")
    public ResponseEntity<?> setUserStatus(
            @PathVariable Long userId,
            @RequestBody Map<String, String> body,
            HttpSession session) {
        if (!checkAdmin(session)) return forbidden();
        try {
            adminService.setUserStatus(userId, body.get("status"));
            return ResponseEntity.ok(Map.of("success", true));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // ── Comics ───────────────────────────────────────────────────────────────

    @GetMapping("/comics")
    public ResponseEntity<?> listComics(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false, defaultValue = "") String status,
            HttpSession session) {
        if (!checkAdmin(session)) return forbidden();
        List<AdminComicItem> items = adminService.getComics(page, Math.min(size, 50), status);
        long total = adminService.countComics(status);
        return ResponseEntity.ok(Map.of(
                "data", items,
                "total", total,
                "page", page,
                "totalPages", (int) Math.ceil((double) total / size)
        ));
    }

    @PatchMapping("/comics/{comicId}/status")
    public ResponseEntity<?> setComicStatus(
            @PathVariable Long comicId,
            @RequestBody Map<String, String> body,
            HttpSession session) {
        if (!checkAdmin(session)) return forbidden();
        try {
            adminService.setComicStatus(comicId, body.get("status"));
            return ResponseEntity.ok(Map.of("success", true));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/comics/{comicId}")
    public ResponseEntity<?> deleteComic(@PathVariable Long comicId, HttpSession session) {
        if (!checkAdmin(session)) return forbidden();
        adminService.deleteComic(comicId);
        return ResponseEntity.ok(Map.of("success", true));
    }

    // ── Reports ──────────────────────────────────────────────────────────────

    @GetMapping("/reports")
    public ResponseEntity<?> listReports(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false, defaultValue = "") String status,
            HttpSession session) {
        if (!checkAdmin(session)) return forbidden();
        List<AdminReportItem> items = adminService.getReports(page, Math.min(size, 50), status);
        long total = adminService.countReports(status);
        return ResponseEntity.ok(Map.of(
                "data", items,
                "total", total,
                "page", page,
                "totalPages", (int) Math.ceil((double) total / size)
        ));
    }

    @PatchMapping("/reports/{reportId}/status")
    public ResponseEntity<?> resolveReport(
            @PathVariable Long reportId,
            @RequestBody Map<String, String> body,
            HttpSession session) {
        if (!checkAdmin(session)) return forbidden();
        try {
            adminService.resolveReport(
                    getSessionUserId(session),
                    reportId,
                    body.get("scope"),
                    body.get("status"),
                    body.get("note")
            );
            return ResponseEntity.ok(Map.of("success", true));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/reports/{reportId}")
    public ResponseEntity<?> getReportDetail(@PathVariable Long reportId, @RequestParam(required = false, defaultValue = "CONTENT") String scope, HttpSession session) {
        if (!checkAdmin(session)) return forbidden();
        try {
            return ResponseEntity.ok(adminService.getReportDetail(reportId, scope));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/report-appeals")
    public ResponseEntity<?> listAppeals(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false, defaultValue = "") String status,
            HttpSession session) {
        if (!checkAdmin(session)) return forbidden();
        List<AdminReportAppealItem> items = adminService.getAppeals(page, Math.min(size, 50), status);
        long total = adminService.countAppeals(status);
        return ResponseEntity.ok(Map.of(
                "data", items,
                "total", total,
                "page", page,
                "totalPages", (int) Math.ceil((double) total / size)
        ));
    }

    @PatchMapping("/report-appeals/{appealId}/status")
    public ResponseEntity<?> resolveAppeal(
            @PathVariable Long appealId,
            @RequestBody Map<String, String> body,
            HttpSession session) {
        if (!checkAdmin(session)) return forbidden();
        try {
            adminService.resolveAppeal(
                    getSessionUserId(session),
                    appealId,
                    body.get("status"),
                    body.get("note")
            );
            return ResponseEntity.ok(Map.of("success", true));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // ── Chapters ─────────────────────────────────────────────────────────────

    @GetMapping("/chapters")
    public ResponseEntity<?> listChapters(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false, defaultValue = "") String comicSlug,
            HttpSession session) {
        if (!checkAdmin(session)) return forbidden();
        List<AdminChapterItem> items = adminService.getChapters(page, Math.min(size, 50), comicSlug);
        long total = adminService.countChapters(comicSlug);
        return ResponseEntity.ok(Map.of(
                "data", items,
                "total", total,
                "page", page,
                "totalPages", (int) Math.ceil((double) total / size)
        ));
    }

    @DeleteMapping("/chapters/{chapterId}")
    public ResponseEntity<?> deleteChapter(@PathVariable Long chapterId, HttpSession session) {
        if (!checkAdmin(session)) return forbidden();
        adminService.deleteChapter(chapterId);
        return ResponseEntity.ok(Map.of("success", true));
    }

    // ── Comments ─────────────────────────────────────────────────────────────

    @GetMapping("/comments")
    public ResponseEntity<?> listComments(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false, defaultValue = "") String comicSlug,
            HttpSession session) {
        if (!checkAdmin(session)) return forbidden();
        List<AdminCommentItem> items = adminService.getComments(page, Math.min(size, 50), comicSlug);
        long total = adminService.countComments(comicSlug);
        return ResponseEntity.ok(Map.of(
                "data", items,
                "total", total,
                "page", page,
                "totalPages", (int) Math.ceil((double) total / size)
        ));
    }

    @DeleteMapping("/comments/{commentId}")
    public ResponseEntity<?> deleteComment(@PathVariable Long commentId, HttpSession session) {
        if (!checkAdmin(session)) return forbidden();
        adminService.deleteComment(commentId);
        return ResponseEntity.ok(Map.of("success", true));
    }

    // ── Transactions ─────────────────────────────────────────────────────────

    @GetMapping("/transactions")
    public ResponseEntity<?> listTransactions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false, defaultValue = "") String type,
            HttpSession session) {
        if (!checkAdmin(session)) return forbidden();
        return ResponseEntity.ok(adminService.getAllTransactions(page, Math.min(size, 100), type));
    }

    // ── Withdrawal Requests ──────────────────────────────────────────────────

    @GetMapping("/withdrawal-requests")
    public ResponseEntity<?> listWithdrawalRequests(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false, defaultValue = "") String status,
            HttpSession session) {
        if (!checkAdmin(session)) return forbidden();
        return ResponseEntity.ok(adminService.getWithdrawalRequests(page, Math.min(size, 100), status));
    }

    @PatchMapping("/withdrawal-requests/{requestId}/status")
    public ResponseEntity<?> processWithdrawal(
            @PathVariable Long requestId,
            @RequestBody Map<String, String> body,
            HttpSession session) {
        if (!checkAdmin(session)) return forbidden();
        try {
            adminService.processWithdrawal(requestId, body.get("status"), body.get("adminNote"));
            return ResponseEntity.ok(Map.of("success", true));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // ── Featured Comics ───────────────────────────────────────────────────────

    @PatchMapping("/comics/{comicId}/featured")
    public ResponseEntity<?> setFeatured(
            @PathVariable Long comicId,
            @RequestBody Map<String, Boolean> body,
            HttpSession session) {
        if (!checkAdmin(session)) return forbidden();
        Boolean featured = body.get("featured");
        if (featured == null) return ResponseEntity.badRequest().body(Map.of("message", "Thiếu trường featured"));
        adminService.setFeaturedStatus(comicId, featured);
        return ResponseEntity.ok(Map.of("success", true));
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private boolean checkAdmin(HttpSession session) {
        Object userId = session.getAttribute(SESSION_USER_ID);
        if (userId == null) return false;
        return adminService.isAdmin(((Number) userId).longValue());
    }

    private Long getSessionUserId(HttpSession session) {
        Object userId = session.getAttribute(SESSION_USER_ID);
        return userId == null ? null : ((Number) userId).longValue();
    }

    private ResponseEntity<Map<String, String>> forbidden() {
        return ResponseEntity.status(403).body(Map.of("message", "Bạn không có quyền truy cập trang này"));
    }
}
