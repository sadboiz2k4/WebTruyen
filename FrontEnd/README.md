# WebTruyen Frontend

Frontend React + Vite cho giao diện web truyện.

## Chạy dự án

```bash
npm install
npm run dev
```

## Cấu hình môi trường

Tạo file `.env` từ `.env.example` và cấu hình:

- `VITE_API_BASE=http://localhost:8080`
- `VITE_IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/toptruyen`
- `VITE_IMAGEKIT_PUBLIC_KEY=public_xxx`

Lưu ý: không đặt `Private Key` vào frontend.

## Build

```bash
npm run build
```