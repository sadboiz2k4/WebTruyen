package com.toptruyen.backend.controller;

import com.toptruyen.backend.dto.AuthLoginRequest;
import com.toptruyen.backend.dto.AuthRegisterRequest;
import com.toptruyen.backend.dto.AuthResponse;
import com.toptruyen.backend.dto.CurrentUserResponse;
import com.toptruyen.backend.dto.UserProfileResponse;
import com.toptruyen.backend.dto.UserAuthRow;
import com.toptruyen.backend.dto.UpdateUserProfileRequest;
import com.toptruyen.backend.service.AdminService;
import com.toptruyen.backend.service.AuthService;
import jakarta.validation.Valid;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final String SESSION_USER_ID = "SESSION_USER_ID";
    private static final String SESSION_EMAIL = "SESSION_EMAIL";
    private static final String SESSION_DISPLAY_NAME = "SESSION_DISPLAY_NAME";

    private final AuthService authService;
    private final AdminService adminService;

    public AuthController(AuthService authService, AdminService adminService) {
        this.authService = authService;
        this.adminService = adminService;
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody AuthLoginRequest request, HttpServletRequest servletRequest) {
        UserAuthRow user = authService.findByEmail(request.email());
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new AuthResponse(false, "Email hoac mat khau khong dung", null, null));
        }

        if (!"ACTIVE".equalsIgnoreCase(user.status())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new AuthResponse(false, "Tai khoan da bi khoa", null, null));
        }

        if (!authService.matchesPassword(request.password(), user.passwordHash())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new AuthResponse(false, "Email hoac mat khau khong dung", null, null));
        }

        HttpSession session = servletRequest.getSession(true);
        servletRequest.changeSessionId();
        session.setAttribute(SESSION_USER_ID, user.id());
        session.setAttribute(SESSION_EMAIL, user.email());
        session.setAttribute(SESSION_DISPLAY_NAME, user.displayName());

        return ResponseEntity.ok(new AuthResponse(true, "Dang nhap thanh cong", null, user.displayName()));
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody AuthRegisterRequest request, HttpServletRequest servletRequest) {
        if (!request.password().equals(request.confirmPassword())) {
            return ResponseEntity.badRequest()
                    .body(new AuthResponse(false, "Mat khau xac nhan khong khop", null, null));
        }

        try {
            Long userId = authService.createUser(request);
            HttpSession session = servletRequest.getSession(true);
            servletRequest.changeSessionId();
            session.setAttribute(SESSION_USER_ID, userId);
            session.setAttribute(SESSION_EMAIL, request.email());
            session.setAttribute(SESSION_DISPLAY_NAME, request.name());

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(new AuthResponse(true, "Dang ky thanh cong", null, request.name()));
        } catch (DataIntegrityViolationException e) {
            return ResponseEntity.badRequest()
                    .body(new AuthResponse(false, "Email da ton tai", null, null));
        }
    }

    @GetMapping("/me")
    public CurrentUserResponse me(HttpSession session) {
        Object userId = session.getAttribute(SESSION_USER_ID);
        if (userId == null) {
            return new CurrentUserResponse(false, null, null, null, false);
        }

        long uid = ((Number) userId).longValue();
        return new CurrentUserResponse(
                true,
                uid,
                (String) session.getAttribute(SESSION_EMAIL),
                (String) session.getAttribute(SESSION_DISPLAY_NAME),
                adminService.isAdmin(uid)
        );
    }

    @PostMapping("/google")
    public ResponseEntity<?> googleLogin(@RequestBody Map<String, String> body, HttpServletRequest servletRequest) {
        String credential = body != null ? body.get("credential") : null;
        if (credential == null || credential.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Token không hợp lệ"));
        }
        try {
            UserAuthRow user = authService.loginWithGoogle(credential);
            HttpSession session = servletRequest.getSession(true);
            servletRequest.changeSessionId();
            session.setAttribute(SESSION_USER_ID, user.id());
            session.setAttribute(SESSION_EMAIL, user.email());
            session.setAttribute(SESSION_DISPLAY_NAME, user.displayName());
            return ResponseEntity.ok(new AuthResponse(true, "Đăng nhập Google thành công", null, user.displayName()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Lỗi đăng nhập Google"));
        }
    }

    @PostMapping("/logout")
    public AuthResponse logout(HttpSession session) {
        session.invalidate();
        return new AuthResponse(true, "Dang xuat thanh cong", null, null);
    }

    @PutMapping("/profile")
    public ResponseEntity<AuthResponse> updateProfile(@Valid @RequestBody UpdateUserProfileRequest request, HttpSession session) {
        Object userId = session.getAttribute(SESSION_USER_ID);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new AuthResponse(false, "Khong co quyen truy cap", null, null));
        }

        String currentDisplayName = (String) session.getAttribute(SESSION_DISPLAY_NAME);
        String displayName = request.displayName();
        if (displayName == null || displayName.isBlank()) {
            displayName = currentDisplayName;
        }

        boolean updated = authService.updateUserProfile(
                ((Number) userId).longValue(),
                displayName,
                request.gender(),
                request.bio()
        );

        if (updated) {
            session.setAttribute(SESSION_DISPLAY_NAME, displayName);
            return ResponseEntity.ok(new AuthResponse(true, "Cap nhat thong tin thanh cong", null, null));
        } else {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new AuthResponse(false, "Cap nhat thong tin that bai", null, null));
        }
    }

    @PatchMapping("/avatar")
    public ResponseEntity<?> updateAvatar(@RequestBody Map<String, String> body, HttpSession session) {
        Object userId = session.getAttribute(SESSION_USER_ID);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Chưa đăng nhập"));
        }
        String avatarUrl = body != null ? body.get("avatarUrl") : null;
        if (avatarUrl == null || avatarUrl.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "URL ảnh không hợp lệ"));
        }
        boolean updated = authService.updateUserAvatar(((Number) userId).longValue(), avatarUrl);
        if (updated) return ResponseEntity.ok(Map.of("success", true));
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", "Cập nhật ảnh thất bại"));
    }

    @GetMapping("/profile")
    public ResponseEntity<UserProfileResponse> profile(HttpSession session) {
        Object userId = session.getAttribute(SESSION_USER_ID);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        UserProfileResponse profile = authService.getUserProfile(((Number) userId).longValue());
        if (profile == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(profile);
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> body) {
        String email = body != null ? body.get("email") : null;
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email không được để trống"));
        }
        try {
            authService.requestPasswordReset(email.trim());
            return ResponseEntity.ok(Map.of("message", "Đã gửi email hướng dẫn đặt lại mật khẩu. Vui lòng kiểm tra hộp thư (kể cả thư rác)."));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Gửi email thất bại: " + e.getMessage()));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> body) {
        String token = body != null ? body.get("token") : null;
        String newPassword = body != null ? body.get("newPassword") : null;
        if (token == null || token.isBlank() || newPassword == null || newPassword.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Thông tin không hợp lệ"));
        }
        if (newPassword.length() < 6) {
            return ResponseEntity.badRequest().body(Map.of("message", "Mật khẩu phải có ít nhất 6 ký tự"));
        }
        try {
            authService.resetPassword(token, newPassword);
            return ResponseEntity.ok(Map.of("message", "Đặt lại mật khẩu thành công! Vui lòng đăng nhập lại."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody Map<String, String> body, HttpSession session) {
        Object userId = session.getAttribute(SESSION_USER_ID);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Chưa đăng nhập"));
        }

        String oldPassword = body.get("oldPassword");
        String newPassword = body.get("newPassword");

        if (oldPassword == null || oldPassword.isBlank() || newPassword == null || newPassword.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Mật khẩu không được để trống"));
        }
        if (newPassword.length() < 6) {
            return ResponseEntity.badRequest().body(Map.of("message", "Mật khẩu mới phải có ít nhất 6 ký tự"));
        }

        try {
            authService.changePassword(((Number) userId).longValue(), oldPassword, newPassword);
            return ResponseEntity.ok(Map.of("success", true, "message", "Đổi mật khẩu thành công"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
