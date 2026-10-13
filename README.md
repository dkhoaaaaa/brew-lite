# Brew Lite

Brew Lite là ứng dụng web đặt và thanh toán cà phê hiện đại được xây dựng nhằm tối ưu hóa hiệu năng, trải nghiệm người dùng và khả năng mở rộng hệ thống. Dự án áp dụng các tiêu chuẩn kiến trúc phần mềm tiên tiến như Clean Architecture và Modular Architecture nhằm tách biệt rõ ràng các tầng nghiệp vụ, giúp dễ dàng bảo trì và phát triển tính năng mới.

---

## Công nghệ sử dụng

### 1. Backend (`src/backend`)

- **Framework:** NestJS (Node.js/TypeScript)
- **Kiến trúc:** Clean Architecture & Modular Monolith
- **Database & ORM:** PostgreSQL, Prisma ORM / TypeORM
- **Quản lý gói:** pnpm

### 2. Frontend (`src/frontend`)

- **Framework:** Next.js (React / TypeScript)
- **Styling:** Tailwind CSS
- **Giao tiếp API:** Axios

---

## Cấu trúc dự án (Modular Architecture)

Dự án được phân chia thành các module chức năng độc lập, tuân thủ nguyên lý đảo ngược phụ thuộc (Dependency Inversion Principle) và Repository Pattern để đảm bảo tính linh hoạt khi thay đổi cơ sở dữ liệu hoặc tầng dữ liệu.

---

## Tính năng chính

- **Quản lý danh mục & sản phẩm:** Xem menu cà phê, chi tiết món và tùy chỉnh theo yêu cầu.
- **Đặt hàng trực tuyến:** Thêm vào giỏ hàng và tiến hành đặt đồ uống nhanh chóng.
- **Thanh toán tích hợp:** Hỗ trợ quy trình thanh toán mượt mà và bảo mật.
- **Kiến trúc sạch:** Dễ dàng scale-up từ mô hình Monolith sang Microservices khi cần thiết nhờ ranh giới module rõ ràng.
