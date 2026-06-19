package com.toptruyen.backend.controller;

import com.toptruyen.backend.dto.WalletTransactionRequest;
import com.toptruyen.backend.service.MoMoService;
import com.toptruyen.backend.service.NotificationService;
import com.toptruyen.backend.service.VnPayService;
import com.toptruyen.backend.service.WalletService;
import jakarta.annotation.PostConstruct;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/api/wallet")
public class WalletController {

    private static final String SESSION_USER_ID = "SESSION_USER_ID";

    private final WalletService walletService;
    private final JdbcTemplate jdbcTemplate;
    private final VnPayService vnPayService;
    private final MoMoService moMoService;
    private final NotificationService notificationService;

    @Value("${vnpay.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    public WalletController(WalletService walletService, JdbcTemplate jdbcTemplate, VnPayService vnPayService, MoMoService moMoService, NotificationService notificationService) {
        this.walletService = walletService;
        this.jdbcTemplate = jdbcTemplate;
        this.vnPayService = vnPayService;
        this.moMoService = moMoService;
        this.notificationService = notificationService;
    }

    @PostConstruct
    public void ensureTables() {
        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS user_daily_actions (
                    id BIGINT AUTO_INCREMENT PRIMARY KEY,
                    user_id BIGINT NOT NULL,
                    action_type VARCHAR(32) NOT NULL,
                    reward BIGINT NOT NULL DEFAULT 0,
                    action_date DATE NOT NULL,
                    UNIQUE KEY uk_user_daily_action (user_id, action_type, action_date)
                )
                """);
        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS withdrawal_requests (
                    id BIGINT AUTO_INCREMENT PRIMARY KEY,
                    user_id BIGINT NOT NULL,
                    amount BIGINT NOT NULL,
                    bank_info TEXT NOT NULL,
                    note TEXT,
                    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
                    admin_note TEXT,
                    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    processed_at DATETIME NULL
                )
                """);
        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS donations (
                    id BIGINT AUTO_INCREMENT PRIMARY KEY,
                    from_user_id BIGINT NOT NULL,
                    to_user_id BIGINT NOT NULL,
                    amount BIGINT NOT NULL,
                    author_received BIGINT NOT NULL,
                    platform_fee BIGINT NOT NULL,
                    message TEXT,
                    from_display_name VARCHAR(255),
                    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                )
                """);
        jdbcTemplate.execute("ALTER TABLE donations ADD COLUMN IF NOT EXISTS comic_id BIGINT NULL");
        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS user_bank_accounts (
                    id BIGINT AUTO_INCREMENT PRIMARY KEY,
                    user_id BIGINT NOT NULL,
                    bank_info TEXT NOT NULL,
                    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                )
                """);
    }

    @GetMapping("/balance")
    public ResponseEntity<?> getBalance(HttpSession session) {
        Long userId = getSessionUserId(session);
        if (userId == null) {
            return ResponseEntity.status(401).body("Not logged in");
        }
        return ResponseEntity.ok(walletService.getBalance(userId));
    }

    @PostMapping("/deposit")
    public ResponseEntity<?> deposit(HttpSession session, @RequestBody WalletTransactionRequest request) {
        Long userId = getSessionUserId(session);
        if (userId == null) {
            return ResponseEntity.status(401).body("Not logged in");
        }
        try {
            return ResponseEntity.ok(walletService.depositMoney(userId, request.amount(), request.reason()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/withdraw")
    public ResponseEntity<?> withdraw(HttpSession session, @RequestBody WalletTransactionRequest request) {
        Long userId = getSessionUserId(session);
        if (userId == null) {
            return ResponseEntity.status(401).body("Not logged in");
        }
        try {
            return ResponseEntity.ok(walletService.withdrawMoney(userId, request.amount(), request.reason()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/transactions")
    public ResponseEntity<?> getTransactions(
            HttpSession session,
            @RequestParam(name = "page", required = false, defaultValue = "0") int page,
            @RequestParam(name = "limit", required = false, defaultValue = "20") int limit
    ) {
        Long userId = getSessionUserId(session);
        if (userId == null) {
            return ResponseEntity.status(401).body("Not logged in");
        }
        return ResponseEntity.ok(walletService.getTransactionHistory(userId, page, Math.min(limit, 100)));
    }

    @GetMapping("/daily-status")
    public ResponseEntity<?> getDailyStatus(HttpSession session) {
        Long userId = getSessionUserId(session);
        if (userId == null) return ResponseEntity.status(401).body(Map.of("message", "Not logged in"));
        String today = LocalDate.now().toString();
        Integer checkedIn = jdbcTemplate.queryForObject(
            "SELECT COUNT(1) FROM user_daily_actions WHERE user_id = ? AND action_type = 'CHECKIN' AND action_date = ?",
            Integer.class, userId, today);
        return ResponseEntity.ok(Map.of(
            "checkedIn", checkedIn != null && checkedIn > 0
        ));
    }

    @PostMapping("/checkin")
    public ResponseEntity<?> checkIn(HttpSession session) {
        Long userId = getSessionUserId(session);
        if (userId == null) return ResponseEntity.status(401).body(Map.of("message", "Not logged in"));
        String today = LocalDate.now().toString();
        try {
            jdbcTemplate.update(
                "INSERT INTO user_daily_actions (user_id, action_type, reward, action_date) VALUES (?, 'CHECKIN', 100, ?)",
                userId, today);
        } catch (DuplicateKeyException e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Bạn đã điểm danh hôm nay rồi"));
        }
        walletService.depositMoney(userId, 100L, "Điểm danh hằng ngày");
        return ResponseEntity.ok(Map.of("reward", 100, "newBalance", walletService.getBalance(userId)));
    }

    // ── Withdrawal Requests ──────────────────────────────────────────────────

    @PostMapping("/transfer")
    public ResponseEntity<?> transfer(HttpSession session, @RequestBody Map<String, Object> body) {
        Long userId = getSessionUserId(session);
        if (userId == null) return ResponseEntity.status(401).body(Map.of("message", "Chưa đăng nhập"));

        Object toDisplayNameObj = body.get("toDisplayName");
        Object amountObj = body.get("amount");
        if (toDisplayNameObj == null || amountObj == null)
            return ResponseEntity.badRequest().body(Map.of("message", "Thiếu thông tin"));

        String toDisplayName = toDisplayNameObj.toString().trim();
        if (toDisplayName.isBlank())
            return ResponseEntity.badRequest().body(Map.of("message", "Vui lòng nhập tên người nhận"));

        long amount;
        try { amount = Long.parseLong(amountObj.toString()); } catch (NumberFormatException e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Số xu không hợp lệ"));
        }
        if (amount <= 0)
            return ResponseEntity.badRequest().body(Map.of("message", "Số xu phải lớn hơn 0"));

        String note = body.getOrDefault("note", "").toString();

        var recipientIds = jdbcTemplate.queryForList(
            "SELECT id FROM users WHERE display_name = ? LIMIT 1", Long.class, toDisplayName);
        if (recipientIds.isEmpty())
            return ResponseEntity.badRequest().body(Map.of("message", "Không tìm thấy người dùng: " + toDisplayName));

        Long toUserId = recipientIds.get(0);
        if (toUserId.equals(userId))
            return ResponseEntity.badRequest().body(Map.of("message", "Không thể chuyển xu cho chính mình"));

        try {
            long[] result = walletService.donateMoney(userId, toUserId, amount, note.isBlank() ? "Ủng hộ tác giả" : note);
            long authorReceived = result[0];
            long platformFee = result[1];

            String fromDisplayName = jdbcTemplate.queryForObject(
                "SELECT display_name FROM users WHERE id = ? LIMIT 1", String.class, userId);
            jdbcTemplate.update(
                "INSERT INTO donations (from_user_id, to_user_id, amount, author_received, platform_fee, message, from_display_name) VALUES (?, ?, ?, ?, ?, ?, ?)",
                userId, toUserId, amount, authorReceived, platformFee, note.isBlank() ? null : note, fromDisplayName);

            jdbcTemplate.update(
                "INSERT INTO wallet_transactions(user_id, amount, type, reason) VALUES(?, ?, 'INCOME', ?)",
                toUserId, authorReceived, "Thu nhập ủng hộ từ " + fromDisplayName);

            notificationService.createNotification(
                toUserId, "DONATE",
                "Bạn nhận được ủng hộ mới",
                fromDisplayName + " đã ủng hộ " + authorReceived + " xu cho bạn",
                null, null);

            return ResponseEntity.ok(Map.of(
                "message", "Ủng hộ thành công! Tác giả nhận được " + authorReceived + " xu",
                "newBalance", walletService.getBalance(userId),
                "authorReceived", authorReceived,
                "platformFee", platformFee
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/donate-comic")
    public ResponseEntity<?> donateComic(HttpSession session, @RequestBody Map<String, Object> body) {
        Long userId = getSessionUserId(session);
        if (userId == null) return ResponseEntity.status(401).body(Map.of("message", "Chưa đăng nhập"));

        Object comicIdObj = body.get("comicId");
        Object amountObj = body.get("amount");
        if (comicIdObj == null || amountObj == null)
            return ResponseEntity.badRequest().body(Map.of("message", "Thiếu thông tin"));

        long comicId;
        try { comicId = Long.parseLong(comicIdObj.toString()); } catch (NumberFormatException e) {
            return ResponseEntity.badRequest().body(Map.of("message", "ID truyện không hợp lệ"));
        }

        long amount;
        try { amount = Long.parseLong(amountObj.toString()); } catch (NumberFormatException e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Số xu không hợp lệ"));
        }
        if (amount <= 0)
            return ResponseEntity.badRequest().body(Map.of("message", "Số xu phải lớn hơn 0"));

        String note = body.getOrDefault("message", "").toString();

        var authorIds = jdbcTemplate.queryForList(
            "SELECT user_id FROM published_comics WHERE id = ? LIMIT 1", Long.class, comicId);
        if (authorIds.isEmpty())
            return ResponseEntity.badRequest().body(Map.of("message", "Không tìm thấy truyện"));

        Long authorUserId = authorIds.get(0);
        if (authorUserId.equals(userId))
            return ResponseEntity.badRequest().body(Map.of("message", "Không thể ủng hộ truyện của chính mình"));

        try {
            long[] result = walletService.donateMoney(userId, authorUserId, amount, note.isBlank() ? "Ủng hộ tác giả" : note);
            long authorReceived = result[0];
            long platformFee = result[1];

            jdbcTemplate.update(
                "INSERT INTO wallet_transactions(user_id, amount, type, reason) VALUES(?, ?, 'INCOME', ?)",
                authorUserId, authorReceived, "Thu nhập donate #" + comicId);

            String fromDisplayName = jdbcTemplate.queryForObject(
                "SELECT display_name FROM users WHERE id = ? LIMIT 1", String.class, userId);
            jdbcTemplate.update(
                "INSERT INTO donations (from_user_id, to_user_id, amount, author_received, platform_fee, message, from_display_name, comic_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                userId, authorUserId, amount, authorReceived, platformFee, note.isBlank() ? null : note, fromDisplayName, comicId);

            var comicInfo = jdbcTemplate.queryForMap("SELECT title, slug FROM published_comics WHERE id = ? LIMIT 1", comicId);
            String comicTitle = (String) comicInfo.get("title");
            String comicSlug = (String) comicInfo.get("slug");
            notificationService.createNotification(
                authorUserId, "DONATE",
                "Bạn nhận được ủng hộ mới",
                fromDisplayName + " đã ủng hộ " + authorReceived + " xu cho truyện \"" + comicTitle + "\"",
                comicId, "/chi-tiet-truyen/" + comicSlug);

            return ResponseEntity.ok(Map.of(
                "message", "Ủng hộ thành công! Tác giả nhận được " + authorReceived + " xu",
                "newBalance", walletService.getBalance(userId),
                "authorReceived", authorReceived,
                "platformFee", platformFee
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/donations/received")
    public ResponseEntity<?> getDonationsReceived(
            HttpSession session,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int limit) {
        Long userId = getSessionUserId(session);
        if (userId == null) return ResponseEntity.status(401).body(Map.of("message", "Chưa đăng nhập"));

        int offset = page * Math.min(limit, 100);
        var donations = jdbcTemplate.queryForList(
            "SELECT id, from_display_name, amount, author_received, platform_fee, message, created_at FROM donations WHERE to_user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?",
            userId, Math.min(limit, 100), offset);
        return ResponseEntity.ok(donations);
    }

    @PostMapping("/withdrawal-request")
    public ResponseEntity<?> requestWithdrawal(HttpSession session, @RequestBody Map<String, Object> body) {
        Long userId = getSessionUserId(session);
        if (userId == null) return ResponseEntity.status(401).body(Map.of("message", "Chưa đăng nhập"));

        Object amountObj = body.get("amount");
        Object bankInfoObj = body.get("bankInfo");
        if (amountObj == null || bankInfoObj == null)
            return ResponseEntity.badRequest().body(Map.of("message", "Thiếu thông tin"));

        long amount;
        try { amount = Long.parseLong(amountObj.toString()); } catch (NumberFormatException e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Số tiền không hợp lệ"));
        }
        if (amount < 10000)
            return ResponseEntity.badRequest().body(Map.of("message", "Số xu rút tối thiểu là 10,000"));

        String bankInfo = bankInfoObj.toString().trim();
        if (bankInfo.isBlank())
            return ResponseEntity.badRequest().body(Map.of("message", "Vui lòng nhập thông tin ngân hàng"));

        String note = body.getOrDefault("note", "").toString();

        // Check pending request
        Integer pending = jdbcTemplate.queryForObject(
            "SELECT COUNT(1) FROM withdrawal_requests WHERE user_id = ? AND status = 'PENDING'",
            Integer.class, userId);
        if (pending != null && pending > 0)
            return ResponseEntity.badRequest().body(Map.of("message", "Bạn đã có yêu cầu rút tiền đang chờ xử lý"));

        // Check balance và giữ tiền ngay
        long balance = walletService.getBalance(userId);
        if (balance < amount)
            return ResponseEntity.badRequest().body(Map.of("message", "Số dư không đủ"));

        // Trừ tiền trước để giữ chỗ
        try {
            walletService.withdrawMoney(userId, amount, "Tạm giữ chờ duyệt rút tiền");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Số dư không đủ"));
        }

        jdbcTemplate.update(
            "INSERT INTO withdrawal_requests(user_id, amount, bank_info, note) VALUES(?,?,?,?)",
            userId, amount, bankInfo, note);

        return ResponseEntity.ok(Map.of("message", "Đã gửi yêu cầu rút tiền thành công"));
    }

    @GetMapping("/withdrawal-requests")
    public ResponseEntity<?> getWithdrawalRequests(
            HttpSession session,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int limit) {
        Long userId = getSessionUserId(session);
        if (userId == null) return ResponseEntity.status(401).body(Map.of("message", "Chưa đăng nhập"));

        int offset = page * Math.min(limit, 50);
        var rows = jdbcTemplate.queryForList(
            "SELECT id, amount, bank_info, note, status, admin_note, " +
            "DATE_FORMAT(created_at,'%Y-%m-%d %H:%i') AS created_at, " +
            "DATE_FORMAT(processed_at,'%Y-%m-%d %H:%i') AS processed_at " +
            "FROM withdrawal_requests WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?",
            userId, Math.min(limit, 50), offset);

        Long total = jdbcTemplate.queryForObject(
            "SELECT COUNT(1) FROM withdrawal_requests WHERE user_id = ?", Long.class, userId);

        return ResponseEntity.ok(Map.of(
            "data", rows,
            "total", total == null ? 0 : total,
            "page", page
        ));
    }

    // ── Bank Accounts ────────────────────────────────────────────────────────

    @GetMapping("/bank-accounts")
    public ResponseEntity<?> getBankAccounts(HttpSession session) {
        Long userId = getSessionUserId(session);
        if (userId == null) return ResponseEntity.status(401).body(Map.of("message", "Chưa đăng nhập"));
        var rows = jdbcTemplate.queryForList(
                "SELECT id, bank_info, DATE_FORMAT(created_at,'%Y-%m-%d') AS created_at " +
                "FROM user_bank_accounts WHERE user_id = ? ORDER BY created_at DESC LIMIT 10",
                userId);
        return ResponseEntity.ok(rows);
    }

    @PostMapping("/bank-accounts")
    public ResponseEntity<?> saveBankAccount(HttpSession session, @RequestBody Map<String, String> body) {
        Long userId = getSessionUserId(session);
        if (userId == null) return ResponseEntity.status(401).body(Map.of("message", "Chưa đăng nhập"));
        String bankInfo = body.getOrDefault("bankInfo", "").trim();
        if (bankInfo.isBlank()) return ResponseEntity.badRequest().body(Map.of("message", "Thông tin ngân hàng không được trống"));
        Long count = jdbcTemplate.queryForObject("SELECT COUNT(1) FROM user_bank_accounts WHERE user_id = ?", Long.class, userId);
        if (count != null && count >= 5) return ResponseEntity.badRequest().body(Map.of("message", "Tối đa 5 tài khoản được lưu"));
        jdbcTemplate.update("INSERT INTO user_bank_accounts(user_id, bank_info) VALUES(?,?)", userId, bankInfo);
        Long newId = jdbcTemplate.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
        return ResponseEntity.ok(Map.of("id", newId, "bankInfo", bankInfo));
    }

    @DeleteMapping("/bank-accounts/{id}")
    public ResponseEntity<?> deleteBankAccount(@PathVariable Long id, HttpSession session) {
        Long userId = getSessionUserId(session);
        if (userId == null) return ResponseEntity.status(401).body(Map.of("message", "Chưa đăng nhập"));
        int rows = jdbcTemplate.update("DELETE FROM user_bank_accounts WHERE id = ? AND user_id = ?", id, userId);
        if (rows == 0) return ResponseEntity.status(404).body(Map.of("message", "Không tìm thấy tài khoản"));
        return ResponseEntity.ok(Map.of("success", true));
    }

    // ── VNPay ────────────────────────────────────────────────────────────────

    @PostMapping("/vnpay/create")
    public ResponseEntity<?> createVnPayPayment(
            HttpSession session,
            @RequestBody Map<String, Object> request,
            HttpServletRequest httpRequest) {
        Long userId = getSessionUserId(session);
        if (userId == null) return ResponseEntity.status(401).body(Map.of("message", "Chưa đăng nhập"));

        Object amountObj = request.get("amountVnd");
        if (amountObj == null) return ResponseEntity.badRequest().body(Map.of("message", "Thiếu số tiền"));
        long amountVnd;
        try {
            amountVnd = Long.parseLong(amountObj.toString());
        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Số tiền không hợp lệ"));
        }
        if (amountVnd < 10000) {
            return ResponseEntity.badRequest().body(Map.of("message", "Số tiền tối thiểu là 10,000 VND"));
        }

        String ip = httpRequest.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty()) ip = httpRequest.getRemoteAddr();

        try {
            String paymentUrl = vnPayService.createPaymentUrl(userId, amountVnd, ip);
            return ResponseEntity.ok(Map.of("paymentUrl", paymentUrl));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("message", "Không thể tạo yêu cầu thanh toán"));
        }
    }

    @GetMapping("/vnpay/return")
    public void vnPayReturn(HttpServletRequest request, HttpServletResponse response) throws Exception {
        String responseCode = request.getParameter("vnp_ResponseCode");
        String txnRef = request.getParameter("vnp_TxnRef");
        String vnpAmount = request.getParameter("vnp_Amount");

        boolean valid;
        try {
            valid = vnPayService.verifyReturnSignature(request.getParameterMap());
        } catch (Exception e) {
            valid = false;
        }

        if (!valid || !"00".equals(responseCode) || txnRef == null || vnpAmount == null) {
            response.sendRedirect(frontendUrl + "/vi-xu?payment=failed");
            return;
        }

        // txnRef = userId_amountVnd_timestamp
        String[] parts = txnRef.split("_");
        if (parts.length < 2) {
            response.sendRedirect(frontendUrl + "/vi-xu?payment=failed");
            return;
        }
        long userId;
        long amountVnd;
        try {
            userId = Long.parseLong(parts[0]);
            amountVnd = Long.parseLong(parts[1]);
        } catch (NumberFormatException e) {
            response.sendRedirect(frontendUrl + "/vi-xu?payment=failed");
            return;
        }

        // Verify amount matches (vnp_Amount = amountVnd * 100)
        long vnpAmountLong;
        try {
            vnpAmountLong = Long.parseLong(vnpAmount);
        } catch (NumberFormatException e) {
            response.sendRedirect(frontendUrl + "/vi-xu?payment=failed");
            return;
        }
        if (vnpAmountLong != amountVnd * 100) {
            response.sendRedirect(frontendUrl + "/vi-xu?payment=failed");
            return;
        }

        try {
            walletService.depositMoney(userId, amountVnd, "Nạp tiền qua VNPay");
            response.sendRedirect(frontendUrl + "/vi-xu?payment=success&xu=" + amountVnd);
        } catch (Exception e) {
            response.sendRedirect(frontendUrl + "/vi-xu?payment=failed");
        }
    }

    // ── MoMo ─────────────────────────────────────────────────────────────────

    @PostMapping("/momo/create")
    public ResponseEntity<?> createMoMoPayment(
            HttpSession session,
            @RequestBody Map<String, Object> request) {
        Long userId = getSessionUserId(session);
        if (userId == null) return ResponseEntity.status(401).body(Map.of("message", "Chưa đăng nhập"));

        Object amountObj = request.get("amountVnd");
        if (amountObj == null) return ResponseEntity.badRequest().body(Map.of("message", "Thiếu số tiền"));
        long amountVnd;
        try {
            amountVnd = Long.parseLong(amountObj.toString());
        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Số tiền không hợp lệ"));
        }
        if (amountVnd < 10000) {
            return ResponseEntity.badRequest().body(Map.of("message", "Số tiền tối thiểu là 10,000 VND"));
        }

        try {
            String payUrl = moMoService.createPaymentUrl(userId, amountVnd);
            return ResponseEntity.ok(Map.of("paymentUrl", payUrl));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("message", "Không thể tạo yêu cầu thanh toán MoMo: " + e.getMessage()));
        }
    }

    @GetMapping("/momo/return")
    public void moMoReturn(HttpServletRequest request, HttpServletResponse response) throws Exception {
        String resultCode = request.getParameter("resultCode");
        String orderId = request.getParameter("orderId");
        String amount = request.getParameter("amount");

        Map<String, String> params = new java.util.HashMap<>();
        request.getParameterMap().forEach((k, v) -> {
            if (v != null && v.length > 0) params.put(k, v[0]);
        });

        boolean valid;
        try {
            valid = moMoService.verifyReturnSignature(params);
        } catch (Exception e) {
            valid = false;
        }

        if (!valid || !"0".equals(resultCode) || orderId == null || amount == null) {
            response.sendRedirect(frontendUrl + "/vi-xu?payment=failed");
            return;
        }

        // orderId = userId_amountVnd_timestamp
        String[] parts = orderId.split("_");
        if (parts.length < 2) {
            response.sendRedirect(frontendUrl + "/vi-xu?payment=failed");
            return;
        }
        long userId;
        long amountVnd;
        try {
            userId = Long.parseLong(parts[0]);
            amountVnd = Long.parseLong(parts[1]);
        } catch (NumberFormatException e) {
            response.sendRedirect(frontendUrl + "/vi-xu?payment=failed");
            return;
        }

        long amountLong;
        try {
            amountLong = Long.parseLong(amount);
        } catch (NumberFormatException e) {
            response.sendRedirect(frontendUrl + "/vi-xu?payment=failed");
            return;
        }
        if (amountLong != amountVnd) {
            response.sendRedirect(frontendUrl + "/vi-xu?payment=failed");
            return;
        }

        try {
            walletService.depositMoney(userId, amountVnd, "Nạp tiền qua MoMo");
            response.sendRedirect(frontendUrl + "/vi-xu?payment=success&xu=" + amountVnd);
        } catch (Exception e) {
            response.sendRedirect(frontendUrl + "/vi-xu?payment=failed");
        }
    }

    @PostMapping("/momo/ipn")
    public ResponseEntity<?> moMoIpn(@RequestBody Map<String, Object> body) {
        // IPN acknowledgement — actual crediting handled via redirectUrl
        return ResponseEntity.ok(Map.of("resultCode", 0, "message", "success"));
    }

    // ─────────────────────────────────────────────────────────────────────────

    private Long getSessionUserId(HttpSession session) {
        Object userId = session.getAttribute(SESSION_USER_ID);
        if (userId == null) {
            return null;
        }
        return ((Number) userId).longValue();
    }
}
