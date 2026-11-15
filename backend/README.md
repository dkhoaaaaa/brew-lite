# BrewLite - Backend API (NestJS)

Dịch vụ backend cho dự án BrewLite được xây dựng trên NestJS, sử dụng Prisma ORM và PostgreSQL (Neon Cloud / Local Docker).

---

## Môi trường thực thi

Hệ thống được đóng gói và vận hành hoàn toàn trong **Docker Compose**. Bạn không cần cài đặt Node.js hay pnpm trên máy host để chạy backend.

### Khởi chạy dịch vụ

Từ thư mục gốc dự án:

```bash
# Khởi chạy toàn bộ hệ thống (gồm cả backend và frontend)
docker compose up -d --build

# Xem nhật ký hoạt động của backend
docker compose logs -f backend
```

---

## Các thao tác trong Container

Mọi thao tác quản lý, migration, seed và kiểm thử được thực thi qua `docker compose exec`:

```bash
# Chạy Unit Tests
docker compose exec -w /app/backend backend pnpm test

# Kiểm tra Linter (Oxlint)
docker compose exec -w /app/backend backend pnpm run lint

# Chạy Prisma Migration
docker compose exec -w /app/backend backend pnpm exec prisma --config prisma7.config.ts migrate deploy

# Nạp dữ liệu mẫu (Seed)
docker compose exec -w /app/backend backend pnpm exec prisma --config prisma7.config.ts db seed

# Build ứng dụng NestJS
docker compose exec -w /app/backend backend pnpm run build
```

---

## Triển khai (Deployment)

Dịch vụ backend có `Dockerfile` độc lập tại `backend/Dockerfile` hỗ trợ build container đa tầng và tương thích trực tiếp với nền tảng **Render** (`CMD ["pnpm", "--dir", "backend", "start:prod"]`).
