package com.toptruyen.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class VnPayService {

    @Value("${vnpay.tmn-code}")
    private String tmnCode;

    @Value("${vnpay.hash-secret}")
    private String hashSecret;

    @Value("${vnpay.url}")
    private String vnpayUrl;

    @Value("${vnpay.return-url}")
    private String returnUrl;

    private static final DateTimeFormatter VN_DT = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
    private static final ZoneId VN_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    public String createPaymentUrl(Long userId, long amountVnd, String ipAddress) throws Exception {
        String txnRef = userId + "_" + amountVnd + "_" + System.currentTimeMillis();
        String orderInfo = "Nap xu TopTruyen " + amountVnd;

        Map<String, String> params = new TreeMap<>();
        params.put("vnp_Version", "2.1.0");
        params.put("vnp_Command", "pay");
        params.put("vnp_TmnCode", tmnCode);
        params.put("vnp_Amount", String.valueOf(amountVnd * 100));
        params.put("vnp_CurrCode", "VND");
        params.put("vnp_TxnRef", txnRef);
        params.put("vnp_OrderInfo", orderInfo);
        params.put("vnp_OrderType", "other");
        params.put("vnp_Locale", "vn");
        params.put("vnp_ReturnUrl", returnUrl);
        params.put("vnp_IpAddr", ipAddress);
        params.put("vnp_CreateDate", ZonedDateTime.now(VN_ZONE).format(VN_DT));

        StringBuilder hashData = new StringBuilder();
        StringBuilder query = new StringBuilder();
        boolean first = true;
        for (Map.Entry<String, String> entry : params.entrySet()) {
            if (entry.getValue() == null || entry.getValue().isEmpty()) continue;
            if (!first) {
                hashData.append('&');
                query.append('&');
            }
            hashData.append(entry.getKey())
                    .append('=')
                    .append(URLEncoder.encode(entry.getValue(), StandardCharsets.US_ASCII));
            query.append(URLEncoder.encode(entry.getKey(), StandardCharsets.US_ASCII))
                 .append('=')
                 .append(URLEncoder.encode(entry.getValue(), StandardCharsets.US_ASCII));
            first = false;
        }

        String hash = hmacSHA512(hashSecret, hashData.toString());
        query.append("&vnp_SecureHash=").append(hash);

        return vnpayUrl + "?" + query;
    }

    public boolean verifyReturnSignature(Map<String, String[]> rawParams) throws Exception {
        Map<String, String> params = new TreeMap<>();
        for (Map.Entry<String, String[]> e : rawParams.entrySet()) {
            if (e.getValue() != null && e.getValue().length > 0) {
                params.put(e.getKey(), e.getValue()[0]);
            }
        }
        String secureHash = params.remove("vnp_SecureHash");
        params.remove("vnp_SecureHashType");

        if (secureHash == null) return false;

        StringBuilder hashData = new StringBuilder();
        boolean first = true;
        for (Map.Entry<String, String> entry : params.entrySet()) {
            if (entry.getValue() == null || entry.getValue().isEmpty()) continue;
            if (!first) hashData.append('&');
            hashData.append(entry.getKey())
                    .append('=')
                    .append(URLEncoder.encode(entry.getValue(), StandardCharsets.US_ASCII));
            first = false;
        }

        String computed = hmacSHA512(hashSecret, hashData.toString());
        return computed.equals(secureHash);
    }

    private String hmacSHA512(String key, String data) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA512");
        mac.init(new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA512"));
        byte[] hash = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
        StringBuilder sb = new StringBuilder(128);
        for (byte b : hash) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }
}
