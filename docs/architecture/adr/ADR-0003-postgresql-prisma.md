# ADR-0003: Sử dụng PostgreSQL và Prisma

## Trạng thái

Accepted

## Bối cảnh

Ứng dụng cần lưu dữ liệu có quan hệ, gồm thông tin người dùng, sản phẩm, đơn hàng và thanh toán.

## Quyết định

Dùng PostgreSQL làm cơ sở dữ liệu quan hệ và Prisma ORM để truy cập dữ liệu. Dùng Prisma Migrations để quản lý thay đổi schema.

## Hệ quả

- Dữ liệu quan hệ được lưu trong PostgreSQL.

- Prisma cung cấp schema và lớp truy cập dữ liệu cho backend.

- Thay đổi cấu trúc database cần được quản lý và triển khai qua migration.

- Cần kiểm tra migration trước khi áp dụng lên database có dữ liệu quan trọng.
