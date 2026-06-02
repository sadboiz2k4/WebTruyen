package com.toptruyen.backend.interceptor;

import com.toptruyen.backend.service.AdminService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class AdminInterceptor implements HandlerInterceptor {

    private static final String SESSION_USER_ID = "SESSION_USER_ID";
    public static final String ADMIN_USER_ID = "adminUserId";

    private final AdminService adminService;

    public AdminInterceptor(AdminService adminService) {
        this.adminService = adminService;
    }

    @Override
    public boolean preHandle(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response, @NonNull Object handler) throws Exception {
        HttpSession session = request.getSession(false);
        if (session == null) {
            sendForbidden(response);
            return false;
        }
        Object userId = session.getAttribute(SESSION_USER_ID);
        if (userId == null) {
            sendForbidden(response);
            return false;
        }
        Long adminId = ((Number) userId).longValue();
        if (!adminService.isAdmin(adminId)) {
            sendForbidden(response);
            return false;
        }
        request.setAttribute(ADMIN_USER_ID, adminId);
        return true;
    }

    private void sendForbidden(HttpServletResponse response) throws Exception {
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write("{\"message\":\"Bạn không có quyền truy cập trang này\"}");
    }
}
