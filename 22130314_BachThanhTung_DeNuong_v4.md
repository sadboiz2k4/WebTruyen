TRƯỜNG ĐẠI HỌC NÔNG LÂM TP.HCM  
KHOA CÔNG NGHỆ THÔNG TIN

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;*TP. Hồ Chí Minh, ngày 02 tháng 06 năm 2025*

# ĐỀ CƯƠNG CHI TIẾT TIỂU LUẬN TỐT NGHIỆP

---

## 1. Tên đề tài

**Thiết kế và xây dựng nền tảng trực tuyến hỗ trợ sáng tác, phân phối và thương mại hóa truyện**

---

## 2. Sinh viên thực hiện

| | |
|---|---|
| Họ tên | Bạch Thanh Tùng |
| Mã số sinh viên | 22130314 |
| Lớp | DH22DTC |
| Khóa | 48 |
| Khoa | Công nghệ thông tin |
| Số điện thoại | 0703035425 |

---

## 3. Giảng viên hướng dẫn

ThS. Trần Lê Như Quỳnh

---

## 4. Phát biểu bài toán

Nền tảng trực tuyến TopTruyen được đề xuất nhằm hỗ trợ cộng đồng tác giả và độc giả sáng tác, lưu trữ và thương mại hóa các tác phẩm truyện một cách chuyên nghiệp và hiệu quả. Từ kết quả khảo sát và phân tích thị trường, dự án tập trung giải quyết ba thách thức lớn nhất đang tồn tại:

**Rào cản về thương mại hóa và giao dịch vi mô:** Hiện nay, việc kiếm tiền từ tác phẩm của các tác giả độc lập gặp nhiều khó khăn do tỷ lệ chiết khấu nền tảng cao và quy trình đối soát kém minh bạch. Đề tài xây dựng hệ thống ví điện tử nội bộ, cho phép người dùng quy đổi tiền thật sang đơn vị tiền tệ ảo (Xu) để thực hiện các giao dịch vi mô (Micro-transactions) mở khóa chương VIP hoặc tặng quà (donate), đảm bảo tính toàn vẹn dữ liệu (ACID) trong mỗi giao dịch. Hệ thống tích hợp thực tế hai cổng thanh toán nội địa phổ biến tại Việt Nam: VnPay (thẻ ngân hàng) và MoMo (ví điện tử di động).

**Lỗ hổng trong bảo vệ bản quyền và kiểm duyệt nội dung đa phương tiện:** Vấn nạn "đạo văn" truyện chữ và "re-up" truyện tranh trái phép đang tràn lan, đồng thời nội dung phản động, gây thù địch hay khiêu dâm cũng không được kiểm soát kịp thời. Kiểm duyệt thủ công không thể xử lý kịp lượng nội dung khổng lồ đăng tải mỗi ngày. Hệ thống triển khai pipeline kiểm duyệt tự động **hai lớp độc lập** cho cả hai định dạng: với **truyện chữ**, Lớp 1 dùng PhoBERT embedding (ngữ nghĩa tiếng Việt) phát hiện đạo văn; Lớp 2 dùng Google Perspective API (TOXICITY, SEVERE_TOXICITY, SEXUALLY_EXPLICIT, THREAT) – fallback bằng bộ từ khóa phân tầng (HARD: "lật đổ chính quyền", "kích động bạo loạn", "việt tân"; SOFT: tính theo mật độ, giảm điểm nếu ngữ cảnh hư cấu) – phát hiện nội dung phản động và gây thù địch. Với **truyện tranh**, Lớp 1 dùng pHash để phát hiện ảnh tái đăng; Lớp 2 dùng CLIP zero-shot (openai/clip-vit-base-patch32) phát hiện nội dung khiêu dâm. Chỉ những chương vượt qua cả hai lớp mới được phép cài đặt thu phí.

**Hạn chế trong phân phối nội dung và trải nghiệm người dùng:** Về phía người đọc, hệ thống được thiết kế theo dạng Web Application đáp ứng (Responsive), tập trung vào trải nghiệm đọc (Reading Experience). Bài toán phân phối truyện được giải quyết thông qua thuật toán Trending Score và Content-based Filtering, kết hợp tìm kiếm nâng cao để tự động đề xuất tác phẩm phù hợp. Ngoài ra, nền tảng cho phép tùy chỉnh giao diện đọc (màu nền, cỡ chữ, font) và tích hợp Text-to-Speech tiếng Việt để hiện thực hóa tính năng "AI kể chuyện đêm khuya". Quản trị viên (Admin) được cung cấp Dashboard toàn diện để xem thống kê, xử lý báo cáo vi phạm, duyệt nội dung và quản lý tài chính.

---

## 5. Mục tiêu của đề tài

**Mục tiêu tổng quát:** Phát triển một nền tảng Web trực tuyến toàn diện bằng ReactJS và Spring Boot, hỗ trợ quy trình sáng tác, phân phối, thương mại hóa truyện chữ lẫn truyện tranh, đồng thời bảo vệ bản quyền số tự động bằng AI.

**Mục tiêu cụ thể:**

- **Về kỹ thuật và kiến trúc hệ thống:** Xây dựng hệ thống Backend RESTful API vững chắc bằng Spring Boot (Java) kết hợp cơ sở dữ liệu MySQL, sử dụng xác thực Session-based (HTTP Session + BCrypt) đảm bảo xử lý an toàn các logic phức tạp như giao dịch ví điện tử nội bộ và đối soát doanh thu. Triển khai AI Service độc lập bằng Python Flask để xử lý các tác vụ nặng (PhoBERT embedding, pHash), tách biệt khỏi luồng nghiệp vụ chính.

- **Về bảo vệ bản quyền và kiểm duyệt nội dung đa phương tiện:** Tự động hóa hoàn toàn hai lớp kiểm duyệt độc lập. Lớp 1 (chống đạo văn/tái đăng): PhoBERT embedding (similarity) cho truyện chữ, pHash (Hamming Distance) cho truyện tranh. Lớp 2 (nội dung vi phạm): Google Perspective API phát hiện ngôn ngữ độc hại (TOXICITY, SEVERE_TOXICITY, SEXUALLY_EXPLICIT, THREAT) – fallback bằng bộ từ khóa HARD/SOFT phân tầng theo mật độ và ngữ cảnh hư cấu – cho truyện chữ; CLIP zero-shot NSFW classification cho truyện tranh. Ba mức phân loại: An toàn (< ngưỡng), Nghi ngờ (PENDING_REVIEW – Admin xét thủ công), Vi phạm nghiêm trọng (REJECTED tự động).

- **Về công cụ sáng tác và quản trị:** Cung cấp Studio Sáng tác với Rich Text Editor cho truyện chữ và module upload ảnh hàng loạt cho truyện tranh. Xây dựng ví thanh toán và hệ thống thống kê doanh thu minh bạch, tích hợp cổng thanh toán VnPay và MoMo. Cung cấp Admin Dashboard mạnh mẽ để duyệt nội dung, xử lý báo cáo vi phạm và quản lý rút tiền.

- **Về trải nghiệm và phân phối nội dung:** Tối ưu hóa giao diện đọc với tùy chỉnh cá nhân hóa cao (font, màu nền, cỡ chữ, khoảng cách dòng), tích hợp TTS tiếng Việt (Zalo AI), và hiện thực hệ thống gợi ý kết hợp Trending Score và Content-based Filtering.

---

## 6. Nội dung của đề tài

### 6.1. Các nội dung cần nghiên cứu, thử nghiệm

#### 6.1.1. Lập kế hoạch và phân tích yêu cầu

Giai đoạn này nhằm xác định rõ phạm vi, đối tượng người dùng và đặc tả chi tiết các chức năng cần thiết để hệ thống hoạt động thực tế. Quá trình phân tích bao gồm khảo sát nền tảng đối thủ, xác định yêu cầu chức năng và phi chức năng, đồng thời lập kế hoạch phát triển dự án.

**a. Phân tích các nền tảng đối thủ**

Khảo sát luồng nghiệp vụ (User Flow) của các nền tảng truyện hàng đầu hiện nay và các web truyện nội địa Việt Nam. Đánh giá ưu/nhược điểm trong mô hình thương mại hóa và cơ chế quản lý tác quyền để rút kinh nghiệm áp dụng cho đề tài.

| Tính năng | Wattpad | Webtoon | Truyện Full / Hako | Manga24h | **TopTruyen (đề tài)** |
|-----------|:-------:|:-------:|:------------------:|:--------:|:---------------------:|
| Truyện chữ (sáng tác + đọc) | ✓ | ✗ | Chỉ đọc | ✗ | **✓** |
| Truyện tranh (sáng tác + đọc) | ✗ | ✓ | ✗ | Chỉ đọc | **✓** |
| Kiếm tiền tác giả cá nhân | Hạn chế | Hạn chế | ✗ | ✗ | **✓** |
| Kiểm duyệt bản quyền tự động | ✗ | ✗ | ✗ | ✗ | **✓ (AI 2 lớp)** |
| Kiểm duyệt nội dung vi phạm AI | ✗ | ✗ | ✗ | ✗ | **✓ (Perspective API)** |
| Tích hợp thanh toán nội địa VN | ✗ | ✗ | ✗ | ✗ | **✓ (VnPay, MoMo)** |
| AI đọc truyện (TTS tiếng Việt) | ✗ | ✗ | ✗ | ✗ | **✓** |
| Hệ thống gợi ý thông minh | Cơ bản | Cơ bản | ✗ | ✗ | **✓** |

Kết quả phân tích cho thấy không có nền tảng nào kết hợp đủ: công cụ sáng tác chuyên nghiệp + kiểm duyệt bản quyền/nội dung tự động bằng AI + thanh toán nội địa Việt Nam trong một sản phẩm duy nhất. Đây chính là khoảng trống mà TopTruyen hướng tới lấp đầy.

**b. Khảo sát nhu cầu người dùng**

Tiến hành phân tích nhu cầu thực tế của hai nhóm đối tượng chính:
- **Tác giả sáng tác mạng:** Nhu cầu về công cụ soạn thảo chuyên nghiệp, hệ thống thu phí theo chương, đối soát doanh thu minh bạch, và bảo vệ tác phẩm khỏi đạo văn.
- **Độc giả:** Nhu cầu tùy chỉnh giao diện đọc, nghe truyện bằng AI (TTS), hệ thống gợi ý phù hợp sở thích, và cơ chế nạp tiền/mua chương đơn giản qua các cổng thanh toán phổ biến tại Việt Nam.

**c. Xác định yêu cầu chức năng (Functional Requirements)**

- **Sáng tác & Quản lý nội dung:** Studio sáng tác phân định 2 luồng: Truyện chữ (Rich Text Editor) và Truyện tranh (upload ảnh hàng loạt, kéo thả sắp xếp).
- **Kiểm duyệt & Bản quyền:** Quét tự động khi xuất bản, phân loại 3 mức dựa trên PhoBERT similarity (truyện chữ) và pHash Hamming Distance (truyện tranh). Admin có luồng duyệt thủ công nội dung "Nghi ngờ".
- **Thương mại hóa:** Ví Xu nội bộ, nạp tiền qua VnPay và MoMo (sandbox), mua chương VIP với ACID transaction, chia doanh thu tự động 60% tác giả / 40% sàn.
- **Trải nghiệm đọc:** Tùy chỉnh giao diện (màu nền, font, cỡ chữ, khoảng cách), TTS tiếng Việt với Audio Player.
- **Phân phối & Gợi ý:** Trending Score (7 ngày), Content-based Filtering theo thể loại/từ khóa.
- **Quản trị:** Dashboard thống kê, quản lý người dùng/nội dung/tài chính, xử lý báo cáo vi phạm và khiếu nại.

**d. Xác định yêu cầu phi chức năng (Non-functional Requirements)**

- **Bảo mật:** Session-based authentication với `HttpOnly=true`, `SameSite=Lax`. BCrypt (độ mạnh 12) cho mật khẩu. Spring Security phân quyền theo vai trò (ROLE_ADMIN, ROLE_AUTHOR, ROLE_USER). Phòng chống SQL Injection qua JPA parameterized queries.
- **Toàn vẹn dữ liệu:** ACID compliance cho mọi giao dịch tài chính thông qua `@Transactional` annotation.
- **Hiệu năng:** Lazy loading ảnh (Intersection Observer API) cho truyện tranh. ImageKit CDN cho phân phối ảnh tốc độ cao. AI Service chạy độc lập, không block luồng nghiệp vụ chính.

#### 6.1.2. Nghiên cứu công nghệ và thiết kế hệ thống

**Kiến trúc Backend (Spring Boot):**

Hệ thống RESTful API với mô hình Controller – Service – Repository. Spring Boot xử lý toàn bộ business logic: xác thực, phân quyền, thanh toán, gợi ý, thông báo. Gọi AI Service qua HTTP cho các tác vụ kiểm duyệt nặng. Gọi ImageKit API để lưu trữ ảnh.

Các Controller chính: `AuthController`, `PublicComicController`, `AuthorWorkspaceController`, `WalletController`, `InteractionController`, `AdminController`, `LibraryController`, `NotificationController`, `AuthorAnalyticsController`.

**Kiến trúc AI Service (Python Flask):**

Microservice độc lập xử lý: (1) PhoBERT embedding qua thư viện `sentence-transformers` – tính cosine similarity để phát hiện đạo văn ngữ nghĩa; (2) pHash qua thư viện `ImageHash` – tính Hamming Distance để phát hiện ảnh tái đăng; (3) N-gram Jaccard Similarity – phát hiện trùng lặp từ vựng. Kết quả phân loại 3 mức: `APPROVED`, `PENDING_REVIEW`, `REJECTED`.

**Kiến trúc cơ sở dữ liệu (MySQL):**

25 bảng phân nhóm theo chức năng: người dùng & tài chính (users, user_wallets, wallet_transactions, withdrawal_requests), nội dung (published_comics, published_chapters, published_chapter_pages, author_drafts), tương tác (chapter_comments, comic_ratings, published_follows, chapter_unlocks, donations), kiểm duyệt (content_reports, report_audit_logs, report_appeals, chapter_embeddings, page_phashes).

**Kiến trúc Frontend (ReactJS):**

Single Page Application (SPA) bằng ReactJS 18 + Vite. React Router DOM cho client-side routing. Axios cho HTTP client. Phát triển đồng nhất 3 phân hệ: giao diện đọc truyện (Độc giả), Studio Sáng tác (Tác giả), Admin Dashboard (Quản trị viên).

**Công nghệ lưu trữ và thanh toán:**

- ImageKit CDN: lưu trữ và phân phối ảnh bìa, ảnh trang truyện tranh, avatar người dùng.
- VnPay (sandbox): tạo URL thanh toán với HMAC-SHA512 signature.
- MoMo (sandbox): thanh toán ví điện tử di động với HMAC-SHA256 signature.
- Zalo AI TTS: chuyển đổi văn bản thành giọng nói tiếng Việt.

#### 6.1.3. Phát triển tính năng sáng tác và quản lý nội dung

- **Truyện chữ:** Rich Text Editor với đầy đủ công cụ định dạng (bold, italic, font family, font size, color, text-align, letter spacing). Nội dung lưu dạng HTML có cấu trúc. Tác giả có thể Lưu nháp hoặc Xuất bản (kích hoạt pipeline kiểm duyệt AI).
- **Truyện tranh:** Upload nhiều ảnh cùng lúc (drag & drop), tự động sắp xếp thứ tự, preview thumbnail. Ảnh upload lên ImageKit CDN trước khi lưu DB.
- **Thiết lập chương VIP:** Tác giả đặt giá chương hoặc để miễn phí.
- **Thống kê tác giả:** Biểu đồ lượt xem, doanh thu, bình luận theo thời gian. Danh sách chương với trạng thái kiểm duyệt.

#### 6.1.4. Phát triển tính năng đọc và tương tác

- **Trải nghiệm đọc:** Tùy chỉnh màu nền (Sáng/Tối/Vàng giấy/Kem), font (Lora/Arial/Georgia), cỡ chữ (14–24px), khoảng cách dòng (1.4–2.0), chiều rộng cột (600–900px). Tất cả lưu vào `localStorage`.
- **TTS (AI kể chuyện):** Tích hợp Zalo AI TTS, phát audio .mp3 qua HTML5 Audio Player với Play/Pause, tua 15 giây, tốc độ đọc (0.75x/1x/1.25x/1.5x).
- **Truyện tranh:** Lazy loading ảnh (Intersection Observer API), cuộn dọc liên tục.
- **Tương tác cộng đồng:** Bình luận tại chương, đánh giá sao (1–5) + review text, tặng quà (donate Xu) cho tác giả, theo dõi truyện/tác giả.

#### 6.1.5. Phát triển hệ thống thương mại hóa (ví và thanh toán)

**Luồng nạp tiền VnPay/MoMo:**

1. Backend tạo URL thanh toán với signature (HMAC-SHA512 cho VnPay, HMAC-SHA256 cho MoMo).
2. Frontend redirect người dùng đến trang thanh toán của cổng.
3. Sau khi thanh toán, cổng redirect về Backend callback endpoint.
4. Backend verify signature, cập nhật balance và ghi `WalletTransaction`.

**Luồng mua chương VIP (ACID):** Kiểm tra số dư → Trừ Xu người đọc → Cộng 60% vào ví tác giả → Ghi 2 `WalletTransaction` → Tạo `ChapterUnlock` – tất cả trong `@Transactional`, rollback toàn bộ nếu bất kỳ bước nào thất bại.

**Cấu hình gói nạp Xu:**

| Gói | Giá VND | Xu nhận | Bonus |
|-----|---------|---------|-------|
| Starter | 10.000 | 100 | 0% |
| Basic | 50.000 | 550 | 10% |
| Premium | 100.000 | 1.200 | 20% |
| VIP | 200.000 | 2.600 | 30% |

#### 6.1.6. Triển khai hệ thống kiểm duyệt bản quyền và nội dung AI

**Luồng truyện chữ – Lớp 1 (phát hiện đạo văn/reup):**

1. Tiền xử lý: chuẩn hóa Unicode NFC, loại khoảng trắng dư thừa.
2. Tách văn bản thành các đoạn ≥ 30 từ (`split_paragraphs`).
3. PhoBERT embedding (model `keepitreal/vietnamese-sbert` qua `sentence-transformers`): encode từng đoạn thành vector đã normalize.
4. Tính cosine similarity với toàn bộ embedding đã lưu trong `chapter_embeddings` (RAM cache + MySQL).
5. Similarity ≥ 90% → `REUP`; 75–90% → `SUSPICIOUS`; < 75% → `CLEAN` (lưu embedding mới vào DB).

**Luồng truyện chữ – Lớp 2 (phát hiện nội dung vi phạm ngôn ngữ):**

1. Gọi **Google Perspective API** (nếu có API key): phân tích TOXICITY, SEVERE_TOXICITY, SEXUALLY_EXPLICIT, THREAT – trả về điểm 0–1 cho từng thuộc tính.
2. Fallback (khi không có Perspective API): **Keyword-based phân tầng**:
   - **HARD keywords** (xuất hiện 1 lần = vi phạm nghiêm trọng, điểm ≥ 0.9): "lật đổ chính quyền", "kích động bạo loạn", "tuyên truyền chống", "việt tân", "fulro", "khiêu dâm", "đồi trụy".
   - **SOFT keywords** (tính theo mật độ / 1000 từ): "giết người", "khủng bố", "thảm sát", "phản động", "sex"... Nếu phát hiện **ngữ cảnh hư cấu** (võ thuật, kiếm hiệp, ma pháp) thì giảm 60% điểm để không phạt nhầm tiểu thuyết hành động.
3. Score ≥ 0.75 → `VIOLATION`; 0.45–0.75 → `SUSPICIOUS`; < 0.45 → `CLEAN`.

**Quyết định tổng hợp (truyện chữ):** Lớp 1 = REUP **hoặc** Lớp 2 = VIOLATION → `REJECTED`; bất kỳ lớp nào = SUSPICIOUS → `PENDING_REVIEW`; cả hai CLEAN → `APPROVED`.

**Luồng truyện tranh – Lớp 1 (pHash reup):**

1. pHash (Discrete Cosine Transform qua `ImageHash`): tính fingerprint 64-bit mỗi trang.
2. Tính Hamming Distance với toàn bộ pHash lưu trong `page_phashes`.
3. Distance ≤ 10 → trang trùng; tỷ lệ trang trùng ≥ 30% → `REUP`; 15–30% → `SUSPICIOUS`.

**Luồng truyện tranh – Lớp 2 (NSFW / nội dung khiêu dâm):**

1. **CLIP zero-shot** (model `openai/clip-vit-base-patch32`) được tích hợp trong code để phân loại ảnh theo 2 nhãn văn bản: "explicit sexual content nudity pornography hentai adult" vs "safe content manga anime cartoon family friendly normal".
2. **Hạn chế thực tế:** CLIP được huấn luyện chủ yếu trên ảnh thật nên hiệu quả phát hiện NSFW trong ảnh manga/anime phong cách vẽ tay còn hạn chế. Ngoài ra model hiện gặp lỗi tương thích trên môi trường Windows nên **bị vô hiệu hóa** (`check_anime_nsfw` trả về `"skipped"`).
3. Hệ quả: khi Lớp 2 không thể chạy, chương tranh bị chuyển sang trạng thái `PENDING` để **Admin duyệt thủ công** – đây là biện pháp an toàn tránh bỏ sót vi phạm.
4. Đây là điểm cần cải thiện trong tương lai: thay thế CLIP bằng model chuyên biệt cho anime NSFW (ví dụ: `deepghs/anime_real_cls` hoặc các model fine-tuned trên dataset hentai/manga).

**Phân loại và hành động (tổng hợp):**

| Mức độ | Điều kiện | Hành động |
|--------|-----------|-----------|
| An toàn | Cả 2 lớp CLEAN | Tự động APPROVED, hiển thị ngay |
| Nghi ngờ | Bất kỳ lớp nào SUSPICIOUS | PENDING_REVIEW, Admin duyệt thủ công |
| Vi phạm nghiêm trọng | Lớp 1 REUP hoặc Lớp 2 VIOLATION | Tự động REJECTED, thông báo tác giả |

#### 6.1.7. Phát triển Admin Dashboard và hệ thống gợi ý

**Admin Dashboard:**

- Tab Tổng quan: thống kê tổng hợp (người dùng mới, doanh thu, truyện mới, báo cáo chờ).
- Tab Nội dung: duyệt nội dung `PENDING_REVIEW`, ẩn/xóa vi phạm, quản lý truyện/chương.
- Tab Người dùng: danh sách tài khoản, khóa/mở khóa.
- Tab Báo cáo: xử lý báo cáo vi phạm (RESOLVED/DISMISSED), xem xét khiếu nại (Appeals).
- Tab Tài chính: lịch sử giao dịch, duyệt yêu cầu rút tiền.

**Hệ thống gợi ý:**

- **Trending Score:** `Score = Views×1 + Comments×3 + Ratings×5 + VIP_Unlocks×10`. Cửa sổ 7 ngày. Truyện tăng trưởng đột biến xuất hiện ở "Top Thịnh hành".
- **Content-based Filtering:** Lưu vết thể loại/từ khóa của truyện người dùng đọc nhiều nhất. Gợi ý truyện có vector thể loại tương đồng ở mục "Có thể bạn sẽ thích".

#### 6.1.8. Kiểm thử hệ thống

- Kiểm thử chức năng (Manual Testing) toàn bộ 18 trường hợp kiểm thử chính bao gồm: xác thực, xuất bản nội dung sạch/đạo văn, thanh toán VnPay/MoMo, mua chương VIP đủ/không đủ số dư, phân quyền API, khóa tài khoản, TTS.
- Kiểm thử bảo mật: phân quyền endpoint (USER gọi API ADMIN → 403 Forbidden), BCrypt password hashing.
- Kiểm thử ACID: rollback giao dịch khi thanh toán thất bại.

---

### 6.2. Các công việc và các bước thực hiện để đạt được mục tiêu

#### 6.2.1. Phân tích và thiết kế hệ thống

- Xác định phạm vi, đối tượng người dùng và yêu cầu chức năng/phi chức năng từ kết quả phân tích nền tảng đối thủ.
- Thiết kế cơ sở dữ liệu quan hệ (MySQL) với 25 bảng phân nhóm theo chức năng: người dùng & tài chính, nội dung, tương tác, kiểm duyệt.
- Thiết kế kiến trúc đa tầng: Frontend (ReactJS SPA) ↔ Backend (Spring Boot REST API) ↔ AI Service (Python Flask) ↔ Database (MySQL) ↔ Storage (ImageKit CDN).
- Thiết kế sơ đồ Use Case, Activity Diagram cho các luồng nghiệp vụ cốt lõi: xuất bản chương, mua chương VIP, kiểm duyệt AI.
- Thiết kế giao diện (UI/UX) cho 3 phân hệ: Đọc truyện (Độc giả), Studio Sáng tác (Tác giả), Admin Dashboard.

#### 6.2.2. Phát triển Backend (Spring Boot)

- Xây dựng hệ thống xác thực bằng HTTP Session + Spring Security (BCrypt độ mạnh 12), phân quyền 3 cấp (ROLE_USER / ROLE_AUTHOR / ROLE_ADMIN).
- Lập trình các Controller, Service, Repository theo mô hình Controller–Service–Repository cho toàn bộ nghiệp vụ.
- Tích hợp cổng thanh toán VnPay (HMAC-SHA512) và MoMo (HMAC-SHA256) ở chế độ Sandbox.
- Xây dựng hệ thống ví điện tử nội bộ (Xu) với ACID transaction (`@Transactional`), cơ chế chia doanh thu tự động 60/40.
- Tích hợp ImageKit CDN cho upload và phân phối ảnh.

#### 6.2.3. Phát triển Frontend (ReactJS)

- Xây dựng Single Page Application (SPA) bằng ReactJS 18 + Vite + React Router DOM.
- Phát triển phân hệ Đọc truyện: tùy chỉnh giao diện đọc (font/màu/cỡ chữ/khoảng cách), lazy loading ảnh, tích hợp TTS Zalo AI với Audio Player.
- Phát triển phân hệ Studio Sáng tác: Rich Text Editor cho truyện chữ, drag & drop upload ảnh hàng loạt cho truyện tranh, biểu đồ thống kê doanh thu.
- Phát triển Admin Dashboard: thống kê tổng quan, quản lý nội dung/người dùng/tài chính, xử lý báo cáo vi phạm.

#### 6.2.4. Phát triển AI Service (Python Flask)

- Thiết lập Python Flask microservice chạy độc lập trên port 5000.
- Tích hợp mô hình PhoBERT (`keepitreal/vietnamese-sbert` qua `sentence-transformers`) cho phát hiện đạo văn ngữ nghĩa.
- Cài đặt Google Perspective API (TOXICITY, SEVERE_TOXICITY, SEXUALLY_EXPLICIT, THREAT) và bộ từ khóa HARD/SOFT fallback cho kiểm duyệt nội dung vi phạm ngôn ngữ.
- Tích hợp pHash (`ImageHash`) cho phát hiện ảnh tái đăng truyện tranh; CLIP zero-shot cho phát hiện NSFW.
- Xây dựng RAM cache + MySQL persistent cho chapter_embeddings và page_phashes.
- Kết nối AI Service với Backend Spring Boot qua HTTP POST.

#### 6.2.5. Kiểm thử và hoàn thiện

- Kiểm thử chức năng toàn bộ 18 trường hợp kiểm thử chính (xác thực, thanh toán, kiểm duyệt AI, phân quyền, ACID transaction).
- Kiểm thử hiệu năng AI Service: đo thời gian xử lý trung bình mỗi chương/trang ảnh.
- Phát hiện và sửa lỗi, tối ưu giao diện người dùng trên các độ phân giải khác nhau.
- Hoàn thiện báo cáo tiểu luận và tài liệu kỹ thuật.

---

## 7. Thời gian thực hiện

Kéo dài một học kỳ chính của năm học (tháng 01/2025 – 06/2025).

| Giai đoạn | Thời gian | Công việc |
|-----------|-----------|-----------|
| Phân tích & Thiết kế | T1–T2/2025 | Khảo sát, thiết kế DB 25 bảng, thiết kế API |
| Lập trình Backend | T2–T3/2025 | Spring Boot REST API, Spring Security, thanh toán |
| Lập trình Frontend | T3–T4/2025 | ReactJS SPA, Studio Sáng tác, giao diện đọc |
| Tích hợp AI Service | T4–T5/2025 | Python Flask, PhoBERT, pHash, kết nối Backend |
| Kiểm thử & Hoàn thiện | T5–T6/2025 | Kiểm thử, sửa lỗi, viết báo cáo |

---

## 8. Sản phẩm của đề tài

Sản phẩm là ứng dụng web **TopTruyen** – nền tảng trực tuyến hoàn chỉnh với 8 phân hệ chức năng:

### 8.1. Phân hệ quản lý tài khoản

- **Đăng ký/Đăng nhập:** Đăng ký bằng Email/Password (BCrypt hash độ mạnh 12). Xác thực bằng HTTP Session (`HttpOnly=true`, `SameSite=Lax`, timeout 7 ngày). Phân quyền 3 cấp: ROLE_USER / ROLE_AUTHOR / ROLE_ADMIN.
- **Quản lý hồ sơ:** Chỉnh sửa avatar (lưu trên ImageKit), tên hiển thị, giới thiệu. Hồ sơ tác giả hiển thị danh sách truyện, số người theo dõi, tổng lượt đọc.

### 8.2. Phân hệ Studio Sáng tác (Tác giả)

- **Quản lý truyện:** Tạo/sửa/xóa truyện. Chọn loại (TEXT_NOVEL/COMIC), thể loại, trạng thái (ONGOING/COMPLETED/PAUSED), upload bìa.
- **Soạn thảo chương truyện chữ:** Rich Text Editor (bold, italic, font, size, color, align). Lưu nháp hoặc Xuất bản (kích hoạt AI kiểm duyệt).
- **Upload chương truyện tranh:** Drag & drop nhiều ảnh, preview, sắp xếp thứ tự trang. Upload lên ImageKit trước khi lưu DB.
- **Thiết lập VIP:** Đặt giá chương (1–999 Xu) hoặc miễn phí.
- **Thống kê:** Biểu đồ lượt xem, doanh thu, bình luận theo thời gian thực.
- **Bài đăng cộng đồng:** Tác giả đăng bài cập nhật cho fan theo dõi.

### 8.3. Phân hệ Đọc và Tương tác (Độc giả)

- **Truyện chữ:** Tùy chỉnh màu nền (Sáng/Tối/Vàng giấy/Kem), font (Lora/Arial/Georgia), cỡ chữ (14–24px), khoảng cách dòng (1.4–2.0), chiều rộng cột đọc. Tất cả lưu localStorage.
- **TTS – AI kể chuyện:** Zalo AI TTS → file .mp3 → HTML5 Audio Player (Play/Pause, tua 15s, tốc độ 0.75x–1.5x).
- **Truyện tranh:** Lazy loading (Intersection Observer), cuộn dọc liên tục, responsive theo viewport.
- **Tương tác:** Bình luận chương, đánh giá sao + review text, tặng quà Xu cho tác giả, theo dõi truyện/tác giả.

### 8.4. Phân hệ Thương mại hóa (Ví & Giao dịch)

- **Ví điện tử nội bộ:** Hiển thị số dư Xu. Lịch sử giao dịch chi tiết (loại, số tiền, thời gian).
- **Nạp tiền:** VnPay (thẻ ngân hàng, HMAC-SHA512) và MoMo (ví di động, HMAC-SHA256) – sandbox mode.
- **Mua chương VIP:** ACID transaction: trừ Xu người đọc + cộng 60% vào ví tác giả + cấp quyền đọc.
- **Rút tiền:** Tác giả gửi yêu cầu, Admin duyệt và ghi nhận thanh toán.

### 8.5. Phân hệ Kiểm duyệt bản quyền và nội dung AI (2 lớp × 2 định dạng)

**Truyện chữ:**
- **Lớp 1 – Phát hiện đạo văn/reup:** PhoBERT sentence embedding (cosine similarity). Ngưỡng: < 75% (CLEAN), 75–90% (SUSPICIOUS), ≥ 90% (REUP). Lưu embedding vào `chapter_embeddings` (RAM + MySQL).
- **Lớp 2 – Phát hiện nội dung vi phạm:** Google Perspective API (TOXICITY, SEVERE_TOXICITY, SEXUALLY_EXPLICIT, THREAT); fallback keyword HARD/SOFT (phân tầng mật độ, nhận diện ngữ cảnh hư cấu để tránh phạt nhầm). Phát hiện nội dung phản động, gây thù địch, khiêu dâm.

**Truyện tranh:**
- **Lớp 1 – Phát hiện tái đăng ảnh:** pHash (Hamming Distance ≤ 10 → trùng, tỷ lệ trang trùng ≥ 30% → REUP). Lưu pHash vào `page_phashes` (RAM + MySQL).
- **Lớp 2 – Phát hiện ảnh NSFW:** CLIP zero-shot classification (openai/clip-vit-base-patch32) phân loại "safe" vs "explicit/nudity".

**Quyết định tổng hợp:** REUP hoặc VIOLATION → `REJECTED`; SUSPICIOUS → `PENDING_REVIEW` (Admin duyệt); cả hai CLEAN → `APPROVED`.

**Thời gian xử lý:** ~2–3 giây/chương text, ~1 giây/trang ảnh.

### 8.6. Phân hệ Tìm kiếm và Gợi ý

- **Tìm kiếm nâng cao:** Theo tên, thể loại, trạng thái, kiểu nội dung, lọc nhiều điều kiện.
- **Bảng xếp hạng:** Top lượt xem, Top doanh thu, Top mới nổi (Trending Score 7 ngày).
- **Gợi ý Content-based:** Vector thể loại từ lịch sử đọc → đề xuất "Có thể bạn sẽ thích".

### 8.7. Phân hệ Thư viện cá nhân

- Lịch sử đọc với trạng thái chương cuối đọc.
- Tủ sách: truyện/tác giả đang theo dõi, nhận thông báo khi có chương mới.

### 8.8. Phân hệ Quản trị viên (Admin Dashboard)

- **Tổng quan:** Thống kê tổng hợp (người dùng mới, doanh thu, truyện mới, báo cáo chờ).
- **Nội dung:** Duyệt nội dung PENDING_REVIEW, ẩn/xóa vi phạm, quản lý truyện/chương/thể loại.
- **Người dùng:** Danh sách tài khoản, khóa/mở khóa.
- **Báo cáo:** Xử lý báo cáo vi phạm (RESOLVED/DISMISSED), xem xét Appeals (khiếu nại). Toàn bộ hành động ghi vào `report_audit_logs`.
- **Tài chính:** Lịch sử giao dịch toàn hệ thống, duyệt yêu cầu rút tiền của tác giả.

---

## 9. Tài liệu tham khảo

### 9.1. Bài đăng tạp chí

1. Nguyen, D. Q., Nguyen, A. T., & Nguyen, A. T. N. (2020). PhoBERT: Pre-trained language models for Vietnamese. *Findings of EMNLP 2020*, pp. 1037–1042.

2. Nguyen, T. H., & Tran, V. P. (2023). Factors Affecting Users' Willingness to Pay for Online Digital Content in Vietnam. *Journal of Economics and Development*, Vol. 25, No. 2, 2023, pp. 15–30.

3. Zhang, Y., & Liu, Q. (2021). Recommendation Systems for Online Literature: A Survey. *International Journal of Computer Applications*, Vol. 180, No. 5, 2021, pp. 12–20.

4. Smith, J. R. (2020). Digital Rights Management (DRM) Architectures for Electronic Publishing. *ACM Computing Surveys*, Vol. 52, No. 3, 2020, pp. 1–25.

### 9.2. Bài báo cáo hội nghị

5. Le, D. K., & Pham, H. N. (2022). Designing Scalable Microservices Architecture for High-Traffic Content Platforms. *Proceedings of the 2022 IEEE International Conference on Web Services (ICWS)*, Barcelona, Spain, July 2022.

6. Gionis, A., Indyk, P., & Motwani, R. (1999). Similarity Search in High Dimensions via Hashing. *Proceedings of the 25th International Conference on Very Large Data Bases (VLDB)*, Edinburgh, UK, pp. 518–529.

### 9.3. Sách

7. Craig Walls (2021). *Spring Boot in Action*, 6th Edition. Manning Publications, New York, USA.

8. Paul DuBois (2019). *MySQL (5th Edition) (Developer's Library)*. Addison-Wesley Professional, Boston, USA.

9. Alex Banks & Eve Porcello (2020). *Learning React: Modern Patterns for Developing React Apps*, 2nd Edition. O'Reilly Media, Sebastopol, USA.

10. Martin Kleppmann (2017). *Designing Data-Intensive Applications*. O'Reilly Media, Sebastopol, USA.

### 9.4. Website

11. Spring Projects – Spring Boot. Tài liệu chính thức Spring Boot. Địa chỉ: https://spring.io/projects/spring-boot, truy cập ngày 01/06/2025.

12. MySQL Documentation. Hướng dẫn sử dụng MySQL. Địa chỉ: https://dev.mysql.com/doc/, truy cập ngày 01/06/2025.

13. React Documentation. Tài liệu chính thức ReactJS. Địa chỉ: https://react.dev/, truy cập ngày 01/06/2025.

14. VNPAY Sandbox for Developers. Tài liệu tích hợp cổng thanh toán VnPay. Địa chỉ: https://sandbox.vnpayment.vn/apis/, truy cập ngày 01/06/2025.

15. ImageKit Documentation. Tài liệu tích hợp ImageKit CDN. Địa chỉ: https://docs.imagekit.io/, truy cập ngày 01/06/2025.

16. Sentence-Transformers – PhoBERT. Thư viện embedding tiếng Việt. Địa chỉ: https://huggingface.co/VoVanPhuc/sup-SimCSE-VietNamese-phobert-base, truy cập ngày 01/06/2025.

---

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**Giảng viên hướng dẫn**&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**Sinh viên thực hiện**

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;*(Ký và ghi rõ họ tên)*&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;*(Ký và ghi rõ họ tên)*
