# Hướng dẫn chạy dự án WebTruyen

## Bước 1 — Chạy AI Service + Backend

Double-click vào file:

```
start-all.bat
```

Chờ khoảng **35-40 giây** để AI load model xong, sau đó Backend sẽ tự khởi động.

---

## Bước 2 — Chạy Frontend

Mở terminal, chạy:

```bash
cd C:\Users\Admin\Desktop\WebTruyen\FrontEnd
npm run dev
```

---

## Kết quả

| Service | Địa chỉ |
|---------|---------|
| Frontend | http://localhost:5173 |
| Backend | http://localhost:8080 |
| AI Service | http://localhost:5000 |

---

## Lưu ý

- Phải chạy `start-all.bat` **trước**, sau đó mới chạy Frontend.
- Lần đầu chạy sẽ lâu hơn vì cài thư viện Python và tải model AI (~100MB).
- Những lần sau khởi động bình thường, không cần chờ tải lại.
