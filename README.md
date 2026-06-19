# TopTruyen — Nền tảng đọc & sáng tác truyện online

Dự án web đọc truyện full-stack với hệ thống kiểm duyệt nội dung bằng AI, bao gồm ba service độc lập: Frontend (React), Backend (Spring Boot) và AI Service (Python/Flask).

---

## Tính năng nổi bật

| Nhóm | Tính năng |
|---|---|
| **Đọc truyện** | Đọc truyện chữ & truyện tranh, lịch sử đọc, theo dõi tác giả/truyện, xếp hạng |
| **Sáng tác** | Workspace tác giả, đăng chương (text & ảnh), lên lịch đăng, quản lý doanh thu |
| **Kiểm duyệt AI** | Phát hiện đạo văn / reup truyện chữ (PhoBERT embedding), reup ảnh (pHash), ảnh đồi trụy / 18+ (NudeNet), vi phạm ngôn ngữ (PhoBERT fine-tuned + Perspective API) |
| **Quản trị** | Trang admin: duyệt chapter, quản lý báo cáo, kháng nghị, người dùng, giao dịch |
| **Ví & thanh toán** | Hệ thống xu (coin), mở khóa chapter trả phí, rút tiền cho tác giả |
| **Tài khoản** | Đăng ký/đăng nhập, Google OAuth, quên mật khẩu qua email |
| **Xã hội** | Bình luận, đánh giá, thông báo real-time, báo cáo vi phạm |

---

## Kiến trúc hệ thống

```
┌─────────────────┐     REST API      ┌─────────────────────┐
│  React Frontend │ ◄────────────────► │  Spring Boot Backend│
│  (Port 5173)    │                   │  (Port 8080)        │
└─────────────────┘                   └──────────┬──────────┘
                                                 │ HTTP
                                      ┌──────────▼──────────┐
                                      │   Python AI Service │
                                      │   (Port 5000)       │
                                      └─────────────────────┘
```

### Frontend — React 18 + Vite
- **Framework**: React 18, React Router v7
- **UI**: FontAwesome icons, Recharts (biểu đồ doanh thu)
- **Auth**: Session cookie + Google OAuth (`@react-oauth/google`)
- **Build**: Vite 5

### Backend — Spring Boot 3.3.4
- **Database**: MySQL với JdbcTemplate (không dùng ORM)
- **Auth**: Session-based + Google OAuth
- **Email**: Gmail SMTP (quên mật khẩu)
- **Storage**: ImageKit (ảnh bìa, trang truyện tranh)
- **Bảo mật**: BCrypt password hashing

### AI Service — Python Flask
- **Lớp 1 — Phát hiện Reup**: PhoBERT Sentence Embedding + cosine similarity so sánh với toàn bộ truyện trong DB
- **Lớp 2 — Phát hiện vi phạm**: PhoBERT fine-tuned cho tiếng Việt + Perspective API (fallback)
- **Truyện tranh**: pHash (perceptual hashing) phát hiện ảnh trùng + NudeNet (nội dung 18+)
- **Vector store**: MySQL lưu embeddings chapter

---

## Cài đặt & Chạy

### Yêu cầu
- Java 21+, Maven 3.8+
- Python 3.9+
- MySQL 8.0+
- Node.js 18+

### Cấu hình

**Backend** — tạo file `BackEnd/.env`:
```properties
DB_URL=jdbc:mysql://localhost:3306/toptruyen_db?useSSL=false&serverTimezone=UTC
DB_USERNAME=root
DB_PASSWORD=yourpassword
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GMAIL_USERNAME=...
GMAIL_PASSWORD=...
IMAGEKIT_PUBLIC_KEY=...
IMAGEKIT_PRIVATE_KEY=...
IMAGEKIT_URL_ENDPOINT=...
```

**AI Service** — tạo file `AIService/.env`:
```properties
DB_HOST=localhost
DB_NAME=toptruyen_db
DB_USER=root
DB_PASSWORD=yourpassword
PERSPECTIVE_API_KEY=...   # tùy chọn, dùng làm fallback
```

### Khởi động nhanh (Windows)

```bat
start-all.bat
```

Chờ ~35-40 giây để AI load model, sau đó chạy Frontend:

```bash
cd FrontEnd
npm install
npm run dev
```

### Khởi động thủ công

```bash
# 1. AI Service
cd AIService
pip install -r requirements.txt
python app.py

# 2. Backend (terminal khác)
cd BackEnd
mvn package -DskipTests
java -jar target/backend-0.0.1-SNAPSHOT.jar

# 3. Frontend (terminal khác)
cd FrontEnd
npm install
npm run dev
```

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8080 |
| AI Service | http://localhost:5000 |

---

## Cấu trúc thư mục

```
WebTruyen/
├── FrontEnd/               # React + Vite
│   └── src/
│       ├── pages/          # AdminPage, SangTacPage, ComicReaderPage...
│       ├── components/     # DonateModal, NotificationsDropdown...
│       └── services/       # API calls (authApi, sangTacApi, walletApi...)
│
├── BackEnd/                # Spring Boot
│   └── src/main/java/com/toptruyen/backend/
│       ├── controller/     # REST endpoints
│       ├── service/        # Business logic
│       └── dto/            # Data Transfer Objects
│
├── AIService/              # Python Flask
│   └── app.py              # Moderation endpoints /moderate, /moderate-images
│
├── start-all.bat           # Script khởi động nhanh (Windows)
└── HUONG_DAN_CHAY.md       # Hướng dẫn chi tiết
```

---

## Luồng kiểm duyệt AI

Hệ thống kiểm duyệt hoạt động tự động ngay khi tác giả bấm đăng chapter, chia làm **2 nhánh song song** tùy loại nội dung:

### Truyện chữ

```
Tác giả đăng chapter chữ
           │
           ▼
┌─────────────────────────────────────────────────────────┐
│  Lớp 1: Phát hiện Đạo văn / Reup nội dung              │
│                                                         │
│  • Vector hóa nội dung bằng PhoBERT Sentence Embedding  │
│  • So sánh cosine similarity với toàn bộ chapter        │
│    đã có trong hệ thống (lưu trong MySQL)               │
│  • Similarity ≥ 90%  →  REJECTED (đạo văn rõ ràng)     │
│  • Similarity 75–90% →  PENDING_REVIEW (nghi vấn)       │
└────────────────────────┬────────────────────────────────┘
                         │ Không trùng
                         ▼
┌─────────────────────────────────────────────────────────┐
│  Lớp 2: Phát hiện Vi phạm ngôn ngữ                     │
│                                                         │
│  • Mô hình PhoBERT fine-tuned tiếng Việt                │
│    phân loại nội dung độc hại, thù địch, tục tĩu...     │
│  • Nếu mô hình cục bộ không khả dụng → fallback sang   │
│    Google Perspective API                               │
│  • Score ≥ 75%  →  REJECTED (vi phạm nội dung)         │
│  • Score 45–75% →  PENDING_REVIEW (cần xét thủ công)   │
└────────────────────────┬────────────────────────────────┘
                         │ Sạch
                         ▼
                     PUBLISHED ✓
```

### Truyện tranh (ảnh)

```
Tác giả đăng chapter ảnh
           │
           ▼
┌─────────────────────────────────────────────────────────┐
│  Lớp 1: Phát hiện Reup ảnh (pHash)                     │
│                                                         │
│  • Tính perceptual hash (pHash) cho từng trang ảnh      │
│  • So sánh Hamming distance với toàn bộ ảnh trong DB    │
│  • Độ tương đồng cao → REJECTED (reup truyện tranh)     │
└────────────────────────┬────────────────────────────────┘
                         │ Không trùng
                         ▼
┌─────────────────────────────────────────────────────────┐
│  Lớp 2: Phát hiện ảnh đồi trụy / nội dung 18+ (NudeNet)│
│                                                         │
│  • Dùng mô hình NudeNet phân tích từng trang ảnh        │
│  • Phát hiện nội dung khỏa thân, tình dục, bạo lực...  │
│  • Confidence ≥ ngưỡng → REJECTED (ảnh vi phạm)         │
└────────────────────────┬────────────────────────────────┘
                         │ Sạch
                         ▼
                     PUBLISHED ✓
```

### Khi AI offline

```
AI Service không phản hồi
           │
           ▼
    PENDING_REVIEW — Admin xét duyệt thủ công
```

> **Tóm tắt các trường hợp bị từ chối**: đạo văn truyện chữ · reup truyện tranh · nội dung độc hại / thù địch · ảnh đồi trụy / 18+

---

## Tài khoản demo

| Vai trò | Email | Mật khẩu |
|---|---|---|
| Admin | *(xem file .env)* | *(tự tạo)* |
| Tác giả | *(đăng ký thường)* | — |

---

## Nhóm phát triển

Dự án được phát triển bởi sinh viên Trường ĐH Nông Lâm TPHCM— đồ án môn học.

> Lưu ý: Đây là dự án học thuật, không sử dụng cho mục đích thương mại.
