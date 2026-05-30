package com.toptruyen.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.*;

@Service
public class MoMoService {

    @Value("${momo.partner-code}")
    private String partnerCode;

    @Value("${momo.access-key}")
    private String accessKey;

    @Value("${momo.secret-key}")
    private String secretKey;

    @Value("${momo.endpoint}")
    private String endpoint;

    @Value("${momo.redirect-url}")
    private String redirectUrl;

    @Value("${momo.ipn-url}")
    private String ipnUrl;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public String createPaymentUrl(Long userId, long amountVnd) throws Exception {
        String orderId = userId + "_" + amountVnd + "_" + System.currentTimeMillis();
        String requestId = UUID.randomUUID().toString();
        String orderInfo = "Nap xu TopTruyen";
        String extraData = "";
        String requestType = "payWithATM";

        String rawHash = "accessKey=" + accessKey
                + "&amount=" + amountVnd
                + "&extraData=" + extraData
                + "&ipnUrl=" + ipnUrl
                + "&orderId=" + orderId
                + "&orderInfo=" + orderInfo
                + "&partnerCode=" + partnerCode
                + "&redirectUrl=" + redirectUrl
                + "&requestId=" + requestId
                + "&requestType=" + requestType;

        String signature = hmacSHA256(secretKey, rawHash);

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("partnerCode", partnerCode);
        payload.put("partnerName", "TopTruyen");
        payload.put("storeId", "TopTruyenStore");
        payload.put("requestType", requestType);
        payload.put("ipnUrl", ipnUrl);
        payload.put("redirectUrl", redirectUrl);
        payload.put("orderId", orderId);
        payload.put("amount", amountVnd);
        payload.put("lang", "vi");
        payload.put("autoCapture", true);
        payload.put("orderInfo", orderInfo);
        payload.put("requestId", requestId);
        payload.put("extraData", extraData);
        payload.put("orderGroupId", "");
        payload.put("signature", signature);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<String> entity = new HttpEntity<>(objectMapper.writeValueAsString(payload), headers);

        @SuppressWarnings("unchecked")
        ResponseEntity<Map<String, Object>> resp = restTemplate.postForEntity(endpoint, entity, (Class<Map<String, Object>>) (Class<?>) Map.class);
        Map<String, Object> result = resp.getBody();
        if (result == null) throw new RuntimeException("Không nhận được phản hồi từ MoMo");

        Object resultCode = result.get("resultCode");
        if (resultCode == null || Integer.parseInt(resultCode.toString()) != 0) {
            throw new RuntimeException(result.getOrDefault("message", "Lỗi tạo thanh toán MoMo").toString());
        }

        return result.get("payUrl").toString();
    }

    // Verify signature from MoMo redirect/IPN callback
    public boolean verifyReturnSignature(Map<String, String> params) throws Exception {
        String rawHash = "accessKey=" + accessKey
                + "&amount=" + params.getOrDefault("amount", "")
                + "&extraData=" + params.getOrDefault("extraData", "")
                + "&message=" + params.getOrDefault("message", "")
                + "&orderId=" + params.getOrDefault("orderId", "")
                + "&orderInfo=" + params.getOrDefault("orderInfo", "")
                + "&orderType=" + params.getOrDefault("orderType", "")
                + "&partnerCode=" + params.getOrDefault("partnerCode", "")
                + "&payType=" + params.getOrDefault("payType", "")
                + "&requestId=" + params.getOrDefault("requestId", "")
                + "&responseTime=" + params.getOrDefault("responseTime", "")
                + "&resultCode=" + params.getOrDefault("resultCode", "")
                + "&transId=" + params.getOrDefault("transId", "");

        String computed = hmacSHA256(secretKey, rawHash);
        return computed.equals(params.getOrDefault("signature", ""));
    }

    private String hmacSHA256(String key, String data) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        byte[] hash = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
        StringBuilder sb = new StringBuilder(64);
        for (byte b : hash) sb.append(String.format("%02x", b));
        return sb.toString();
    }
}
