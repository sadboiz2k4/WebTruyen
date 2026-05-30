package com.toptruyen.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.toptruyen.backend.dto.AuthRegisterRequest;
import com.toptruyen.backend.dto.UserProfileResponse;
import com.toptruyen.backend.dto.UserAuthRow;
import com.toptruyen.backend.entity.User;
import com.toptruyen.backend.entity.UserWallet;
import com.toptruyen.backend.repository.UserRepository;
import com.toptruyen.backend.repository.UserWalletRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final UserWalletRepository userWalletRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${app.google.client-id:}")
    private String googleClientId;

    public AuthService(
            UserRepository userRepository,
            UserWalletRepository userWalletRepository,
            BCryptPasswordEncoder passwordEncoder,
            JdbcTemplate jdbcTemplate
    ) {
        this.userRepository = userRepository;
        this.userWalletRepository = userWalletRepository;
        this.passwordEncoder = passwordEncoder;
        this.jdbcTemplate = jdbcTemplate;
    }

    @PostConstruct
    public void initColumns() {
        jdbcTemplate.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) NULL");
        jdbcTemplate.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR(50) NULL");
    }

    public UserAuthRow findByEmail(String email) {
        return userRepository.findByEmail(email)
                .map(user -> new UserAuthRow(
                        user.getId(),
                        user.getEmail(),
                        user.getDisplayName(),
                        user.getPasswordHash(),
                        user.getStatus()
                ))
                .orElse(null);
    }

    @Transactional
    public Long createUser(AuthRegisterRequest request) {
        // Kiểm tra email đã tồn tại
        if (userRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("Email đã tồn tại");
        }

        // Tạo user mới
        User user = new User();
        user.setEmail(request.email());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setDisplayName(request.name());
        user.setStatus("ACTIVE");
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());

        User savedUser = userRepository.save(user);

        // Tạo ví cho user
        UserWallet wallet = new UserWallet(savedUser);
        userWalletRepository.save(wallet);

        return savedUser.getId();
    }

    public boolean matchesPassword(String rawPassword, String passwordHash) {
        return passwordEncoder.matches(rawPassword, passwordHash);
    }

    public UserProfileResponse getUserProfile(Long userId) {
        return userRepository.findById(userId)
                .map(user -> new UserProfileResponse(
                        user.getId(),
                        user.getEmail(),
                        user.getDisplayName(),
                        user.getGender(),
                        user.getBio(),
                        user.getAvatar()
                ))
                .orElse(null);
    }

    @Transactional
    public boolean updateUserProfile(Long userId, String displayName, String gender, String bio) {
        return userRepository.findById(userId)
                .map(user -> {
                    user.setDisplayName(displayName);
                    user.setGender(gender);
                    user.setBio(bio);
                    user.setUpdatedAt(LocalDateTime.now());
                    userRepository.save(user);
                    return true;
                })
                .orElse(false);
    }

    @Transactional
    public boolean updateUserAvatar(Long userId, String avatarUrl) {
        return userRepository.findById(userId)
                .map(user -> {
                    user.setAvatar(avatarUrl);
                    user.setUpdatedAt(LocalDateTime.now());
                    userRepository.save(user);
                    return true;
                })
                .orElse(false);
    }

    @Transactional
    public void changePassword(long userId, String oldPassword, String newPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Người dùng không tồn tại"));
        if (!passwordEncoder.matches(oldPassword, user.getPasswordHash())) {
            throw new IllegalArgumentException("Mật khẩu cũ không đúng");
        }
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
    }

    @Transactional
    public UserAuthRow loginWithGoogle(String idToken) {
        // Verify token via Google tokeninfo endpoint
        JsonNode tokenInfo = verifyGoogleToken(idToken);

        String googleId = tokenInfo.get("sub").asText();
        String email    = tokenInfo.get("email").asText();
        String name     = tokenInfo.has("name") ? tokenInfo.get("name").asText() : email.split("@")[0];

        // Verify aud matches our client ID
        if (!googleClientId.isBlank()) {
            String aud = tokenInfo.has("aud") ? tokenInfo.get("aud").asText() : "";
            if (!googleClientId.equals(aud)) {
                throw new IllegalArgumentException("Token không hợp lệ");
            }
        }

        // 1. Look up by google_id
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "SELECT id, email, display_name, status FROM users WHERE google_id = ?", googleId);

        if (!rows.isEmpty()) {
            Map<String, Object> row = rows.get(0);
            if (!"ACTIVE".equalsIgnoreCase((String) row.get("status"))) {
                throw new IllegalArgumentException("Tài khoản đã bị khóa");
            }
            return new UserAuthRow(
                    ((Number) row.get("id")).longValue(),
                    (String) row.get("email"),
                    (String) row.get("display_name"),
                    null,
                    (String) row.get("status")
            );
        }

        // 2. Look up by email (link existing account)
        List<Map<String, Object>> emailRows = jdbcTemplate.queryForList(
                "SELECT id, email, display_name, status FROM users WHERE email = ?", email);

        if (!emailRows.isEmpty()) {
            Map<String, Object> row = emailRows.get(0);
            Long userId = ((Number) row.get("id")).longValue();
            if (!"ACTIVE".equalsIgnoreCase((String) row.get("status"))) {
                throw new IllegalArgumentException("Tài khoản đã bị khóa");
            }
            // Link google_id to existing account
            jdbcTemplate.update("UPDATE users SET google_id = ? WHERE id = ?", googleId, userId);
            return new UserAuthRow(userId, email, (String) row.get("display_name"), null, "ACTIVE");
        }

        // 3. Create new user
        String fakeHash = "$GOOGLE$" + UUID.randomUUID();
        jdbcTemplate.update(
                "INSERT INTO users (email, password_hash, display_name, status, google_id, created_at, updated_at) VALUES (?,?,?,'ACTIVE',?,NOW(),NOW())",
                email, fakeHash, name, googleId
        );
        Long newId = jdbcTemplate.queryForObject("SELECT LAST_INSERT_ID()", Long.class);

        // Create wallet
        jdbcTemplate.update("INSERT INTO user_wallets (user_id, balance) VALUES (?, 0)", newId);

        return new UserAuthRow(newId, email, name, null, "ACTIVE");
    }

    private JsonNode verifyGoogleToken(String idToken) {
        try {
            HttpClient client = HttpClient.newHttpClient();
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://oauth2.googleapis.com/tokeninfo?id_token=" + idToken))
                    .GET()
                    .build();
            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                throw new IllegalArgumentException("Token Google không hợp lệ");
            }
            return objectMapper.readTree(response.body());
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalArgumentException("Không thể xác minh token Google");
        }
    }
}
