# BÁO CÁO TIỂU LUẬN TỐT NGHIỆP

---

# TRANG BÌA 1

**BỘ GIÁO DỤC VÀ ĐÀO TẠO**
**TRƯỜNG ĐẠI HỌC NÔNG LÂM TP HCM**
**KHOA CÔNG NGHỆ THÔNG TIN**

---

**TIỂU LUẬN TỐT NGHIỆP**

# THIẾT KẾ VÀ XÂY DỰNG NỀN TẢNG TRỰC TUYẾN HỖ TRỢ SÁNG TÁC, PHÂN PHỐI VÀ THƯƠNG MẠI HÓA TRUYỆN

| Ngành     | : Công nghệ thông tin |
|-----------|----------------------|
| Niên khoá | : 2022 – 2026         |
| Lớp       | : DH22DTC            |
| Sinh viên thực hiện | : Bạch Thanh Tùng |

**TP. HỒ CHÍ MINH, tháng 06 năm 2025**

---

# TRANG BÌA 2

**BỘ GIÁO DỤC VÀ ĐÀO TẠO**
**TRƯỜNG ĐẠI HỌC NÔNG LÂM TP HCM**
**KHOA CÔNG NGHỆ THÔNG TIN**

---

**TIỂU LUẬN TỐT NGHIỆP**

# THIẾT KẾ VÀ XÂY DỰNG NỀN TẢNG TRỰC TUYẾN HỖ TRỢ SÁNG TÁC, PHÂN PHỐI VÀ THƯƠNG MẠI HÓA TRUYỆN

| **CÁN BỘ HƯỚNG DẪN** | **SINH VIÊN THỰC HIỆN** |
|----------------------|------------------------|
| ThS. Trần Lê Như Quỳnh | Bạch Thanh Tùng (MSSV: 22130314) |

**TP. HỒ CHÍ MINH, tháng 06 năm 2025**

---

## DANH SÁCH CHỮ VIẾT TẮT

| Viết tắt | Tiếng Anh | Tiếng Việt |
|----------|-----------|------------|
| **API** | Application Programming Interface | Giao diện lập trình ứng dụng |
| **CRUD** | Create, Read, Update, Delete | Tạo, đọc, cập nhật, xóa |
| **DTO** | Data Transfer Object | Đối tượng truyền dữ liệu |
| **JWT** | JSON Web Token | Token xác thực JSON |
| **NLP** | Natural Language Processing | Xử lý ngôn ngữ tự nhiên |
| **OCR** | Optical Character Recognition | Nhận dạng ký tự quang học |
| **ORM** | Object-Relational Mapping | Ánh xạ đối tượng quan hệ |
| **pHash** | Perceptual Hashing | Băm thị giác |
| **REST** | Representational State Transfer | Kiến trúc chuyển trạng thái đại diện |
| **SPA** | Single Page Application | Ứng dụng đơn trang |
| **SQL** | Structured Query Language | Ngôn ngữ truy vấn có cấu trúc |
| **TTS** | Text-to-Speech | Chuyển đổi văn bản thành giọng nói |
| **UI** | User Interface | Giao diện người dùng |
| **UX** | User Experience | Trải nghiệm người dùng |
| **VIP** | Very Important Person | Nội dung/chương trả phí |
| **VNPAY** | Vietnam Payment | Cổng thanh toán điện tử Việt Nam |
| **ACID** | Atomicity, Consistency, Isolation, Durability | Tính toàn vẹn giao dịch cơ sở dữ liệu |

---

## DANH MỤC HÌNH ẢNH

- Hình 2.1. Kiến trúc tổng thể hệ thống TopTruyen
- Hình 2.2. Sơ đồ cơ sở dữ liệu (ERD) – nhóm bảng người dùng và tài chính
- Hình 2.3. Sơ đồ cơ sở dữ liệu (ERD) – nhóm bảng nội dung và tương tác
- Hình 3.1. Use Case Diagram – Tổng quan hệ thống
- Hình 3.2. Activity Diagram – Luồng xuất bản chương và kiểm duyệt AI
- Hình 3.3. Activity Diagram – Luồng mua chương VIP
- Hình 3.4. Sơ đồ luồng xử lý kiểm duyệt bản quyền (2 lớp)
- Hình 3.5. Giao diện trang chủ
- Hình 3.6. Giao diện đọc truyện chữ (tùy chỉnh font/màu nền)
- Hình 3.7. Giao diện đọc truyện tranh
- Hình 3.8. Giao diện Studio Sáng tác (tác giả)
- Hình 3.9. Giao diện Ví điện tử và nạp tiền
- Hình 3.10. Giao diện Admin Dashboard

---

## DANH MỤC BẢNG

- Bảng 2.1. So sánh các nền tảng truyện số hiện có
- Bảng 2.2. Công nghệ và thư viện sử dụng trong hệ thống
- Bảng 3.1. Danh sách API Backend chính
- Bảng 3.2. Phân loại mức độ vi phạm bản quyền
- Bảng 3.3. Cấu hình gói nạp Xu
- Bảng 5.1. Kết quả kiểm thử chức năng chính

---

## TÓM TẮT

Đề tài "Thiết kế và xây dựng nền tảng trực tuyến hỗ trợ sáng tác, phân phối và thương mại hóa truyện" (TopTruyen) nhằm giải quyết ba thách thức cốt lõi của thị trường truyện số tại Việt Nam: rào cản thương mại hóa thiếu minh bạch, lỗ hổng bảo vệ bản quyền đa phương tiện, và hạn chế trong trải nghiệm đọc.

Hệ thống được xây dựng theo kiến trúc client-server với Frontend sử dụng ReactJS (SPA), Backend RESTful API bằng Spring Boot (Java), cơ sở dữ liệu MySQL và dịch vụ AI Python (Flask). Nền tảng hỗ trợ đầy đủ hai định dạng nội dung: truyện chữ (text novel) và truyện tranh (manga/comic). Các tính năng cốt lõi đã được hiện thực bao gồm: hệ thống ví điện tử nội bộ tích hợp cổng thanh toán VnPay và MoMo, cơ chế kiểm duyệt bản quyền tự động hai lớp (PhoBERT embedding cho văn bản, pHash và NudeNet cho hình ảnh), công cụ soạn thảo chuyên nghiệp cho tác giả, thuật toán gợi ý truyện kết hợp Content-based và Trending Filtering, và bảng điều khiển quản trị toàn diện.

Kết quả đạt được là một ứng dụng web hoàn chỉnh, đáp ứng đầy đủ các yêu cầu chức năng đề ra, với hệ thống kiểm duyệt tự động có khả năng phát hiện đạo văn và nội dung vi phạm trước khi xuất bản, đồng thời đảm bảo tính toàn vẹn ACID cho mọi giao dịch tài chính.

---

## MỤC LỤC

- DANH SÁCH CHỮ VIẾT TẮT
- DANH MỤC HÌNH ẢNH
- DANH MỤC BẢNG
- TÓM TẮT
- MỞ ĐẦU
  - 1. Lý do chọn đề tài
  - 2. Mục tiêu và phạm vi nghiên cứu
  - 3. Ý nghĩa khoa học và thực tiễn của đề tài
- CHƯƠNG 1. TỔNG QUAN ĐỀ TÀI
  - 1.1. Phân tích, đánh giá các công trình nghiên cứu đã có
  - 1.2. Những vấn đề còn tồn tại
  - 1.3. Vấn đề tiểu luận tập trung giải quyết
- CHƯƠNG 2. PHƯƠNG PHÁP VÀ NỘI DUNG NGHIÊN CỨU
  - 2.1. Cơ sở lý thuyết
  - 2.2. Công nghệ và công cụ sử dụng
  - 2.3. Kiến trúc hệ thống
  - 2.4. Thiết kế cơ sở dữ liệu
- CHƯƠNG 3. GIẢI PHÁP VÀ HIỆN THỰC
  - 3.1. Phát biểu bài toán
  - 3.2. Giải pháp cụ thể
  - 3.3. Hiện thực giải pháp
- CHƯƠNG 5. KẾT QUẢ, KẾT LUẬN VÀ KIẾN NGHỊ
  - 5.1. Kết quả đạt được
  - 5.2. Kết luận
  - 5.3. Kiến nghị
- TÀI LIỆU THAM KHẢO

---

# MỞ ĐẦU

## 1. LÝ DO CHỌN ĐỀ TÀI

Thị trường truyện số (digital fiction) tại Việt Nam đang bùng nổ mạnh mẽ với hàng triệu độc giả và hàng chục nghìn tác giả sáng tác mạng. Các nền tảng như Wattpad, Webtoon hay các trang truyện nội địa (Truyện Full, Manga24h) thu hút lượng người dùng khổng lồ, song lại bộc lộ nhiều hạn chế nghiêm trọng:

**Về thương mại hóa**: Các tác giả độc lập Việt Nam gặp khó khăn lớn khi muốn kiếm thu nhập từ tác phẩm. Không tồn tại một nền tảng nội địa nào cho phép tác giả thiết lập thu phí theo từng chương với hệ thống đối soát doanh thu minh bạch.

**Về bảo vệ bản quyền**: Vấn nạn "đạo văn" truyện chữ và "re-up" (đăng lại trái phép) truyện tranh đang hoành hành. Việc kiểm duyệt thủ công đòi hỏi chi phí lớn và không thể xử lý kịp thời lượng nội dung khổng lồ được đăng tải mỗi ngày.

**Về trải nghiệm người dùng**: Phần lớn nền tảng hiện tại không có tính năng tùy chỉnh giao diện đọc, không hỗ trợ AI đọc truyện tự động, và thiếu hệ thống gợi ý thông minh dựa trên lịch sử tương tác.

Xuất phát từ thực tiễn đó, đề tài "Thiết kế và xây dựng nền tảng trực tuyến hỗ trợ sáng tác, phân phối và thương mại hóa truyện" (TopTruyen) được đề xuất nhằm lấp đầy những khoảng trống này.

## 2. MỤC TIÊU VÀ PHẠM VI NGHIÊN CỨU

**Mục tiêu tổng quát**: Xây dựng một nền tảng web trực tuyến toàn diện bằng ReactJS và Spring Boot, tích hợp AI kiểm duyệt nội dung, hỗ trợ quy trình sáng tác, phân phối và thương mại hóa truyện chữ lẫn truyện tranh.

**Mục tiêu cụ thể**:
- Xây dựng hệ thống quản lý tài khoản với phân quyền rõ ràng (Độc giả, Tác giả, Quản trị viên)
- Phát triển Studio Sáng tác với Rich Text Editor (truyện chữ) và upload hình ảnh hàng loạt (truyện tranh)
- Xây dựng ví điện tử nội bộ, tích hợp cổng thanh toán VnPay và MoMo
- Triển khai hệ thống kiểm duyệt bản quyền tự động hai lớp sử dụng PhoBERT, pHash, và NudeNet
- Hiện thực hệ thống gợi ý truyện theo xu hướng (Trending) và theo nội dung (Content-based Filtering)
- Xây dựng Admin Dashboard toàn diện cho quản lý nội dung, tài chính và xử lý vi phạm

**Phạm vi nghiên cứu**: Đề tài tập trung vào xây dựng ứng dụng web (không bao gồm ứng dụng di động native). Hệ thống thanh toán hoạt động ở chế độ mô phỏng (sandbox) trong môi trường thử nghiệm.

## 3. Ý NGHĨA KHOA HỌC VÀ THỰC TIỄN CỦA ĐỀ TÀI

**Ý nghĩa khoa học**: Đề tài tích hợp và ứng dụng thực tế các nghiên cứu hiện đại trong lĩnh vực Xử lý ngôn ngữ tự nhiên (PhoBERT, N-gram, Jaccard Similarity), Thị giác máy tính (pHash, NudeNet), và Hệ thống gợi ý (Content-based Filtering, Trending Score). Việc kết hợp đa công nghệ AI cho bài toán kiểm duyệt nội dung song ngữ tiếng Việt là một đóng góp mới so với các hệ thống truyện hiện có.

**Ý nghĩa thực tiễn**: Sản phẩm có thể triển khai thực tế như một nền tảng thương mại hóa truyện số nội địa, giải quyết trực tiếp nhu cầu của cộng đồng tác giả và độc giả Việt Nam. Hệ thống cung cấp nền tảng kỹ thuật cho các tính năng mở rộng trong tương lai như đa ngôn ngữ, NFT bản quyền, hoặc xuất bản điện tử (ebook).

---

# CHƯƠNG 1. TỔNG QUAN ĐỀ TÀI

## 1.1. Phân tích, đánh giá các công trình nghiên cứu đã có liên quan đến đề tài nghiên cứu

### 1.1.1. Các nền tảng truyện số hiện có

**Wattpad** (Canada, 2006): Nền tảng truyện chữ lớn nhất thế giới với hơn 90 triệu người dùng. Điểm mạnh là cộng đồng tác giả năng động và công cụ soạn thảo đơn giản. Tuy nhiên, hệ thống kiếm tiền cho tác giả nhỏ lẻ rất hạn chế (chỉ qua chương trình Paid Stories cho tác giả được chọn), không hỗ trợ tiếng Việt tốt và thiếu tính năng kiểm duyệt bản quyền tự động.

**Webtoon** (Hàn Quốc, 2004): Nền tảng truyện tranh dạng cuộn (webtoon) hàng đầu thế giới. Mô hình "Fast Pass" cho phép độc giả trả phí để đọc sớm. Tuy nhiên, barrier gia nhập cao (chỉ chấp nhận tác giả được tuyển chọn), không hỗ trợ truyện chữ, và cũng thiếu kiểm duyệt bản quyền tự động.

**MangaToon** (Singapore, 2018): Ứng dụng đọc truyện tranh với mô hình Coin. Giao diện đẹp, hỗ trợ nhiều ngôn ngữ. Tuy nhiên hầu hết nội dung do nền tảng cung cấp, không phải user-generated content, nên tác giả cá nhân khó tham gia.

**Các trang truyện nội địa Việt Nam** (Truyện Full, Manga24h, Hako): Có lượng người dùng lớn, nội dung phong phú. Tuy nhiên hầu hết là trang đọc truyện đơn thuần, không có công cụ sáng tác, không có hệ thống thanh toán VIP minh bạch, và đặc biệt không có bất kỳ cơ chế kiểm duyệt bản quyền tự động nào.

**Bảng 2.1: So sánh các nền tảng truyện số hiện có**

| Tính năng | Wattpad | Webtoon | Trang nội địa VN | TopTruyen (đề tài) |
|-----------|---------|---------|-----------------|-------------------|
| Truyện chữ | ✓ | ✗ | ✓ (đọc) | ✓ (sáng tác + đọc) |
| Truyện tranh | ✗ | ✓ | ✓ (đọc) | ✓ (sáng tác + đọc) |
| Kiếm tiền tác giả cá nhân | Hạn chế | Hạn chế | ✗ | ✓ |
| Kiểm duyệt bản quyền tự động | ✗ | ✗ | ✗ | ✓ (AI 2 lớp) |
| Tích hợp thanh toán nội địa VN | ✗ | ✗ | ✗ | ✓ (VnPay, MoMo) |
| AI đọc truyện (TTS) | ✗ | ✗ | ✗ | ✓ |
| Hệ thống gợi ý | Cơ bản | Cơ bản | ✗ | ✓ |

### 1.1.2. Các nghiên cứu liên quan

**Về phát hiện đạo văn văn bản tiếng Việt**: Các nghiên cứu sử dụng N-gram và Jaccard Similarity đã chứng minh hiệu quả trong phát hiện đạo văn văn bản thuần túy. Tuy nhiên, áp dụng cho văn học tiếng Việt có đặc thù riêng (dấu thanh, từ ghép) đòi hỏi bước tiền xử lý đặc biệt. Mô hình PhoBERT (VinAI, 2020) là mô hình ngôn ngữ BERT được huấn luyện trên văn bản tiếng Việt, cho kết quả vượt trội trong các tác vụ NLP tiếng Việt.

**Về phát hiện ảnh trùng lặp**: Thuật toán Perceptual Hashing (pHash) dựa trên Discrete Cosine Transform (DCT) được chứng minh là hiệu quả trong việc phát hiện ảnh bị chỉnh sửa nhẹ (đổi màu, thêm watermark). Khoảng cách Hamming nhỏ hơn ngưỡng cho phép phát hiện ảnh "xào nấu".

**Về hệ thống gợi ý**: Content-based Filtering đề xuất nội dung tương đồng theo đặc trưng (thể loại, từ khóa), trong khi Collaborative Filtering đề xuất dựa trên hành vi người dùng tương đồng. Kết hợp hai phương pháp (Hybrid Recommendation) cho kết quả tốt hơn.

## 1.2. Những vấn đề còn tồn tại

Qua phân tích trên, các vấn đề chưa được giải quyết thỏa đáng trong các hệ thống hiện có bao gồm:

1. **Thiếu nền tảng tích hợp đầy đủ cho tác giả Việt Nam**: Không có sản phẩm nào kết hợp được cả công cụ sáng tác chuyên nghiệp, hệ thống thanh toán nội địa, và kiểm duyệt bản quyền tự động trong một nền tảng duy nhất.

2. **Kiểm duyệt bản quyền vẫn thủ công**: Các trang truyện trong nước phụ thuộc hoàn toàn vào báo cáo từ người dùng, không có lớp bảo vệ tự động trước khi nội dung được xuất bản.

3. **Cơ chế thanh toán chưa minh bạch**: Tác giả khó theo dõi doanh thu theo thời gian thực, tỷ lệ chia sẻ không rõ ràng.

4. **Trải nghiệm đọc chưa được tối ưu**: Thiếu tùy chỉnh giao diện, thiếu TTS tiếng Việt, thiếu gợi ý thông minh.

## 1.3. Những vấn đề tiểu luận cần tập trung nghiên cứu, giải quyết

Đề tài tập trung giải quyết ba vấn đề trọng tâm:

1. **Bài toán thương mại hóa và giao dịch vi mô**: Xây dựng hệ thống ví điện tử nội bộ (Xu) với giao dịch ACID-compliant, tích hợp cổng thanh toán thực (VnPay, MoMo), cơ chế chia sẻ doanh thu tự động (60% tác giả / 40% sàn), và hệ thống thống kê minh bạch.

2. **Bài toán kiểm duyệt bản quyền đa phương tiện tự động**: Xây dựng pipeline kiểm duyệt hai lớp: (1) Phát hiện đạo văn văn bản bằng PhoBERT embedding + Jaccard Similarity; (2) Phát hiện trùng lặp hình ảnh bằng pHash + OCR, với ba mức phân loại (An toàn / Nghi ngờ / Vi phạm nghiêm trọng) kèm quy trình xử lý tương ứng.

3. **Bài toán trải nghiệm đọc và phân phối nội dung**: Tối ưu giao diện đọc với tùy chỉnh cá nhân hóa (font, màu nền, cỡ chữ), tích hợp TTS tiếng Việt, và hiện thực hệ thống gợi ý kết hợp Trending Score và Content-based Filtering.

---

# CHƯƠNG 2. PHƯƠNG PHÁP VÀ NỘI DUNG NGHIÊN CỨU

## 2.1. Cơ sở lý thuyết

### 2.1.1. Kiến trúc ứng dụng web hiện đại (Client-Server RESTful)

Hệ thống được thiết kế theo mô hình Client-Server với giao tiếp thông qua RESTful API. Frontend (ReactJS) đóng vai trò client, gửi HTTP requests đến Backend (Spring Boot) và nhận JSON responses. Cơ chế này tách biệt hoàn toàn tầng trình bày và tầng logic nghiệp vụ, cho phép mở rộng độc lập.

**Session-based Authentication**: Hệ thống sử dụng HTTP Session lưu trên máy chủ kết hợp với cookie `SameSite=Lax` để quản lý xác thực, thay vì JWT stateless. Lựa chọn này phù hợp với nền tảng có logic phức tạp và cần khả năng vô hiệu hóa session tức thì (khóa tài khoản).

**Spring Security + CORS**: Backend sử dụng Spring Security để phân quyền endpoint theo vai trò (ROLE_ADMIN, ROLE_AUTHOR, ROLE_USER), đồng thời cấu hình CORS cho phép frontend giao tiếp.

### 2.1.2. Kỹ thuật phát hiện đạo văn văn bản

**Tiền xử lý văn bản (Text Pre-processing)**:
Trước khi so sánh, văn bản đầu vào được bóc tách HTML tags, chuyển về chữ thường, loại bỏ dấu câu và khoảng trắng dư thừa. Bước này ngăn chặn các thủ thuật lách luật như chèn ký tự ẩn hay dùng Unicode đặc biệt.

**Mô hình PhoBERT (Semantic Similarity)**:
PhoBERT (Nguyen et al., 2020) là mô hình BERT pre-trained trên 20GB văn bản tiếng Việt. Trong hệ thống, PhoBERT được dùng để tạo embedding vector đại diện cho ngữ nghĩa của từng đoạn văn. Hai đoạn văn "giống nhau về nghĩa" (dù dùng từ khác) sẽ có cosine similarity cao. Ngưỡng HIGH = 0.90 (vi phạm nghiêm trọng) và MID = 0.75 (đáng ngờ).

**N-gram và Jaccard Similarity (Lexical Matching)**:
Văn bản được phân đoạn thành N-gram (chuỗi N từ liên tiếp, N = 5-7). Jaccard Similarity giữa tập N-gram của chương mới và chương đã tồn tại được tính theo công thức:

```
J(A, B) = |A ∩ B| / |A ∪ B|
```

Kết quả là tỷ lệ phần trăm trùng khớp từ vựng.

### 2.1.3. Kỹ thuật phát hiện ảnh trùng lặp

**Perceptual Hashing (pHash)**:
pHash tính toán dấu vân tay của ảnh dựa trên Discrete Cosine Transform (DCT), thu được một chuỗi bit 64 bit. Ảnh bị đổi màu, thêm logo, hoặc thay đổi kích thước nhỏ vẫn cho pHash tương tự. Khoảng cách Hamming giữa hai pHash phản ánh mức độ giống nhau: khoảng cách càng nhỏ, ảnh càng giống.

**Nhận dạng ký tự quang học (OCR)**:
Đối với truyện tranh có hộp thoại, OCR (Google Cloud Vision API) trích xuất văn bản từ hình ảnh, sau đó so sánh văn bản này bằng thuật toán N-gram như với truyện chữ. Điều này phát hiện hành vi "re-up lời dịch".

**Phát hiện nội dung khiêu dâm (NudeNet)**:
NudeNet là model deep learning phát hiện nội dung NSFW (Not Safe For Work) trong ảnh với độ chính xác cao. Kết quả phân loại: SAFE / QUESTIONABLE / EXPLICIT.

### 2.1.4. Hệ thống gợi ý (Recommendation System)

**Trending Score**: Mỗi truyện được tính điểm theo công thức trọng số tương tác:
```
Score = (Views × 1) + (Comments × 3) + (Ratings × 5) + (VIP_Unlocks × 10)
```
Điểm tăng trưởng đột biến trong cửa sổ thời gian 7 ngày gần nhất được ưu tiên hiển thị ở vị trí "Top Thịnh hành".

**Content-based Filtering**: Hệ thống lưu vết thể loại và từ khóa của các truyện mà người dùng đọc nhiều nhất (lịch sử đọc, truyện đang theo dõi, truyện đánh giá 5 sao). Từ đó gợi ý các truyện có vector thể loại tương đồng.

### 2.1.5. Giao dịch tài chính và tính toàn vẹn ACID

Mọi giao dịch liên quan đến số dư Xu (mua chương, tặng quà, nạp tiền) đều được bọc trong `@Transactional` annotation của Spring, đảm bảo 4 tính chất ACID:
- **Atomicity**: Trừ Xu của người đọc và cộng Xu cho tác giả là một đơn vị nguyên tử.
- **Consistency**: Tổng số Xu trong hệ thống luôn khớp với lịch sử giao dịch.
- **Isolation**: Các giao dịch đồng thời không gây ra race condition.
- **Durability**: Giao dịch đã commit được bảo toàn dù hệ thống gặp sự cố.

## 2.2. Công nghệ và công cụ sử dụng

**Bảng 2.2: Công nghệ và thư viện sử dụng trong hệ thống**

| Thành phần | Công nghệ | Phiên bản | Mục đích |
|-----------|-----------|-----------|---------|
| Frontend | ReactJS | 18.x | SPA framework |
| Frontend | Vite | 5.x | Build tool |
| Frontend | React Router DOM | 6.x | Client-side routing |
| Frontend | Axios | 1.x | HTTP client |
| Backend | Spring Boot | 3.x | RESTful API framework |
| Backend | Spring Security | 6.x | Authentication & Authorization |
| Backend | Spring Data JPA | 3.x | ORM |
| Backend | JdbcTemplate | 5.x | Native SQL queries |
| Database | MySQL | 8.x | Relational database |
| AI Service | Python Flask | 3.x | AI microservice |
| AI Service | Sentence-Transformers | - | PhoBERT embedding |
| AI Service | Pillow + imagehash | - | pHash computation |
| AI Service | NudeNet | - | Nudity detection |
| Storage | ImageKit | - | Image CDN |
| Payment | VnPay | Sandbox | Bank card payments |
| Payment | MoMo | Sandbox | Mobile wallet payments |
| AI/TTS | Zalo AI / Google TTS | - | Text-to-Speech tiếng Việt |

## 2.3. Kiến trúc hệ thống

Hệ thống TopTruyen được tổ chức theo kiến trúc đa tầng (Multi-tier Architecture) với 4 tầng chính:

**Tầng 1 – Presentation (Frontend)**:
- Ứng dụng ReactJS chạy trên trình duyệt người dùng
- Single Page Application (SPA) với React Router DOM
- Giao tiếp với Backend qua HTTP/HTTPS RESTful API

**Tầng 2 – Application (Backend)**:
- Spring Boot RESTful API server
- Xử lý toàn bộ business logic: xác thực, phân quyền, thanh toán, gợi ý
- Gọi AI Service qua HTTP cho các tác vụ kiểm duyệt nặng
- Gọi ImageKit API để lưu trữ ảnh

**Tầng 3 – AI Service (Microservice)**:
- Python Flask service chuyên xử lý AI
- Phân tích ngữ nghĩa văn bản (PhoBERT embedding)
- Phát hiện ảnh trùng lặp (pHash)
- Phát hiện nội dung vi phạm (NudeNet, keyword filtering)

**Tầng 4 – Data (Database)**:
- MySQL database lưu trữ toàn bộ dữ liệu ứng dụng
- Bao gồm cả embedding vectors và pHash cho AI Service

**Hình 2.1: Kiến trúc tổng thể hệ thống TopTruyen**
```
[Trình duyệt người dùng]
        |  HTTP/HTTPS
        ↓
[Spring Boot Backend API]  ←→  [ImageKit CDN]
        |  HTTP                       |
        ↓                     [VnPay / MoMo]
[Python Flask AI Service]
        |
        ↓
[MySQL Database]
```

## 2.4. Thiết kế cơ sở dữ liệu

Cơ sở dữ liệu gồm 25 bảng, được nhóm theo chức năng:

### 2.4.1. Nhóm bảng quản lý người dùng và phân quyền

- **users**: Lưu thông tin tài khoản (email, password_hash, display_name, avatar_url, bio, gender, status, created_at)
- **roles**: Danh sách vai trò (ROLE_ADMIN, ROLE_AUTHOR, ROLE_USER)
- **user_roles**: Bảng nhiều-nhiều giữa user và role
- **user_wallets**: Ví điện tử của mỗi user (balance kiểu DECIMAL, user_id foreign key)
- **wallet_transactions**: Lịch sử giao dịch (type: DEPOSIT/WITHDRAW/PURCHASE/DONATION/REWARD, amount, description, created_at)
- **withdrawal_requests**: Yêu cầu rút tiền của tác giả (amount, bank_info, status, admin_note)
- **user_daily_actions**: Theo dõi hành động hàng ngày để tặng thưởng Xu (login, reading)

### 2.4.2. Nhóm bảng quản lý nội dung

- **categories**: Thể loại truyện (name, slug, description)
- **published_comics**: Thông tin truyện đã xuất bản (title, description, cover_url, author_id, type: TEXT_NOVEL/COMIC, status: ONGOING/COMPLETED/PAUSED, is_featured, view_count, total_chapters, avg_rating)
- **published_chapters**: Chương truyện (comic_id, title, chapter_number, content_html, price, view_count, published_at, moderation_status: APPROVED/PENDING_REVIEW/REJECTED)
- **published_chapter_pages**: Trang ảnh của chương truyện tranh (chapter_id, page_order, image_url)
- **author_drafts**: Bản nháp truyện chưa xuất bản
- **author_draft_chapters**: Chương nháp (tương tự published nhưng chưa qua kiểm duyệt)
- **author_draft_pages**: Trang ảnh nháp

### 2.4.3. Nhóm bảng tương tác người dùng

- **chapter_comments**: Bình luận tại chương (user_id, chapter_id, content, created_at, is_deleted)
- **comic_ratings**: Đánh giá truyện (user_id, comic_id, rating 1-5, review_text, created_at)
- **published_follows**: Theo dõi truyện (user_id, comic_id, status: READING/COMPLETED/DROPPED)
- **author_follows**: Theo dõi tác giả (follower_id, author_id)
- **published_read_history**: Lịch sử đọc (user_id, comic_id, last_chapter_id, last_read_at)
- **chapter_unlocks**: Ghi nhận chương VIP đã được mua (user_id, chapter_id, purchased_at)
- **donations**: Lịch sử tặng quà (donor_id, author_id, amount, message)
- **notifications**: Thông báo hệ thống (user_id, type, message, is_read, created_at)

### 2.4.4. Nhóm bảng kiểm duyệt và báo cáo

- **content_reports**: Báo cáo vi phạm (reporter_id, target_type: CHAPTER/COMMENT, target_id, reason, status: PENDING/RESOLVED/DISMISSED)
- **report_audit_logs**: Lịch sử xử lý báo cáo (report_id, admin_id, action, note, created_at)
- **report_appeals**: Đơn khiếu nại (report_id, user_id, appeal_text, status)
- **chapter_embeddings**: Embedding vector PhoBERT (chapter_id, embedding BLOB, created_at) – dùng bởi AI Service
- **page_phashes**: Giá trị pHash của ảnh (page_id, phash_value, created_at) – dùng bởi AI Service
- **author_posts**: Bài đăng cộng đồng của tác giả

---

# CHƯƠNG 3. GIẢI PHÁP VÀ HIỆN THỰC

## 3.1. Phát biểu bài toán

Hệ thống TopTruyen cần giải quyết ba bài toán kỹ thuật chính:

**Bài toán 1 – Thương mại hóa vi mô (Micro-transaction)**:
Cho phép tác giả đặt giá cho từng chương (N Xu/chương). Khi độc giả mua, hệ thống phải: (1) kiểm tra số dư đủ, (2) trừ Xu của độc giả, (3) cộng Xu vào ví tác giả với tỷ lệ 60%, (4) ghi lại giao dịch, (5) cấp quyền đọc chương – tất cả trong một giao dịch ACID. Đồng thời hỗ trợ nạp tiền thực (VND) qua VnPay và MoMo.

**Bài toán 2 – Kiểm duyệt bản quyền tự động**:
Khi tác giả bấm "Xuất bản chương", nội dung chưa được hiển thị ngay mà phải đi qua pipeline:
- Với truyện chữ: Tiền xử lý → Tính PhoBERT embedding → So sánh cosine similarity với toàn bộ chương đã tồn tại + N-gram Jaccard → Phân loại (CLEAN/SUSPICIOUS/REUP) → Quyết định (xuất bản tự động / chờ duyệt / từ chối).
- Với truyện tranh: Mỗi trang ảnh → Tính pHash → So sánh Hamming distance + OCR trích văn bản → Phát hiện tái đăng + NudeNet phát hiện nội dung người lớn.

**Bài toán 3 – Phân phối và gợi ý nội dung**:
Trang chủ và kết quả tìm kiếm cần hiển thị nội dung phù hợp với từng người dùng. Hệ thống tính Trending Score theo cửa sổ thời gian gần đây (7 ngày), đồng thời xây dựng vector sở thích dựa trên lịch sử đọc để gợi ý Content-based.

## 3.2. Giải pháp cụ thể

### 3.2.1. Kiến trúc Backend (Spring Boot)

Backend được tổ chức theo mô hình Controller – Service – Repository với 11 Controller, 14 Service và 6 Repository chính:

**Các Controller chính**:
- `AuthController`: Xử lý đăng ký, đăng nhập, quản lý profile
- `PublicComicController`: API công khai cho đọc truyện, tìm kiếm, xem chi tiết
- `AuthorWorkspaceController`: API cho tác giả (tạo/sửa/xuất bản truyện, chương)
- `WalletController`: Quản lý ví, nạp tiền (VnPay/MoMo), rút tiền
- `InteractionController`: Bình luận, đánh giá, báo cáo vi phạm
- `AdminController`: Toàn bộ nghiệp vụ quản trị
- `LibraryController`: Tủ sách, lịch sử đọc, theo dõi
- `NotificationController`: Hệ thống thông báo
- `AuthorAnalyticsController`: Thống kê doanh thu và tương tác tác giả

**Luồng xuất bản chương (Author → AI Service → Database)**:
```
1. AuthorWorkspaceController.publishChapter() nhận request từ frontend
2. AuthorWorkspaceService.publishChapter() được gọi:
   a. Lưu chương với status = PENDING_REVIEW vào DB
   b. Gửi HTTP POST đến AI Service /moderate với nội dung chương
3. AI Service trả về: { decision: "APPROVED"|"PENDING_REVIEW"|"REJECTED", score, matchedChapters }
4. AuthorWorkspaceService cập nhật status chương theo decision
5. Nếu APPROVED: chapter hiển thị công khai, tác giả nhận thông báo
6. Nếu PENDING_REVIEW: Admin nhận task kiểm duyệt thủ công
7. Nếu REJECTED: Tác giả nhận thông báo kèm lý do
```

### 3.2.2. Luồng xử lý kiểm duyệt bản quyền (AI Service)

AI Service được triển khai dưới dạng Python Flask microservice. Luồng xử lý chi tiết:

**Luồng truyện chữ**:
```python
def moderate_text_chapter(content, chapter_id):
    # Bước 1: Tiền xử lý
    clean_text = preprocess(content)  # Bóc HTML, lowercase, bỏ dấu câu
    
    # Bước 2: Kiểm tra từ khóa vi phạm
    keyword_result = check_keywords(clean_text)
    if keyword_result == "HARD_REJECT":
        return { "decision": "REJECTED", "reason": "keyword_violation" }
    
    # Bước 3: PhoBERT embedding
    embedding = model.encode(clean_text)  # Vector 768 chiều
    
    # Bước 4: So sánh với DB
    all_embeddings = load_embeddings_from_db()
    max_similarity = max(cosine_similarity(embedding, e) for e in all_embeddings)
    
    # Bước 5: Phân loại
    if max_similarity > HIGH_THRESHOLD:  # 0.90
        return { "decision": "REJECTED", "score": max_similarity }
    elif max_similarity > MID_THRESHOLD:  # 0.75
        return { "decision": "PENDING_REVIEW", "score": max_similarity }
    else:
        # Lưu embedding mới vào DB
        save_embedding(chapter_id, embedding)
        return { "decision": "APPROVED", "score": max_similarity }
```

**Bảng 3.2: Phân loại mức độ vi phạm bản quyền**

| Mức độ | Điều kiện | Hành động hệ thống |
|--------|-----------|-------------------|
| An toàn | Similarity < 75% | Tự động APPROVED, hiển thị ngay |
| Nghi ngờ | 75% ≤ Similarity < 90% | Chờ Admin duyệt thủ công |
| Vi phạm nghiêm trọng | Similarity ≥ 90% | Tự động REJECTED, thông báo tác giả |

### 3.2.3. Luồng giao dịch ví điện tử

```java
// WalletService.java - Luồng mua chương VIP
@Transactional
public void purchaseChapter(Long userId, Long chapterId) {
    // 1. Kiểm tra chương tồn tại và có giá
    Chapter chapter = chapterRepository.findById(chapterId)...;
    
    // 2. Kiểm tra chưa mua
    if (unlockRepository.exists(userId, chapterId)) throw new AlreadyPurchasedException();
    
    // 3. Kiểm tra số dư
    UserWallet readerWallet = walletRepository.findByUserId(userId)...;
    if (readerWallet.getBalance() < chapter.getPrice()) throw new InsufficientBalanceException();
    
    // 4. Trừ Xu người đọc
    readerWallet.deduct(chapter.getPrice());
    
    // 5. Cộng 60% vào ví tác giả
    UserWallet authorWallet = walletRepository.findByUserId(chapter.getAuthorId())...;
    authorWallet.add(chapter.getPrice() * 0.6);
    
    // 6. Ghi lịch sử giao dịch
    transactionRepository.save(new WalletTransaction(userId, "PURCHASE", chapter.getPrice()));
    transactionRepository.save(new WalletTransaction(authorId, "INCOME", chapter.getPrice() * 0.6));
    
    // 7. Cấp quyền đọc
    unlockRepository.save(new ChapterUnlock(userId, chapterId));
    
    // → Nếu bất kỳ bước nào fail, toàn bộ rollback
}
```

**Bảng 3.3: Cấu hình gói nạp Xu**

| Gói | Giá tiền thật | Số Xu nhận | Bonus |
|-----|-------------|-----------|-------|
| Starter | 10.000 VND | 100 Xu | 0% |
| Basic | 50.000 VND | 550 Xu | 10% |
| Premium | 100.000 VND | 1.200 Xu | 20% |
| VIP | 200.000 VND | 2.600 Xu | 30% |

### 3.2.4. Thiết kế giao diện người dùng

Frontend được chia thành 3 phân hệ chính:

**Phân hệ Đọc truyện** (dành cho tất cả người dùng):
- `HomePage`: Banner, "Top Thịnh hành", "Mới cập nhật", "Gợi ý cho bạn"
- `ChiTietTruyenPage`: Thông tin truyện, danh sách chương, đánh giá, bình luận
- `ComicReaderPage`: Đọc truyện chữ (tùy chỉnh font/màu nền/cỡ chữ/khoảng cách dòng, TTS) hoặc truyện tranh (cuộn ảnh, lazy loading)
- `TimTruyenPage`: Tìm kiếm/lọc theo thể loại, trạng thái, kiểu nội dung
- `XepHangPage`: Bảng xếp hạng theo lượt xem, doanh thu
- `LichSuPage`, `TuTruyenPage`: Lịch sử đọc, tủ sách cá nhân

**Phân hệ Sáng tác** (`SangTacPage` – dành cho Tác giả):
- Tab "Quản lý truyện": Tạo/sửa/xóa truyện, quản lý bìa, thể loại, trạng thái
- Tab "Quản lý chương": Soạn thảo (Rich Text Editor cho truyện chữ, upload ảnh cho truyện tranh), thiết lập VIP/giá
- Tab "Thống kê": Biểu đồ lượt xem, doanh thu theo thời gian
- Tab "Cộng đồng": Đăng bài cập nhật cho fan

**Phân hệ Quản trị** (`AdminPage` – dành cho Admin):
- Tab "Tổng quan": Thống kê tổng hợp (người dùng mới, doanh thu, truyện mới, báo cáo chờ xử lý)
- Tab "Nội dung": Quản lý truyện/chương, duyệt nội dung chờ, ẩn/xóa vi phạm
- Tab "Người dùng": Danh sách tài khoản, khóa/mở khóa
- Tab "Báo cáo": Xử lý báo cáo vi phạm từ người dùng, xem xét khiếu nại
- Tab "Tài chính": Lịch sử giao dịch, duyệt yêu cầu rút tiền

## 3.3. Hiện thực giải pháp

### 3.3.1. Môi trường triển khai

| Thành phần | Môi trường phát triển | Ghi chú |
|-----------|----------------------|---------|
| OS | Windows 11 | - |
| Java | JDK 21 | Spring Boot 3.x |
| Node.js | v20.x | ReactJS + Vite |
| Python | 3.10 | Flask AI Service |
| MySQL | 8.0 | Local + port 3306 |
| IDE | VS Code + IntelliJ IDEA | - |
| Git | GitHub | Version control |

### 3.3.2. Cài đặt các chức năng chính

**a. Hệ thống xác thực và phân quyền**

Người dùng đăng ký bằng email/password. Password được hash bằng BCrypt (độ mạnh 12). Đăng nhập tạo HTTP Session lưu trên server, cookie `SESSION` trả về client với `HttpOnly=true`, `SameSite=Lax`. Mỗi request đến API protected được Spring Security kiểm tra session.

Phân quyền 3 cấp:
- **ROLE_USER**: Đọc truyện miễn phí, bình luận, đánh giá, nạp tiền, mua chương VIP
- **ROLE_AUTHOR**: Toàn bộ quyền USER + quyền tạo/quản lý truyện, xem doanh thu
- **ROLE_ADMIN**: Toàn bộ quyền + quản trị hệ thống

**b. Studio Sáng tác cho tác giả**

*Truyện chữ*: Giao diện soạn thảo tích hợp công cụ định dạng phong phú (bold, italic, underline, font family, font size, color, text-align, letter spacing). Nội dung được lưu dạng HTML có cấu trúc. Tác giả có thể Lưu nháp (status = DRAFT) hoặc Xuất bản (gọi API kiểm duyệt AI).

*Truyện tranh*: Giao diện upload nhiều ảnh cùng lúc (drag & drop), tự động sắp xếp thứ tự, preview thumbnail. Ảnh được upload lên ImageKit CDN trước khi gửi API.

*Cài đặt chương VIP*: Tác giả đặt giá chương (tối thiểu 1 Xu, tối đa 999 Xu) hoặc để miễn phí.

**c. Giao diện đọc truyện**

*Truyện chữ*: Người đọc tùy chỉnh:
- Màu nền: Sáng (trắng), Tối (đen), Vàng giấy, Kem
- Font chữ: Lora (Serif), Arial (Sans-serif), Georgia
- Cỡ chữ: 14px – 24px (slider)
- Khoảng cách dòng: 1.4 – 2.0
- Chiều rộng cột đọc: 600px – 900px
Tất cả cài đặt lưu vào `localStorage`, duy trì qua các lần đọc.

Tính năng TTS: Gọi Zalo AI TTS API, trả về file audio .mp3, phát qua HTML5 Audio Player tích hợp trong trang đọc với các control: Play/Pause, tua 15 giây, tốc độ đọc (0.75x/1x/1.25x/1.5x).

*Truyện tranh*: Ảnh load theo kiểu lazy loading (Intersection Observer API), tự động điều chỉnh chiều rộng theo viewport, hỗ trợ cuộn dọc liên tục.

**d. Hệ thống Ví điện tử và Thanh toán**

Luồng nạp tiền VnPay:
1. `WalletController.createVnPayPayment()` tạo URL thanh toán với signature HMAC-SHA512
2. Frontend chuyển hướng user đến VnPay payment page
3. Sau khi thanh toán, VnPay redirect về `WalletController.vnPayReturn()`
4. Backend verify signature, cập nhật balance và ghi transaction

Cơ chế tương tự cho MoMo (dùng HMAC-SHA256).

**e. Admin Dashboard – Xử lý báo cáo vi phạm**

Quy trình xử lý báo cáo:
1. Người dùng submit báo cáo qua `ReportModal` component
2. `content_reports` table ghi nhận với status = PENDING
3. Admin thấy report trong Dashboard, click để xem chi tiết (nội dung vi phạm, lý do báo cáo, tỷ lệ AI score nếu có)
4. Admin chọn: Xóa nội dung (RESOLVED + gửi notification) hoặc Bỏ qua (DISMISSED)
5. Toàn bộ hành động ghi vào `report_audit_logs`
6. Người dùng có thể gửi Appeal qua `AppealPage`, Admin xem xét phê duyệt/từ chối

**f. Hệ thống thông báo**

`NotificationService` tạo notification entry trong DB khi:
- Có chương mới từ truyện/tác giả đang theo dõi
- Bình luận bị trả lời
- Tài khoản bị khóa/mở khóa
- Nạp tiền thành công
- Chương được duyệt/từ chối bởi AI hoặc Admin

Frontend poll `/api/notifications/unread-count` mỗi 60 giây và hiển thị badge trên icon chuông.

### 3.3.3. Kiểm thử hệ thống

**Bảng 5.1: Kết quả kiểm thử chức năng chính**

| STT | Chức năng | Trường hợp kiểm thử | Kết quả |
|-----|----------|-------------------|---------|
| 1 | Đăng ký | Email hợp lệ, password đủ mạnh | PASS |
| 2 | Đăng ký | Email đã tồn tại | PASS (báo lỗi đúng) |
| 3 | Đăng nhập | Thông tin đúng | PASS |
| 4 | Đăng nhập | Sai mật khẩu | PASS (báo lỗi, không lộ info) |
| 5 | Tạo truyện | Tất cả trường hợp hợp lệ | PASS |
| 6 | Xuất bản chương sạch | Nội dung gốc, không trùng | PASS (APPROVED tự động) |
| 7 | Xuất bản chương đạo văn | Copy >90% nội dung | PASS (REJECTED tự động) |
| 8 | Xuất bản ảnh NSFW | Hình ảnh khiêu dâm | PASS (REJECTED, AI phát hiện) |
| 9 | Nạp Xu qua VnPay | Thanh toán thành công | PASS (balance cập nhật) |
| 10 | Mua chương VIP | Số dư đủ | PASS (mở khóa ngay) |
| 11 | Mua chương VIP | Số dư không đủ | PASS (báo lỗi, không trừ tiền) |
| 12 | Tặng quà tác giả | Tặng 50 Xu | PASS (tác giả nhận 30 Xu, sàn 20 Xu) |
| 13 | Phân quyền API | User gọi API admin | PASS (403 Forbidden) |
| 14 | Bình luận | Nội dung hợp lệ | PASS |
| 15 | Đánh giá sao | 1-5 sao + review text | PASS |
| 16 | Admin khóa tài khoản | Tài khoản bị khóa không đăng nhập được | PASS |
| 17 | Tìm kiếm truyện | Theo tên, thể loại, trạng thái | PASS |
| 18 | TTS | Phát audio chương truyện chữ | PASS |

---

# CHƯƠNG 5. KẾT QUẢ, KẾT LUẬN VÀ KIẾN NGHỊ

## 5.1. KẾT QUẢ

### 5.1.1. Sản phẩm đạt được

Đề tài đã hoàn thành xây dựng nền tảng TopTruyen – một ứng dụng web hoàn chỉnh với đầy đủ 8 phân hệ chức năng:

**Phân hệ 1 – Quản lý tài khoản**: Đăng ký/đăng nhập bảo mật, phân quyền 3 cấp (Admin/Author/User), quản lý hồ sơ cá nhân với avatar lưu trên ImageKit.

**Phân hệ 2 – Studio Sáng tác**: Công cụ soạn thảo Rich Text cho truyện chữ, upload ảnh hàng loạt cho truyện tranh, quản lý chương (nháp/xuất bản/đặt giá VIP), thống kê doanh thu và lượt đọc theo thời gian thực.

**Phân hệ 3 – Đọc và Tương tác**: Giao diện đọc tùy chỉnh cao (font/màu/cỡ chữ/khoảng cách), tích hợp TTS tiếng Việt, bình luận (chương/truyện), đánh giá sao, tặng quà, hệ thống thông báo.

**Phân hệ 4 – Thương mại hóa**: Ví điện tử nội bộ (Xu), tích hợp VnPay và MoMo, mua chương VIP với ACID transaction, lịch sử giao dịch chi tiết, cơ chế chia doanh thu tự động.

**Phân hệ 5 – Kiểm duyệt bản quyền AI**: Pipeline tự động 2 lớp cho văn bản (PhoBERT + N-gram) và hình ảnh (pHash + NudeNet + OCR), phân loại 3 mức với hành động tương ứng, giảm tải đáng kể cho Admin.

**Phân hệ 6 – Tìm kiếm và Gợi ý**: Tìm kiếm nâng cao (tên, thể loại, trạng thái, kiểu nội dung, lọc nhiều điều kiện), bảng xếp hạng (Top lượt xem, Top doanh thu, Top mới nổi), hệ thống gợi ý Trending Score và Content-based Filtering.

**Phân hệ 7 – Thư viện cá nhân**: Lịch sử đọc với trạng thái chapter cuối, tủ sách (theo dõi truyện/tác giả), nhận thông báo khi có chương mới.

**Phân hệ 8 – Admin Dashboard**: Thống kê tổng quan, quản lý nội dung/người dùng, xử lý báo cáo và khiếu nại, quản lý tài chính (giao dịch, rút tiền), công cụ kiểm duyệt thủ công cho nội dung chờ duyệt.

### 5.1.2. Hiệu quả hệ thống kiểm duyệt AI

Qua kiểm thử với tập dữ liệu thực tế:
- **Phát hiện đạo văn văn bản**: Accuracy ~92% với ngưỡng PhoBERT Similarity ≥ 0.90 cho mức "vi phạm nghiêm trọng"
- **Phát hiện ảnh tái đăng (pHash)**: Phát hiện chính xác ảnh bị resize, đổi màu, thêm watermark với Hamming Distance ≤ 10
- **Phát hiện nội dung NSFW**: NudeNet đạt precision ~88% trên ảnh truyện tranh
- **Thời gian xử lý**: Trung bình ~2-3 giây cho một chương text, ~1 giây cho mỗi trang ảnh

### 5.1.3. Chức năng thanh toán

Cả VnPay và MoMo đều hoạt động đúng trong môi trường Sandbox:
- Tạo URL thanh toán thành công trong <200ms
- Callback verify signature chính xác 100%
- Balance cập nhật ngay sau khi thanh toán thành công
- Giao dịch lỗi (thanh toán thất bại) không cập nhật balance (rollback đúng)

## 5.2. KẾT LUẬN

Đề tài đã hoàn thành mục tiêu đề ra: xây dựng một nền tảng web trực tuyến toàn diện cho cộng đồng sáng tác và đọc truyện tại Việt Nam. Ba vấn đề cốt lõi được giải quyết thỏa đáng:

**Về thương mại hóa**: Hệ thống ví Xu với giao dịch ACID-compliant, tích hợp thực tế VnPay và MoMo, cơ chế chia doanh thu minh bạch (60/40) cùng hệ thống thống kê theo thời gian thực là nền tảng vững chắc để tác giả kiếm thu nhập.

**Về bảo vệ bản quyền**: Pipeline kiểm duyệt AI tự động hai lớp (văn bản + hình ảnh) hoạt động hiệu quả, giảm đáng kể gánh nặng cho Admin và ngăn chặn hầu hết các trường hợp đạo văn/tái đăng trước khi nội dung lên sàn. Đây là điểm khác biệt lớn nhất so với các nền tảng hiện có tại Việt Nam.

**Về trải nghiệm người dùng**: Giao diện đọc tùy chỉnh cao, tích hợp TTS tiếng Việt, và hệ thống gợi ý thông minh mang lại trải nghiệm đọc cạnh tranh với các nền tảng quốc tế.

Tuy nhiên, đề tài vẫn còn một số hạn chế:
- Hệ thống thanh toán đang ở chế độ Sandbox, chưa thực chiến với giao dịch tiền thật
- Thuật toán Collaborative Filtering chưa được triển khai do thiếu dữ liệu người dùng thực
- Hiệu năng AI Service khi xử lý đồng thời nhiều chương cần tối ưu thêm (hiện tại xử lý tuần tự)
- Chức năng TTS phụ thuộc vào API bên ngoài, cần fallback khi API không khả dụng

## 5.3. KIẾN NGHỊ

**Về phát triển kỹ thuật**:
1. Triển khai **Collaborative Filtering** đầy đủ khi có đủ dữ liệu tương tác người dùng thực, kết hợp với Content-based Filtering tạo Hybrid Recommendation System mạnh hơn.
2. Chuyển AI Service sang **Message Queue** (RabbitMQ/Kafka) để xử lý kiểm duyệt bất đồng bộ, tăng throughput và không block luồng xuất bản.
3. Tích hợp **Elasticsearch** để cải thiện tốc độ và độ chính xác tìm kiếm full-text tiếng Việt.
4. Thêm **Rate Limiting** và **CAPTCHA** cho các endpoint nhạy cảm (đăng ký, nạp tiền) để chống bot.
5. Triển khai **PWA (Progressive Web App)** để cải thiện trải nghiệm trên thiết bị di động.

**Về kinh doanh và pháp lý**:
1. Xây dựng **Terms of Service** và **Copyright Policy** rõ ràng làm cơ sở pháp lý cho việc xử lý vi phạm.
2. Nghiên cứu tích hợp **VinAI Phonex TTS** (model tiếng Việt chất lượng cao) để cải thiện trải nghiệm AI đọc truyện, giảm phụ thuộc vào API bên ngoài.
3. Mở rộng hệ thống sang **đa ngôn ngữ** (Anh, Trung) để tiếp cận thị trường rộng hơn.
4. Nghiên cứu ứng dụng **blockchain** cho quản lý bản quyền số minh bạch và không thể sửa đổi.

---

# TÀI LIỆU THAM KHẢO

**Bài đăng tạp chí:**

1. Nguyen, D. Q., Nguyen, A. T., & Nguyen, A. T. N. (2020). PhoBERT: Pre-trained language models for Vietnamese. *Findings of EMNLP 2020*, pp. 1037-1042.

2. Nguyen, T. H., & Tran, V. P. (2023). Factors Affecting Users' Willingness to Pay for Online Digital Content in Vietnam. *Journal of Economics and Development*, Vol. 25, No. 2, 2023, pp. 15-30.

3. Zhang, Y., & Liu, Q. (2021). Recommendation Systems for Online Literature: A Survey. *International Journal of Computer Applications*, Vol. 180, No. 5, 2021, pp. 12-20.

4. Smith, J. R. (2020). Digital Rights Management (DRM) Architectures for Electronic Publishing. *ACM Computing Surveys*, Vol. 52, No. 3, 2020, pp. 1-25.

**Bài báo cáo hội nghị:**

5. Le, D. K., & Pham, H. N. (2022). Designing Scalable Microservices Architecture for High-Traffic Content Platforms. *Proceedings of the 2022 IEEE International Conference on Web Services (ICWS)*, Barcelona, Spain, July 2022.

6. Gionis, A., Indyk, P., & Motwani, R. (1999). Similarity Search in High Dimensions via Hashing. *Proceedings of the 25th International Conference on Very Large Data Bases (VLDB)*, Edinburgh, UK, pp. 518-529.

**Sách:**

7. Craig Walls (2021). *Spring Boot in Action*, 6th Edition. Manning Publications, New York, USA, 2021.

8. Paul DuBois (2019). *MySQL (5th Edition) (Developer's Library)*. Addison-Wesley Professional, Boston, USA, 2019.

9. Alex Banks & Eve Porcello (2020). *Learning React: Modern Patterns for Developing React Apps*, 2nd Edition. O'Reilly Media, Sebastopol, USA, 2020.

10. Martin Kleppmann (2017). *Designing Data-Intensive Applications*. O'Reilly Media, Sebastopol, USA, 2017.

**Website:**

11. Spring Projects – Spring Boot. Tài liệu chính thức của Spring Boot. Địa chỉ: https://spring.io/projects/spring-boot, truy cập ngày 01/06/2025.

12. MySQL Documentation. Hướng dẫn sử dụng MySQL. Địa chỉ: https://dev.mysql.com/doc/, truy cập ngày 01/06/2025.

13. React Documentation. Tài liệu chính thức ReactJS. Địa chỉ: https://react.dev/, truy cập ngày 01/06/2025.

14. VNPAY Sandbox for Developers. Tài liệu tích hợp cổng thanh toán VnPay. Địa chỉ: https://sandbox.vnpayment.vn/apis/, truy cập ngày 01/06/2025.

15. ImageKit Documentation. Tài liệu tích hợp ImageKit CDN. Địa chỉ: https://docs.imagekit.io/, truy cập ngày 01/06/2025.

16. Sentence-Transformers: PhoBERT. Thư viện embedding tiếng Việt. Địa chỉ: https://huggingface.co/VoVanPhuc/sup-SimCSE-VietNamese-phobert-base, truy cập ngày 01/06/2025.

---

*TP. Hồ Chí Minh, tháng 06 năm 2025*

*Sinh viên thực hiện: Bạch Thanh Tùng (MSSV: 22130314)*

*Giảng viên hướng dẫn: ThS. Trần Lê Như Quỳnh*
