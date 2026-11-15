# BrewLite - Frontend (Next.js)

Giao diện người dùng cho hệ thống BrewLite, được xây dựng bằng **Next.js 16**, **React 19** và **Tailwind CSS**.

---

## Môi trường thực thi

Giao diện frontend được vận hành thông qua **Docker Compose**. Bạn không cần cài đặt Node.js hay pnpm trên máy host để chạy giao diện.

### Khởi chạy dịch vụ

Từ thư mục gốc dự án:

```bash
# Khởi chạy toàn bộ hệ thống
docker compose up -d --build

# Xem nhật ký hoạt động của frontend
docker compose logs -f frontend
```

Truy cập giao diện tại: [http://localhost:3000](http://localhost:3000)

---

## Các thao tác trong Container

```bash
# Kiểm tra Linter
docker compose exec -w /app/frontend frontend pnpm run lint

# Build production test trong container
docker compose exec -w /app/frontend frontend pnpm run build
```

---

## Triển khai (Deployment)

Frontend được cấu hình để triển khai trực tiếp lên **Vercel** bằng cách trỏ Root Directory vào thư mục `frontend/` (sử dụng Next.js App Router).
