# ADR-0002: Quản lý frontend và backend trong monorepo

## Trạng thái

Accepted

## Bối cảnh

Dự án có frontend Next.js và backend NestJS cần được phát triển trong cùng một sản phẩm.

## Quyết định

Đặt frontend và backend trong cùng repository, quản lý dưới dạng pnpm workspace.

## Hệ quả

- Có thể xem và thay đổi frontend/backend cùng nhau.

- Cấu hình và mã nguồn được quản lý tập trung.

- Cần quản lý dependencies, scripts và quy trình build phù hợp cho từng workspace.
