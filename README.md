# TopTruyen — Nền tảng đọc & sáng tác truyện online

Dự án web đọc truyện full-stack với hệ thống kiểm duyệt nội dung bằng AI, bao gồm ba service độc lập: Frontend (React), Backend (Spring Boot) và AI Service (Python/Flask).

---

## Tính năng nổi bật

| Nhóm | Tính năng |
|---|---|
| **Đọc truyện** | Đọc truyện chữ & truyện tranh, lịch sử đọc, theo dõi tác giả/truyện, xếp hạng |
| **Sáng tác** | Workspace tác giả, đăng chương (text & ảnh), lên lịch đăng, quản lý doanh thu |
| **Kiểm duyệt AI** | Phát hiện reup (đạo văn) bằng PhoBERT embedding + phát hiện vi phạm ngôn ngữ |
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

```
Tác giả đăng chapter
        │
        ▼
┌───────────────────┐
│  Lớp 1: Reup      │  PhoBERT embedding → cosine similarity > 90%?
│  (Đạo văn)        │──── YES ──► REJECTED (trùng nội dung)
└───────────────────┘
        │ NO
        ▼
┌───────────────────┐
│  Lớp 2: Vi phạm   │  PhoBERT fine-tuned / Perspective API > 75%?
│  (Nội dung xấu)   │──── YES ──► REJECTED (nội dung vi phạm)
└───────────────────┘
        │ NO / AI offline
        ▼
   PUBLISHED / PENDING_REVIEW (xét duyệt thủ công bởi Admin)
```

---

## Tài khoản demo

| Vai trò | Email | Mật khẩu |
|---|---|---|
| Admin | *(xem file .env)* | *(tự tạo)* |
| Tác giả | *(đăng ký thường)* | — |

---

## Nhóm phát triển

Dự án được phát triển bởi nhóm sinh viên — đồ án môn học.

> Lưu ý: Đây là dự án học thuật, không sử dụng cho mục đích thương mại.
