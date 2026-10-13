# Kiến Trúc Hệ Thống & Cấu Trúc Mã Nguồn BrewLite (STRUCTURE.md)

> **Tài liệu kỹ thuật nội bộ dành cho đội ngũ phát triển**  
> **Phiên bản khảo sát:** 1.0.0  
> **Ngày cập nhật:** 11/10/2026  
> **Trạng thái:** Đã đối soát và xác minh trực tiếp từ mã nguồn thực tế (Codebase Audit)

---

## Mục Lục

1. [Tổng Quan Kiến Trúc & Công Nghệ Đã Xác Minh](#1-tổng-quan-kiến-trúc--công-nghệ-đã-xác-minh)
2. [Cây Thư Mục Toàn Bộ Repository](#2-cây-thư-mục-toàn-bộ-repository)
3. [Kiến Trúc Frontend (Next.js App Router)](#3-kiến-trúc-frontend-nextjs-app-router)
4. [Kiến Trúc Backend (NestJS Modular Monolith)](#4-kiến-trúc-backend-nestjs-modular-monolith)
5. [Cấu Trúc Cơ Sở Dữ Liệu (PostgreSQL & Prisma ORM)](#5-cấu-trúc-cơ-sở-dữ-liệu-postgresql--prisma-orm)
6. [Luồng Dữ Liệu Thực Tế (Data Flow & Sequence)](#6-luồng-dữ-liệu-thực-tế-data-flow--sequence)
7. [Hướng Dẫn Mở Rộng Mã Nguồn & Vị Trí Đặt File Mới](#7-hướng-dẫn-mở-rộng-mã-nguồn--vị-trí-đặt-file-mới)
8. [Quy Chuẩn Import, Path Aliases & Quản Lý Phụ Thuộc](#8-quy-chuẩn-import-path-aliases--quản-lý-phụ-thuộc)
9. [Checklist Dành Cho Thành Viên Dự Án](#9-checklist-dành-cho-thành-viên-dự-án)

---

## 1. Tổng Quan Kiến Trúc & Công Nghệ Đã Xác Minh

Dự án **BrewLite** là hệ thống quản lý đặt món và thanh toán quán cà phê, được tổ chức theo mô hình **Monorepo đa tầng (Multi-package Monorepo)** tách biệt hoàn toàn giữa client (`frontend/`) và server (`backend/`).

### 1.1. Công nghệ đã xác minh từ mã nguồn thực tế

| Thành phần             | Công nghệ / Thư viện                    | Phiên bản thực tế                            | Mục đích sử dụng                                  | Vị trí cấu hình                |
| :--------------------- | :-------------------------------------- | :------------------------------------------- | :------------------------------------------------ | :----------------------------- |
| **Package Manager**    | `pnpm`                                  | `12.8.1`                                     | Quản lý gói dependencies toàn dự án               | `package.json` (root, fe, be)  |
| **Root Task Runner**   | `concurrently`                          | `^10.0.5`                                    | Chạy song song frontend và backend khi dev        | `package.json`                 |
| **Frontend Framework** | `Next.js`                               | `16.3.8`                                     | App Router, Server Components & Client Components | `frontend/package.json`        |
| **UI Library**         | `React` / `React DOM`                   | `19.2.8`                                     | Xây dựng giao diện người dùng                     | `frontend/package.json`        |
| **CSS Framework**      | `Tailwind CSS`                          | `^4.0.0` (`@tailwindcss/postcss`)            | Styling tiện ích, chuẩn Tailwind v4 CSS imports   | `frontend/postcss.config.mjs`  |
| **CSS Utilities**      | `clsx` & `tailwind-merge`               | `clsx ^2.1.1`, `tw-merge ^3.7.0`             | Hợp nhất class Tailwind động qua hàm helper `cn`  | `frontend/src/lib/utils.ts`    |
| **State Management**   | `Zustand`                               | `^5.0.15`                                    | Quản lý state toàn cục nhẹ (Auth, Cart)           | `frontend/src/store/`          |
| **HTTP Client**        | `Axios`                                 | `^1.20.0`                                    | Giao tiếp REST API, tự động đính kèm token        | `frontend/src/lib/axios.ts`    |
| **Icons**              | `Lucide React`                          | `^1.55.0`                                    | Bộ icon vector giao diện                          | `frontend/package.json`        |
| **Backend Framework**  | `NestJS`                                | `^12.0.1`                                    | Core framework REST API theo kiến trúc module     | `backend/package.json`         |
| **Database & ORM**     | `PostgreSQL` + `Prisma`                 | Client: `^7.10.0`, CLI: `8.0.0-rc.22`        | Quản lý cơ sở dữ liệu quan hệ, type-safe query    | `backend/prisma/schema.prisma` |
| **Authentication**     | `Passport` + `JWT`                      | `@nestjs/jwt ^12.0.2`, `passport-jwt ^4.0.1` | Xác thực người dùng bằng Bearer Token             | `backend/src/modules/auth/`    |
| **Password Hashing**   | `bcrypt`                                | `^6.0.0`                                     | Băm mật khẩu người dùng trước khi lưu trữ         | `backend/package.json`         |
| **Validation**         | `class-validator` & `class-transformer` | `^0.15.1` & `^0.5.1`                         | Tự động validate và sanitize DTO đầu vào          | `backend/src/main.ts`          |
| **Testing**            | `Vitest` + `Supertest`                  | Vitest `^4.1.2`, Supertest `^7.0.0`          | Unit test và End-to-End (e2e) test                | `backend/vitest.config.ts`     |
| **Backend Linter**     | `Oxlint`                                | `^1.58.0`                                    | Linter hiệu năng cao kiểm tra mã TypeScript       | `backend/.oxlintrc.json`       |

---

## 2. Cây Thư Mục Toàn Bộ Repository

Dưới đây là cấu trúc thư mục thực tế của dự án kèm chú thích về tình trạng hiện diện mã nguồn:

```text
brew-lite/
├── .gitignore                      # Cấu hình bỏ qua tệp Git (node_modules, .next, dist, ...)
├── package.json                    # Cấu hình root, script dev chạy song song 2 phía
├── pnpm-lock.yaml                  # Lockfile root của pnpm
├── README.md                       # Tài liệu giới thiệu tổng quan dự án
├── SETUP.md                        # Hướng dẫn thiết lập và khởi chạy môi trường
├── STRUCTURE.md                    # Tài liệu kiến trúc và cấu trúc mã nguồn (tệp này)
│
├── backend/                        # Thư mục mã nguồn NestJS Server
│   ├── .env                        # [BẢO MẬT] Biến môi trường backend (PORT, DATABASE_URL, JWT_SECRET, ...)
│   ├── .gitignore                  # Gitignore riêng của backend
│   ├── .oxlintrc.json              # Cấu hình Oxlint cho backend
│   ├── .prettierrc                 # Cấu hình Prettier format code
│   ├── nest-cli.json               # Cấu hình Nest CLI
│   ├── package.json                # Dependencies và scripts chạy backend
│   ├── pnpm-lock.yaml              # Lockfile backend
│   ├── pnpm-workspace.yaml         # Cấu hình build flags pnpm cho bcrypt/esbuild
│   ├── tsconfig.json               # Cấu hình TypeScript Backend (ES2023, NodeNext)
│   ├── tsconfig.build.json         # Cấu hình TypeScript phục vụ build dist
│   ├── vitest.config.ts            # Cấu hình Vitest Unit Test
│   ├── vitest.config.e2e.ts        # Cấu hình Vitest E2E Test
│   │
│   ├── prisma/
│   │   └── schema.prisma           # Định nghĩa 18 Models, 3 Enums & quan hệ PostgreSQL
│   │
│   ├── src/
│   │   ├── main.ts                 # Entry point khởi tạo NestJS, CORS, ValidationPipe
│   │   ├── app.module.ts           # Root Module kết nối ứng dụng (hiện chỉ mới nạp DatabaseModule)
│   │   │
│   │   ├── database/               # Module quản lý kết nối cơ sở dữ liệu
│   │   │   ├── database.module.ts  # Module @Global() export PrismaService
│   │   │   └── prisma.service.ts   # Service kế thừa PrismaClient ($connect, $disconnect)
│   │   │
│   │   ├── common/                 # Các tiện ích và logic bảo mật dùng chung
│   │   │   ├── decorators/
│   │   │   │   └── current-user.decorator.ts # Decorator @CurrentUser() lấy payload user từ request
│   │   │   ├── guards/
│   │   │   │   ├── jwt-auth.guard.ts         # Guard kiểm tra tính hợp lệ của JWT
│   │   │   │   └── roles.guard.ts            # Guard kiểm tra phân quyền RBAC dựa trên Reflector
│   │   │   ├── filters/            # Thư mục chứa Exception Filters (chưa có file)
│   │   │   └── interceptors/       # Thư mục chứa Interceptors (chưa có file)
│   │   │
│   │   └── modules/                # Các module nghiệp vụ (Modular Monolith)
│   │       ├── auth/               # Module Xác thực
│   │       │   ├── auth.controller.ts        # Controller: Nhận Request từ client, trả về Response
│   │       │   ├── auth.module.ts            # Module: Gom nhóm mọi thứ lại (khai báo Controller, Service, Repository)
│   │       │   ├── auth.repositories.ts      # Repository: Chỉ giao tiếp trực tiếp với Database (Prisma)
│   │       │   ├── auth.service.ts           # Service: Viết logic nghiệp vụ (tính toán, kiểm tra điều kiện)
│   │       │   ├── jwt.strategy.ts           # Passport JWT Strategy xử lý Bearer Token
│   │       │   └── dto/                      # DTO: Định nghĩa và validate kiểu dữ liệu đầu vào
│   │       ├── carts/              # Module Giỏ hàng
│   │       ├── loyalty/            # Module Điểm tích lũy và Khách hàng thân thiết
│   │       ├── orders/             # Module Đơn hàng
│   │       ├── payments/           # Module Thanh toán
│   │       ├── products/           # Module Sản phẩm & Danh mục
│   │       └── users/              # Module Quản lý người dùng
│   │
│   └── test/
│       └── app.e2e-spec.ts         # Bài test e2e mẫu với Supertest
│
└── frontend/                       # Thư mục mã nguồn Next.js Client
    ├── .gitignore                  # Gitignore riêng của frontend
    ├── eslint.config.mjs           # Cấu hình ESLint 9
    ├── next.config.ts              # Cấu hình Next.js
    ├── next-env.d.ts               # Type definitions sinh bởi Next.js
    ├── package.json                # Dependencies và scripts chạy frontend
    ├── pnpm-lock.yaml              # Lockfile frontend
    ├── postcss.config.mjs          # Cấu hình PostCSS với plugin @tailwindcss/postcss
    ├── tsconfig.json               # Cấu hình TypeScript Frontend (có alias `@/*`)
    ├── public/                     # Thư mục chứa hình ảnh tĩnh công khai
    │
    └── src/
        ├── app/                    # Next.js App Router
        │   ├── layout.tsx          # Root Layout (nạp font Inter, HTML cơ bản)
        │   ├── page.tsx            # Trang chủ gốc
        │   ├── (admin)/            # Route Group dành cho quản trị
        │   │   ├── dashboard/page.tsx # Trang tổng quan quản trị
        │   │   ├── orders/page.tsx    # Trang quản lý đơn hàng
        │   │   └── products/page.tsx  # Trang quản lý sản phẩm
        │   ├── (auth)/             # Route Group xác thực
        │   │   ├── login/page.tsx     # Trang đăng nhập
        │   │   └── register/page.tsx  # Trang đăng ký
        │   └── (shop)/             # Route Group người dùng mua sắm
        │       ├── cart/page.tsx      # Trang giỏ hàng
        │       ├── menu/pag.tsx       # Trang thực đơn (CHÚ Ý: Lỗi tên tệp `pag.tsx`)
        │       └── orders/page.tsx    # Trang lịch sử đơn hàng
        │
        ├── components/             # UI Components tái sử dụng
        │   ├── layout/             # Chứa Header, Footer, Sidebar, Navbar
        │   └── ui/                 # Chứa Button, Input, Modal, Card, Dialog
        │
        ├── features/               # Domain-driven feature components
        │   ├── cart/               # Logic & UI riêng của giỏ hàng
        │   ├── checkout/           # Logic & UI riêng của thanh toán
        │   └── menu/               # Logic & UI riêng của hiển thị món
        │
        ├── lib/                    # Các tiện ích và thư viện khởi tạo dùng chung
        │   ├── axios.ts            # Axios client với baseURL và interceptor đính JWT
        │   └── utils.ts            # Hàm tiện ích `cn()` ghép class Tailwind
        │
        ├── store/                  # Quản lý State toàn cục bằng Zustand
        │   ├── use-auth-store.ts   # Store Auth (user, token, login, logout, localStorage)
        │   └── use-cart-store.ts   # Store Cart (items, addItem, removeItem, clearCart)
        │
        ├── styles/
        │   └── global.css          # File CSS gốc với @import "tailwindcss", biến màu & scrollbar
        │
        └── types/                  # Định nghĩa TypeScript data models của client
            ├── order.type.ts       # Type Order, OrderItem, OrderStatus, CreateOrderDto
            ├── product.type.ts     # Type Product
            └── user.type.ts        # Type User, UserRole, AuthResponse
```

---

## 3. Kiến Trúc Frontend (Next.js App Router)

Frontend được xây dựng bằng **Next.js 16 (App Router)** kết hợp **React 19** và **Tailwind CSS v4**.

### 3.1. Routing & Layouts (`src/app/`)

Ứng dụng sử dụng cơ chế **Route Groups** (đặt tên trong dấu ngoặc đơn) để phân tách logic và layout mà không ảnh hưởng tới URL pathname:

1. **Root (`src/app/`):**
   - [layout.tsx]: Bọc toàn bộ ứng dụng, nạp font chữ Google `Inter`, cấu hình thẻ `html lang="vi"`.
   - [page.tsx]: Điểm truy cập Landing Page / Trang giới thiệu quán cà phê.
2. **Nhóm Xác thực `(auth)`:**
   - URL: `/login` tương ứng với `src/app/(auth)/login/page.tsx`.
   - URL: `/register` tương ứng với `src/app/(auth)/register/page.tsx`.
3. **Nhóm Khách hàng `(shop)`:**
   - URL: `/menu` tương ứng với `src/app/(shop)/menu/pag.tsx`.
   - URL: `/cart` tương ứng với `src/app/(shop)/cart/page.tsx`.
   - URL: `/orders` tương ứng với `src/app/(shop)/orders/page.tsx`.
4. **Nhóm Quản trị `(admin)`:**
   - URL: `/dashboard` tương ứng với `src/app/(admin)/dashboard/page.tsx`.
   - URL: `/orders` (nếu tách biệt route admin) hoặc `/admin/orders` tương ứng với `src/app/(admin)/orders/page.tsx`.
   - URL: `/products` (hoặc `/admin/products`) tương ứng với `src/app/(admin)/products/page.tsx`.

### 3.2. State Management (`src/store/`)

Quản lý trạng thái bằng **Zustand 5**, hoạt động trực tiếp ở Client Components:

- **`useAuthStore`** ([use-auth-store.ts]):
  - State: `user: User | null`, `token: string | null`, `isAuthenticated: boolean`, `isLoading: boolean`.
  - Actions:
    - `login(token, user)`: Lưu token và thông tin user vào `localStorage`, cập nhật state.
    - `logout()`: Xóa token và user khỏi `localStorage`, đặt lại state rỗng.
    - `loadUserFromStorage()`: Đọc `localStorage` khi người dùng vừa load trang để duy trì phiên đăng nhập.
- **`useCartStore`** ([use-cart-store.ts]):
  - State: `items: CartItem[]`. Mỗi item gồm `product: Product`, `quantity: number`, `note?: string`.
  - Actions:
    - `addItem(product, quantity?, note?)`: Thêm sản phẩm vào giỏ hoặc cộng dồn số lượng nếu đã có trong giỏ theo `product.id`.
    - `removeItem(productId)`: Lọc bỏ sản phẩm khỏi mảng `items`.
    - `clearCart()`: Xóa toàn bộ giỏ hàng khi đặt hàng thành công hoặc hủy.

### 3.3. API Client Layer (`src/lib/axios.ts`)

- File [axios.ts]tạo một axios client dùng chung (`api`):
  - Base URL: `process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'`.
  - Request Interceptor: Tự động trích xuất token từ `localStorage.getItem('token')` (nếu chạy ở phía Client) và thêm vào header `Authorization: Bearer <token>`.

### 3.4. Định Kiểu Dữ Liệu Frontend (`src/types/`)

- [user.type.ts]: Định nghĩa kiểu `UserRole ('CUSTOMER' | 'STAFF' | 'ADMIN')`, interface `User`, `AuthResponse`.
- [product.type.ts]: Định nghĩa interface `Product` (`id`, `name`, `description`, `price`, `imageUrl`, `categoryId`, `isAvailable`).
- [order.type.ts]: Định nghĩa `OrderStatus`, `OrderItem`, `Order`, `CreateOrderDto`.

---

## 4. Kiến Trúc Backend (NestJS Modular Monolith)

Backend được tổ chức theo kiến trúc **Modular Monolith** sử dụng NestJS 12.

### 4.1. Entry Point & Cấu Hình Global (`src/main.ts`)

Tệp [main.ts] đảm nhận cấu hình vòng đời của server:

- **CORS:** Cấu hình cho phép Frontend gọi sang:
  ```typescript
  app.enableCors({
    origin: "http://localhost:3000",
    credentials: true,
  });
  ```
- **Validation Pipeline:** Bật global pipe với `class-validator`:
  ```typescript
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Loại bỏ trường ngoài DTO
      forbidNonWhitelisted: true, // Ném lỗi BadRequest nếu gửi trường thừa
      transform: true, // Tự ép kiểu dữ liệu (chuỗi số -> number)
    }),
  );
  ```
- **Port:** Mặc định chạy tại cổng `process.env.PORT || 4000`.

### 4.2. Tầng Cơ Sở Dữ Liệu (`src/database/`)

- **`PrismaService`** ([prisma.service.ts]):
  Kế thừa `PrismaClient` và triển khai các lifecycle hooks `OnModuleInit` (kết nối cơ sở dữ liệu qua `this.$connect()`) và `OnModuleDestroy` (ngắt kết nối an toàn qua `this.$disconnect()`).
- **`DatabaseModule`** ([database.module.ts]):
  Được trang bị decorator `@Global()`, cung cấp và export `PrismaService`. Nhờ đó, tất cả các module nghiệp vụ trong dự án đều có thể inject trực tiếp `PrismaService` mà không cần import lại `DatabaseModule`.
- **`AppModule`** ([app.module.ts]):
  Root module hiện tại đang nạp `DatabaseModule`.

### 4.3. Tầng Nghiệp Vụ & Xác Thực (Modules & Common)

- **`JwtStrategy`** ([jwt.strategy.ts]):
  Kế thừa `PassportStrategy(Strategy)`. Lấy token từ header qua `ExtractJwt.fromAuthHeaderAsBearerToken()`, giải mã bằng `process.env.JWT_SECRET` (fallback `chuoi_bi_mat_cua_brewlite`), trả về object `{ userId: payload.sub, username: payload.username, role: payload.role }`.
- **`JwtAuthGuard`** ([jwt-auth.guard.ts]):
  Kế thừa `AuthGuard('jwt')`. Kiểm tra tính hợp lệ và ném lỗi `UnauthorizedException('Token không hợp lệ hoặc bạn chưa đăng nhập!')` nếu token sai hoặc hết hạn.
- **`RolesGuard`** ([roles.guard.ts]):
  Kiểm tra quyền truy cập (RBAC) bằng cách dùng `Reflector` đọc metadata `'roles'` từ handler/controller và so sánh với `request.user.role`.
- **`CurrentUser` Decorator** ([current-user.decorator.ts]):
  Custom parameter decorator giúp trích xuất thông tin người dùng từ `request.user` trực tiếp tại controller handler:
  ```typescript
  @Get('profile')
  getProfile(@CurrentUser() user: any) { ... }
  ```

### 4.4. Hiện Trạng Triển Khai: Tầng Service & Repository Pattern

> [!IMPORTANT]
> **Xác minh thực tế về Repository Pattern:**  
> Mã nguồn hiện có chứa các tệp `*.repositories.ts` (ví dụ: `auth.repositories.ts`, `products.repositories.ts`), tuy nhiên **tất cả các tệp này đều là khung rỗng (0 bytes)**.  
> Ngược lại, trong tất cả các tệp service đã khởi tạo (`products.service.ts`, `orders.service.ts`, `carts.service.ts`, v.v.), mã nguồn đang inject trực tiếp `PrismaService` qua constructor:
>
> ```typescript
> constructor(private prisma: PrismaService) {}
> ```
>
> **Kết luận kiến trúc:** Dự án hiện đang áp dụng mô hình **Direct ORM Injection** (Service gọi trực tiếp Prisma Client). Repository Pattern **chưa được triển khai thực tế**. Nếu nhóm muốn chuẩn hóa theo Repository Pattern (Clean Architecture), cần phải viết Interface và Repository Class bao bọc Prisma queries.

---

## 5. Cấu Trúc Cơ Sở Dữ Liệu (PostgreSQL & Prisma ORM)

File lược đồ cơ sở dữ liệu [schema.prisma] đã hoàn thiện đầy đủ với **18 Models** và **3 Enums**, ánh xạ trực tiếp sang cơ sở dữ liệu PostgreSQL.

### 5.1. Danh Sách Các Enums Đã Định Nghĩa

1. `OrderStatus`:
   - `PENDING`: Đơn hàng vừa tạo, chờ xác nhận/thanh toán.
   - `PROCESSING`: Đang pha chế / xử lý món.
   - `COMPLETED`: Đã hoàn thành đơn hàng.
   - `CANCELLED`: Đã hủy đơn.
2. `PaymentMethod`:
   - `CASH`: Tiền mặt tại quầy.
   - `BANK_TRANSFER`: Chuyển khoản ngân hàng.
   - `MOMO`: Ví điện tử MoMo.
   - `VNPAY`: Cổng thanh toán VNPay.
3. `PaymentStatus`:
   - `PENDING`: Đang chờ thanh toán.
   - `SUCCESS`: Thanh toán thành công.
   - `FAILED`: Thanh toán thất bại.

### 5.2. Danh Sách Các Bảng (Models) & Thuộc Tính

#### Nhóm 1: Người Dùng & Phân Quyền (Users, Roles & Permissions)

- **`User` (bảng `users`):**
  - Cột: `id` (Int, PK, autoincrement), `username` (String, unique), `email` (String, unique), `passwordHash` (`password_hash`), `fullName` (`full_name`), `phone`, `roleId` (`role_id`), `createdAt`, `updatedAt`.
  - Quan hệ: `role` (N-1 với `Role`), `carts` (1-N với `Cart`), `orders` (1-N với `Order`), `loyaltyPoints` (1-N với `LoyaltyPoint`).
- **`Role` (bảng `roles`):**
  - Cột: `id` (Int, PK), `name` (String, unique - ví dụ: `CUSTOMER`, `STAFF`, `ADMIN`).
  - Quan hệ: `users` (1-N với `User`), `permissions` (N-N với `Permission`).
- **`Permission` (bảng `permissions`):**
  - Cột: `id` (Int, PK), `name` (String, unique).
  - Quan hệ: `roles` (N-N với `Role`).

#### Nhóm 2: Sản Phẩm, Danh Mục, Kích Cỡ & Topping

- **`Category` (bảng `categories`):**
  - Cột: `id` (Int, PK), `name`, `description`.
  - Quan hệ: `products` (1-N với `Product`).
- **`Product` (bảng `products`):**
  - Cột: `id` (Int, PK), `categoryId` (`category_id`), `name`, `description`, `price` (Decimal 10,2), `imageUrl` (`image_url`), `isAvailable` (`is_available`, default true), `createdAt`.
  - Quan hệ: `category` (N-1), `productSizes` (1-N), `productToppings` (1-N), `cartItems` (1-N), `orderItems` (1-N).
- **`Size` (bảng `sizes`):**
  - Cột: `id` (Int, PK), `name` (Small, Medium, Large), `additionalPrice` (`additional_price`, Decimal 10,2).
  - Quan hệ: `productSizes` (1-N với `ProductSize`).
- **`ProductSize` (bảng `product_sizes` - Bảng trung gian):**
  - Khóa chính kép: `@@id([productId, sizeId])`.
  - Khóa ngoại: `productId` (onDelete: Cascade), `sizeId`.
- **`Topping` (bảng `toppings`):**
  - Cột: `id` (Int, PK), `name`, `price` (Decimal 10,2).
  - Quan hệ: `productToppings` (1-N), `cartItemToppings` (1-N), `orderItemToppings` (1-N).
- **`ProductTopping` (bảng `product_toppings` - Bảng trung gian):**
  - Khóa chính kép: `@@id([productId, toppingId])`.
  - Khóa ngoại: `productId` (onDelete: Cascade), `toppingId`.

#### Nhóm 3: Giỏ Hàng (Carts & Cart Items)

- **`Cart` (bảng `carts`):**
  - Cột: `id` (Int, PK), `userId` (`user_id`), `createdAt`.
  - Quan hệ: `user` (N-1, onDelete: Cascade), `items` (1-N với `CartItem`).
- **`CartItem` (bảng `cart_items`):**
  - Cột: `id` (Int, PK), `cartId` (`cart_id`), `productId` (`product_id`), `quantity` (Int, default 1), `sizeId` (`size_id`, Int optional).
  - Quan hệ: `cart` (N-1, onDelete: Cascade), `product` (N-1), `toppings` (1-N với `CartItemTopping`).
- **`CartItemTopping` (bảng `cart_item_toppings`):**
  - Khóa chính kép: `@@id([cartItemId, toppingId])`.
  - Khóa ngoại: `cartItemId` (onDelete: Cascade), `toppingId`.

#### Nhóm 4: Đơn Hàng (Orders & Order Items)

- **`Order` (bảng `orders`):**
  - Cột: `id` (Int, PK), `userId` (`user_id`), `totalAmount` (`total_amount`, Decimal 10,2), `status` (OrderStatus, default PENDING), `createdAt`, `updatedAt`.
  - Quan hệ: `user` (N-1), `items` (1-N với `OrderItem`), `payment` (1-1 với `Payment`).
- **`OrderItem` (bảng `order_items`):**
  - Cột: `id` (Int, PK), `orderId` (`order_id`), `productId` (`product_id`), `quantity` (Int, default 1), `price` (Decimal 10,2).
  - Quan hệ: `order` (N-1, onDelete: Cascade), `product` (N-1), `toppings` (1-N với `OrderItemTopping`).
- **`OrderItemTopping` (bảng `order_item_toppings`):**
  - Khóa chính kép: `@@id([orderItemId, toppingId])`.
  - Khóa ngoại: `orderItemId` (onDelete: Cascade), `toppingId`.

#### Nhóm 5: Thanh Toán, Khuyến Mãi & Điểm Thưởng

- **`Payment` (bảng `payments`):**
  - Cột: `id` (Int, PK), `orderId` (`order_id`, unique), `amount` (Decimal 10,2), `method` (PaymentMethod), `status` (PaymentStatus, default PENDING), `transactionId` (`transaction_id`), `createdAt`.
  - Quan hệ: `order` (1-1 với `Order`, onDelete: Cascade).
- **`Promotion` (bảng `promotions`):**
  - Cột: `id` (Int, PK), `code` (String, unique), `discountPercent` (`discount_percent`, Decimal 5,2), `startDate` (`start_date`), `endDate` (`end_date`).
- **`LoyaltyPoint` (bảng `loyalty_points`):**
  - Cột: `id` (Int, PK), `userId` (`user_id`), `points` (Int, default 0), `tier` (String, default "BRONZE"), `updatedAt`.
  - Quan hệ: `user` (N-1 với `User`, onDelete: Cascade).

### 5.3. Sơ Đồ Quan Hệ Thực Thể (ERD)

```mermaid
erDiagram
    users ||--o{ roles : "belongs to"
    roles ||--o{ permissions : "has"
    users ||--o{ carts : "owns"
    users ||--o{ orders : "places"
    users ||--o{ loyalty_points : "accumulates"

    categories ||--o{ products : "contains"
    products ||--o{ product_sizes : "offers"
    sizes ||--o{ product_sizes : "defined in"
    products ||--o{ product_toppings : "allows"
    toppings ||--o{ product_toppings : "defined in"

    carts ||--o{ cart_items : "contains"
    products ||--o{ cart_items : "added as"
    cart_items ||--o{ cart_item_toppings : "customized with"
    toppings ||--o{ cart_item_toppings : "used in"

    orders ||--o{ order_items : "contains"
    products ||--o{ order_items : "sold as"
    order_items ||--o{ order_item_toppings : "customized with"
    toppings ||--o{ order_item_toppings : "used in"

    orders ||--o| payments : "settled by"

    users {
        int id PK
        string username UK
        string email UK
        string password_hash
        string full_name
        string phone
        int role_id FK
        datetime created_at
        datetime updated_at
    }

    roles {
        int id PK
        string name UK
    }

    permissions {
        int id PK
        string name UK
    }

    categories {
        int id PK
        string name
        string description
    }

    products {
        int id PK
        int category_id FK
        string name
        string description
        decimal price
        string image_url
        boolean is_available
        datetime created_at
    }

    sizes {
        int id PK
        string name
        decimal additional_price
    }

    product_sizes {
        int product_id PK,FK
        int size_id PK,FK
    }

    toppings {
        int id PK
        string name
        decimal price
    }

    product_toppings {
        int product_id PK,FK
        int topping_id PK,FK
    }

    carts {
        int id PK
        int user_id FK
        datetime created_at
    }

    cart_items {
        int id PK
        int cart_id FK
        int product_id FK
        int quantity
        int size_id
    }

    cart_item_toppings {
        int cart_item_id PK,FK
        int topping_id PK,FK
    }

    orders {
        int id PK
        int user_id FK
        decimal total_amount
        OrderStatus status
        datetime created_at
        datetime updated_at
    }

    order_items {
        int id PK
        int order_id FK
        int product_id FK
        int quantity
        decimal price
    }

    order_item_toppings {
        int order_item_id PK,FK
        int topping_id PK,FK
    }

    payments {
        int id PK
        int order_id UK,FK
        decimal amount
        PaymentMethod method
        PaymentStatus status
        string transaction_id
        datetime created_at
    }

    promotions {
        int id PK
        string code UK
        decimal discount_percent
        datetime start_date
        datetime end_date
    }

    loyalty_points {
        int id PK
        int user_id FK
        int points
        string tier
        datetime updated_at
    }
```

---

## 6. Luồng Dữ Liệu Thực Tế (Data Flow & Sequence)

### 6.1. Kiến Trúc Phân Tầng Tổng Thể

```mermaid
flowchart TD
    subgraph Frontend["Frontend (Next.js 16 Client)"]
        UI["UI Component (React 19)"]
        Store["Zustand Store (useAuthStore / useCartStore)"]
        Axios["Axios Client (src/lib/axios.ts)"]
        UI -->|Cập nhật state| Store
        Store -->|Gọi API| Axios
        UI -->|Gọi trực tiếp| Axios
    end

    subgraph Transport["Mạng & Bảo Mật (HTTP/HTTPS)"]
        Req["HTTP Request (JSON + Bearer Token)"]
        Axios -->|Gửi request| Req
    end

    subgraph Backend["Backend (NestJS 12 Server)"]
        CORS["CORS Middleware"]
        VPipe["ValidationPipe (class-validator)"]
        Guard["JwtAuthGuard & RolesGuard"]
        Controller["Controller (@Controller, @Get, @Post)"]
        Service["Service (@Injectable - Business Logic)"]
        Prisma["PrismaService (PrismaClient)"]

        Req --> CORS
        CORS --> VPipe
        VPipe --> Guard
        Guard --> Controller
        Controller -->|Gọi method| Service
        Service -->|Gọi query| Prisma
    end

    subgraph Database["Cơ Sở Dữ Liệu"]
        PG[("PostgreSQL")]
        Prisma -->|SQL queries| PG
    end
```

### 6.2. Luồng Xác Thực (Authentication Flow)

```mermaid
sequenceDiagram
    autonumber
    actor User as Khách Hàng / Nhân Viên
    participant FE as Next.js (LoginPage)
    participant Store as useAuthStore (Zustand)
    participant Axios as Axios Client (lib/axios.ts)
    participant AuthCtrl as AuthController
    participant AuthSvc as AuthService
    participant Prisma as PrismaService
    participant DB as PostgreSQL

    User->>FE: Nhập email/username & password
    FE->>Axios: POST /auth/login { username, password }
    Axios->>AuthCtrl: Gửi HTTP POST
    AuthCtrl->>AuthSvc: login(dto)
    AuthSvc->>Prisma: user.findUnique({ where: { username } })
    Prisma->>DB: SELECT * FROM users WHERE username = ?
    DB-->>Prisma: User Data (kèm password_hash)
    Prisma-->>AuthSvc: User Record
    AuthSvc->>AuthSvc: bcrypt.compare(password, password_hash)
    AuthSvc->>AuthSvc: Ký JWT Token với sub, username, role
    AuthSvc-->>AuthCtrl: { accessToken, user }
    AuthCtrl-->>Axios: HTTP 200 OK { accessToken, user }
    Axios-->>FE: Response data
    FE->>Store: login(accessToken, user)
    Store->>Store: localStorage.setItem('token', token)
    Store-->>FE: Cập nhật isAuthenticated = true
    FE-->>User: Điều hướng vào trang Dashboard / Menu
```

### 6.3. Luồng Gọi API Có Bảo Mật (Protected Request Flow)

```mermaid
sequenceDiagram
    autonumber
    actor User as Người Dùng Đã Đăng Nhập
    participant FE as UI Component (e.g. OrdersPage)
    participant Axios as Axios Interceptor
    participant Guard as JwtAuthGuard
    participant Strat as JwtStrategy (Passport)
    participant Decorator as @CurrentUser()
    participant Ctrl as OrdersController
    participant Svc as OrdersService
    participant Prisma as PrismaService

    User->>FE: Bấm "Xem đơn hàng của tôi"
    FE->>Axios: api.get('/orders')
    Axios->>Axios: Đọc token từ localStorage
    Axios->>Guard: Gửi HTTP Request kèm Header: Authorization: Bearer <JWT>
    Guard->>Strat: validate(payload)
    Strat->>Strat: Kiểm tra chữ ký & hạn dùng token
    Strat-->>Guard: Gắn payload user vào Request.user
    Guard-->>Ctrl: Cho phép đi qua (Authorized)
    Ctrl->>Decorator: @CurrentUser() trích xuất req.user
    Ctrl->>Svc: getMyOrders(userId)
    Svc->>Prisma: orders.findMany({ where: { userId } })
    Prisma-->>Svc: Danh sách đơn hàng
    Svc-->>Ctrl: Order list DTO
    Ctrl-->>FE: HTTP 200 JSON
    FE-->>User: Hiển thị danh sách đơn hàng
```

---

## 7. Hướng Dẫn Mở Rộng Mã Nguồn & Vị Trí Đặt File Mới

Để đảm bảo tính nhất quán giữa các thành viên khi phát triển tính năng, toàn bộ mã nguồn mới phải tuân thủ các vị trí và quy chuẩn dưới đây:

### 7.1. Hướng Dẫn Mở Rộng Backend (NestJS)

#### Bước 1: Xác định thư mục module

Toàn bộ tính năng nghiệp vụ nằm tại `backend/src/modules/<tên_tính_năng>/`:

- `controllers/` hoặc `<tên_tính_năng>.controller.ts`: Tiếp nhận HTTP requests.
- `services/` hoặc `<tên_tính_năng>.service.ts`: Xử lý logic nghiệp vụ.
- `dto/`: Định nghĩa các lớp Data Transfer Object cho request body/query.
- `<tên_tính_năng>.module.ts`: Khai báo module của NestJS.

#### Bước 2: Tạo DTO với Class-Validator

Tất cả dữ liệu từ Client gửi lên bắt buộc phải định nghĩa qua DTO để Global `ValidationPipe` kiểm tra:

```typescript
// backend/src/modules/products/dto/create-product.dto.ts
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsOptional,
} from "class-validator";

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @IsPositive()
  price: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  categoryId: number;
}
```

#### Bước 3: Triển khai Service

Inject `PrismaService` trực tiếp thông qua constructor:

```typescript
// backend/src/modules/products/products.service.ts
import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service"; // Dùng relative path để an toàn
import { CreateProductDto } from "./dto/create-product.dto";

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.product.findMany({
      include: { category: true, productSizes: { include: { size: true } } },
    });
  }

  async create(dto: CreateProductDto) {
    return this.prisma.product.create({ data: dto });
  }
}
```

#### Bước 4: Triển khai Controller

Sử dụng Guard bảo vệ nếu là API nội bộ:

```typescript
// backend/src/modules/products/products.controller.ts
import { Controller, Get, Post, Body, UseGuards } from "@nestjs/common";
import { ProductsService } from "./products.service";
import { CreateProductDto } from "./dto/create-product.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";

@Controller("products")
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  getAll() {
    return this.productsService.findAll();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }
}
```

#### Bước 5: Đăng ký vào Root Module

Mở [app.module.ts](file:///d:/CNPM/brew-lite/backend/src/app.module.ts) và bổ sung module mới vào mảng `imports`:

```typescript
// backend/src/app.module.ts
@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    ProductsModule, // Thêm vào đây
    // ...
  ],
})
export class AppModule {}
```

---

### 7.2. Hướng Dẫn Mở Rộng Frontend (Next.js)

#### 1. Thêm Trang Mới (Pages & Routes)

- Phân loại đúng Route Group:
  - Trang khách hàng (menu, đơn hàng): đặt trong `frontend/src/app/(shop)/<route-name>/page.tsx`.
  - Trang quản trị: đặt trong `frontend/src/app/(admin)/<route-name>/page.tsx`.
  - Trang đăng nhập/đăng ký: đặt trong `frontend/src/app/(auth)/<route-name>/page.tsx`.
- Luôn chỉ định `'use client';` ở đầu file nếu trang đó sử dụng React Hooks (`useState`, `useEffect`) hoặc Zustand stores.

#### 2. Thêm UI Components Dùng Chung

- Các thành phần nguyên tử (Atomic components: Button, Input, Modal, Badge): Đặt tại `frontend/src/components/ui/`.
- Các khối bố cục lớn (Header, Footer, Sidebar, Navigation Bar): Đặt tại `frontend/src/components/layout/`.
- Dùng hàm `cn()` từ `@/lib/utils` để ghép nối class Tailwind:

  ```typescript
  import { cn } from '@/lib/utils';

  export function Button({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
    return <button className={cn('px-4 py-2 rounded-md font-medium transition', className)} {...props} />;
  }
  ```

#### 3. Thêm State Management Toàn Cục Mới

- Đặt tại `frontend/src/store/use-<tên>-store.ts`.
- Sử dụng hàm `create` từ `zustand`.

#### 4. Khai Báo Data Types

- Khai báo kiểu dữ liệu tương ứng với backend tại `frontend/src/types/<tên>.type.ts`.
- Chú ý: Đồng bộ kiểu số `id: number` thay vì `string` nếu ánh xạ trực tiếp từ Prisma `Int`.

---

## 8. Quy Chuẩn Import, Path Aliases & Quản Lý Phụ Thuộc

### 8.1. Cấu Hình Path Alias

#### Phía Frontend (`frontend/tsconfig.json`):

Đã được cấu hình đầy đủ:

```json
"paths": {
  "@/*": ["./src/*"]
}
```

_Cách dùng chuẩn:_

```typescript
import { api } from "@/lib/axios";
import { useAuthStore } from "@/store/use-auth-store";
import { Product } from "@/types/product.type";
```

#### Phía Backend (`backend/tsconfig.json`):

> [!WARNING]
> **Hiện trạng kỹ thuật cần chú ý:**  
> Trong `backend/tsconfig.json` hiện **chưa có** mục `"baseUrl"` và `"paths"`. Tuy nhiên, trong một số file như `products.service.ts` đang viết `import { PrismaService } from '@/database/prisma.service';`.  
> Điều này sẽ gây lỗi biên dịch khi chạy TypeScript chuẩn NodeNext nếu chưa khai báo alias.  
> **Giải pháp:**
>
> 1. Sử dụng relative import: `import { PrismaService } from '../../database/prisma.service';` (an toàn tuyệt đối ngay lúc này).
> 2. Hoặc bổ sung cấu hình alias vào `backend/tsconfig.json` theo hướng dẫn tại mục 9.

### 8.2. Quản Lý Phụ Thuộc (Dependency Rules)

- Không cài đặt dependencies trực tiếp ở root trừ các công cụ điều phối chạy đồng thời (như `concurrently`).
- Quản lý gói riêng rẽ:
  - Cài thư viện backend: di chuyển vào thư mục `backend` và chạy `pnpm add <tên_gói>`.
  - Cài thư viện frontend: di chuyển vào thư mục `frontend` và chạy `pnpm add <tên_gói>`.
- Tuyệt đối không import chéo giữa thư mục `frontend/` và `backend/` vì đây là hai môi trường runtime khác nhau (Next.js Node/Browser vs NestJS Node.js Server).

---

## 9. Checklist Dành Cho Thành Viên Dự Án

### 9.1. Thiết Lập Môi Trường Lần Đầu

- [ ] Cài đặt Node.js (phiên bản khuyến nghị LTS: `>= 20.x` hoặc `>= 22.x`).
- [ ] Cài đặt `pnpm`:
  ```bash
  npm install -g pnpm@12.8.1
  ```
- [ ] Cài đặt dependencies cho toàn dự án:

  ```bash
  # Tại thư mục gốc brew-lite
  pnpm install

  # Cài đặt cho backend
  cd backend && pnpm install

  # Cài đặt cho frontend
  cd ../frontend && pnpm install
  ```

- [ ] Cấu hình biến môi trường:
  - Tạo tệp `backend/.env` từ file mẫu của nhóm (bao gồm `DATABASE_URL="postgresql://user:password@localhost:5432/brewlite"`, `JWT_SECRET="chuoi_bi_mat_cua_ban"`, `PORT=4000`).
  - Tạo tệp `frontend/.env.local` nếu cần tuỳ biến `NEXT_PUBLIC_API_URL=http://localhost:4000/api`.
- [ ] Chạy Prisma Migration để sinh database tables:
  ```bash
  cd backend
  pnpm prisma generate
  pnpm prisma db push # hoặc pnpm prisma migrate dev --name init
  ```

### 9.2. Quy Chuẩn Khi Phát Triển Tính Năng Mới

- [ ] **Tạo nhánh Git riêng:** `feature/<tên-tính-năng>` hoặc `fix/<tên-lỗi>`.
- [ ] **Mỗi API mới bắt buộc có DTO:** Sử dụng decorators của `class-validator`.
- [ ] **Bảo vệ Endpoint:** Sử dụng `@UseGuards(JwtAuthGuard)` cho các endpoint cần xác thực và `@Roles('ADMIN')` cho endpoint quản trị.
- [ ] **Kiểm tra linter và build trước khi commit:**

  ```bash
  # Backend
  cd backend && pnpm lint && pnpm build

  # Frontend
  cd frontend && pnpm lint && pnpm build
  ```

- [ ] **Không commit file nhạy cảm:** Tuyệt đối không commit tệp `.env`, khóa bí mật hoặc thông tin kết nối cơ sở dữ liệu thực tế lên kho mã nguồn.
