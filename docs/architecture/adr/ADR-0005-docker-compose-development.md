# ADR-0005: Dùng Docker Compose cho môi trường phát triển

## Trạng thái

Accepted

## Bối cảnh

Nhóm cần khởi chạy frontend, backend và PostgreSQL cùng nhau khi phát triển và kiểm thử local.

## Quyết định

Dùng Docker Compose để chạy các dịch vụ phát triển. PostgreSQL dùng volume để lưu dữ liệu; Compose có health check PostgreSQL trước khi khởi động backend.

## Hệ quả

- Môi trường local thuận tiện để khởi chạy nhiều dịch vụ.

- Các container có thể giao tiếp qua mạng Docker.

- Cấu hình hiện tại là development; không mặc định dùng nguyên trạng cho production.

- Cần cấu hình riêng cho production về secrets, mạng, lưu trữ và lệnh chạy ứng dụng.
