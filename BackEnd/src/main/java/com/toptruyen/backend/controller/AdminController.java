package com.toptruyen.backend.controller;

import com.toptruyen.backend.dto.*;
import com.toptruyen.backend.interceptor.AdminInterceptor;
import com.toptruyen.backend.service.AdminService;
import com.toptruyen.backend.service.ModerationService;
import jakarta.annotation.PostConstruct;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;
    private final ModerationService moderationService;

    public AdminController(AdminService adminService, ModerationService moderationService) {
        this.adminService = adminService;
        this.moderationService = moderationService;
    }

    @PostConstruct
    public void recheckOnStartup() {
        new Thread(() -> {
            try { Thread.sleep(15000); } catch (InterruptedException ignored) {}
            try {
                Map<String, Object> result = adminService.recheckAiPendingChapters(moderationService);
                System.out.println("[AI-RECHECK] Startup recheck: " + result);
            } catch (Exception e) {
                System.out.println("[AI-RECHECK] Recheck failed: " + e.getMessage());
            }
        }).start();
    }

    @PostMapping("/chapters/recheck-ai")
    public ResponseEntity<?> recheckAiPending() {
        return ResponseEntity.ok(adminService.recheckAiPendingChapters(moderationService));
    }

    // ── Stats ────────────────────────────────────────────────────────────────

    @GetMapping("/stats")
    public ResponseEntity<?> getStats() {
        return ResponseEntity.ok(adminService.getStats());
    }

    @GetMapping("/revenue")
    public ResponseEntity<?> getRevenue() {
        return ResponseEntity.ok(adminService.getRevenueStats());
    }

    @GetMapping("/revenue/monthly")
    public ResponseEntity<?> getMonthlyRevenue() {
        return ResponseEntity.ok(adminService.getMonthlyRevenue());
    }

    // ── Users ────────────────────────────────────────────────────────────────

    @GetMapping("/users")
    public ResponseEntity<?> listUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
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
            @RequestBody Map<String, String> body) {
        try {
            adminService.setUserStatus(userId, body.get("status"));
            return ResponseEntity.ok(Map.of("success", true));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PatchMapping("/users/{userId}/admin-role")
    public ResponseEntity<?> setAdminRole(
            @PathVariable Long userId,
            @RequestBody Map<String, Boolean> body,
            HttpServletRequest request) {
        Boolean grant = body.get("grant");
        if (grant == null) return ResponseEntity.badRequest().body(Map.of("message", "Thiếu trường grant"));
        Long requestingAdminId = (Long) request.getAttribute(AdminInterceptor.ADMIN_USER_ID);
        if (requestingAdminId.equals(userId)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Không thể tự thay đổi quyền của chính mình"));
        }
        try {
            adminService.setAdminRole(userId, grant);
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
            @RequestParam(required = false, defaultValue = "") String status) {
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
            @RequestBody Map<String, String> body) {
        try {
            adminService.setComicStatus(comicId, body.get("status"));
            return ResponseEntity.ok(Map.of("success", true));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/comics/{comicId}")
    public ResponseEntity<?> deleteComic(@PathVariable Long comicId) {
        adminService.deleteComic(comicId);
        return ResponseEntity.ok(Map.of("success", true));
    }

    // ── Reports ──────────────────────────────────────────────────────────────

    @GetMapping("/reports")
    public ResponseEntity<?> listReports(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false, defaultValue = "") String status) {
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
            HttpServletRequest request) {
        try {
            adminService.resolveReport(
                    (Long) request.getAttribute(AdminInterceptor.ADMIN_USER_ID),
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
    public ResponseEntity<?> getReportDetail(
            @PathVariable Long reportId,
            @RequestParam(required = false, defaultValue = "CONTENT") String scope) {
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
            @RequestParam(required = false, defaultValue = "") String status) {
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
            HttpServletRequest request) {
        try {
            adminService.resolveAppeal(
                    (Long) request.getAttribute(AdminInterceptor.ADMIN_USER_ID),
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
            @RequestParam(required = false, defaultValue = "") String comicSlug) {
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
    public ResponseEntity<?> deleteChapter(@PathVariable Long chapterId) {
        adminService.deleteChapter(chapterId);
        return ResponseEntity.ok(Map.of("success", true));
    }

    // ── Moderation (Pending Chapters) ────────────────────────────────────────

    @GetMapping("/chapters/{chapterId}/content")
    public ResponseEntity<?> getChapterContent(@PathVariable Long chapterId) {
        try {
            return ResponseEntity.ok(adminService.getChapterContent(chapterId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/chapters/pending")
    public ResponseEntity<?> listPendingChapters() {
        return ResponseEntity.ok(adminService.getPendingChapters());
    }

    @PostMapping("/chapters/{chapterId}/recheck")
    public ResponseEntity<?> recheckChapter(@PathVariable Long chapterId) {
        return ResponseEntity.ok(adminService.recheckSingleChapter(chapterId, moderationService));
    }

    @PostMapping("/chapters/{chapterId}/approve")
    public ResponseEntity<?> approveChapter(@PathVariable Long chapterId) {
        adminService.approveChapter(chapterId);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @PostMapping("/chapters/{chapterId}/reject")
    public ResponseEntity<?> rejectChapter(
            @PathVariable Long chapterId,
            @RequestBody(required = false) Map<String, String> body) {
        String reason = body != null ? body.getOrDefault("reason", "Vi phạm nội dung") : "Vi phạm nội dung";
        adminService.rejectChapter(chapterId, reason);
        return ResponseEntity.ok(Map.of("success", true));
    }

    // ── Comments ─────────────────────────────────────────────────────────────

    @GetMapping("/comments")
    public ResponseEntity<?> listComments(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false, defaultValue = "") String comicSlug) {
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
    public ResponseEntity<?> deleteComment(@PathVariable Long commentId) {
        adminService.deleteComment(commentId);
        return ResponseEntity.ok(Map.of("success", true));
    }

    // ── Transactions ─────────────────────────────────────────────────────────

    @GetMapping("/transactions")
    public ResponseEntity<?> listTransactions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false, defaultValue = "") String type) {
        return ResponseEntity.ok(adminService.getAllTransactions(page, Math.min(size, 100), type));
    }

    // ── Withdrawal Requests ──────────────────────────────────────────────────

    @GetMapping("/withdrawal-requests")
    public ResponseEntity<?> listWithdrawalRequests(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false, defaultValue = "") String status) {
        return ResponseEntity.ok(adminService.getWithdrawalRequests(page, Math.min(size, 100), status));
    }

    @PatchMapping("/withdrawal-requests/{requestId}/status")
    public ResponseEntity<?> processWithdrawal(
            @PathVariable Long requestId,
            @RequestBody Map<String, String> body) {
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
            @RequestBody Map<String, Boolean> body) {
        Boolean featured = body.get("featured");
        if (featured == null) return ResponseEntity.badRequest().body(Map.of("message", "Thiếu trường featured"));
        adminService.setFeaturedStatus(comicId, featured);
        return ResponseEntity.ok(Map.of("success", true));
    }
}
