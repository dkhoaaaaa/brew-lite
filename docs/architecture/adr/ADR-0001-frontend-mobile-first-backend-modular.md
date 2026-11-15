# ADR-0001: Frontend mobile-first và backend theo module

## Trạng thái

Accepted

## Bối cảnh

Brew Lite cần giao diện cho người dùng và backend xử lý các nghiệp vụ như sản phẩm, tài khoản, đơn hàng, thanh toán và tích điểm.

## Quyết định

Xây dựng frontend bằng Next.js theo hướng mobile-first. Xây dựng backend bằng NestJS, chia theo module nghiệp vụ. Controller tiếp nhận request, service xử lý nghiệp vụ và Prisma truy cập database.

## Hệ quả

- Giao diện ưu tiên trải nghiệm trên thiết bị di động.

- Các module giúp tổ chức chức năng backend theo nghiệp vụ.

- Cần duy trì ranh giới module và trách nhiệm Controller/Service rõ ràng.

- Mobile-first không đồng nghĩa với PWA.
