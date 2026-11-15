# BrewLite — Nền tảng Đặt đồ uống & Bánh trực tuyến

BrewLite là ứng dụng thương mại điện tử chuyên về đồ uống và bánh ngọt, hỗ trợ tùy chỉnh size/topping, kiểm soát tồn kho nguyên liệu thời gian thực (Optimistic Locking) và tích hợp cổng thanh toán trực tuyến VNPay Sandbox.

Hệ thống được thiết kế theo kiến trúc **Monorepo** dùng chung duy nhất một mã nguồn cho cả môi trường phát triển cục bộ (**Local Development**) và môi trường phát hành (**Production Deployment**):
- **Local Development:** Khởi chạy 100% bằng **Docker Compose** kết hợp **PostgreSQL local**, không yêu cầu cài đặt Node.js hay pnpm trên máy host.
- **Production Deployment:** Triển khai độc lập Frontend trên **Vercel**, Backend API trên **Render**, và lưu trữ dữ liệu trên **Neon Serverless PostgreSQL**.

---

## Mục lục

1. [Công nghệ sử dụng](#1-công-nghệ-sử-dụng)
2. [Cấu trúc thư mục Monorepo](#2-cấu-trúc-thư-mục-monorepo)
3. [Điều kiện tiên quyết](#3-điều-kiện-tiên-quyết)
4. [Hướng dẫn khởi chạy Local bằng Docker (Ưu tiên)](#4-hướng-dẫn-khởi-chạy-local-bằng-docker-ưu-tiên)
5. [Hướng dẫn tùy chọn: Kết nối Neon PostgreSQL Cloud](#5-hướng-dẫn-tùy-chọn-kết-nối-neon-postgresql-cloud)
6. [Tài khoản Demo & Quy trình kiểm thử nghiệp vụ](#6-tài-khoản-demo--quy-trình-kiểm-thử-nghiệp-vụ)
7. [Tích hợp cổng thanh toán VNPay Sandbox](#7-tích-hợp-cổng-thanh-toán-vnpay-sandbox)
8. [Kiểm thử tự động (Testing), Lint & Build](#8-kiểm-thử-tự-động-testing-lint--build)
9. [Quản trị Docker & Khắc phục sự cố (Troubleshooting)](#9-quản-trị-docker--khắc-phục-sự-cố-troubleshooting)
10. [So sánh môi trường Local & Production](#10-so-sánh-môi-trường-local--production)

---

## 1. Công nghệ sử dụng

| Tầng kiến trúc | Công nghệ & Phiên bản | Vai trò |
|---|---|---|
| **Frontend** | Next.js 16 (React 19, Tailwind CSS v4, Turbopack) | Giao diện người dùng Mobile-first, SSR & Client State Management |
| **Backend** | NestJS 12, Express, TypeScript 6 | RESTful API, xác thực JWT, RBAC, kiểm soát tồn kho & giao dịch |
| **Cơ sở dữ liệu** | PostgreSQL 17 (Docker Local / Neon Cloud) | CSDL quan hệ lưu trữ sản phẩm, đơn hàng, người dùng, giao dịch |
| **ORM & Migrations**| Prisma 7 (`@prisma/client`, `@prisma/adapter-pg`) | Quản lý schema 15 bảng, migrations tự động và nạp seed dữ liệu |
| **Thanh toán** | VNPay Gateway (Sandbox vpcpay v2) | Xử lý thanh toán thẻ ATM/nội địa, xác minh chữ ký bảo mật IPN |
| **Đóng gói & Vận hành** | Docker, Docker Compose, Alpine Linux | Đóng gói môi trường đồng nhất, hot-reload cho cả backend và frontend |

---

## 2. Cấu trúc thư mục Monorepo

```text
brew-lite/
├── frontend/                   # Ứng dụng Next.js (chạy trong Docker hoặc Vercel)
│   ├── src/
│   │   ├── app/                # App Router: menu, cart, checkout, orders, auth, profile
│   │   ├── components/         # UI Components: Navbar, Toast, LoadingState, EmptyState...
│   │   ├── features/           # Logic tính năng: cart (cart-store, logic), products
│   │   ├── lib/                # Client gọi API: products-api, orders-api, auth, money
│   │   └── types/              # Định nghĩa kiểu dữ liệu TypeScript
│   ├── Dockerfile              # Dockerfile chạy Next.js dev server trong container
│   └── package.json            # Dependencies và scripts frontend
├── backend/                    # Dịch vụ NestJS REST API (chạy trong Docker hoặc Render)
│   ├── src/
│   │   ├── main.ts             # Điểm khởi chạy NestJS, cấu hình CORS, ValidationPipe
│   │   ├── app.module.ts       # Root module kết nối toàn bộ module nghiệp vụ
│   │   ├── config/             # Cấu hình nạp biến môi trường tập trung (JWT, VNPay)
│   │   ├── prisma/             # PrismaService kết nối PostgreSQL
│   │   └── modules/            # Các module nghiệp vụ: auth, products, orders, payments, loyalty
│   ├── prisma/                 # Schema CSDL, migrations và file seed.ts
│   │   ├── schema.prisma       # Mô hình quan hệ 15 bảng
│   │   └── seed.ts             # Script nạp 151 món, topping, voucher và tài khoản demo
│   ├── prisma7.config.ts       # Cấu hình Prisma 7 (datasource url, migrations, seed)
│   ├── test/                   # Kiểm thử: unit, integration và e2e
│   ├── Dockerfile              # Production Dockerfile đa tầng
│   └── package.json            # Dependencies và scripts backend
├── docs/                       # Tài liệu thiết kế: kiến trúc, sơ đồ PlantUML, truy vết yêu cầu
│   ├── diagrams/               # Sơ đồ: activity, sequence, class, deployment, use case
│   └── traceability-matrix.md  # Ma trận truy vết yêu cầu phần mềm
├── docker-compose.yml          # Docker Compose chuẩn (backend:3001, frontend:3000)
├── docker-compose.local.yml    # Cấu hình mở rộng bổ sung PostgreSQL 17 container
├── pnpm-workspace.yaml         # Cấu hình pnpm monorepo workspace
├── package.json                # Root package metadata (pnpm@12.8.1)
└── README.md                   # Tài liệu hướng dẫn onboarding hệ thống
```

---

## 3. Điều kiện tiên quyết

Người mới chỉ cần cài đặt 2 công cụ nền tảng sau trên máy tính:

1. **Git:** Quản lý mã nguồn.
   - Kiểm tra cài đặt: `git --version`
2. **Docker Desktop:** Chạy toàn bộ hệ thống (Frontend, Backend, PostgreSQL) trong container.
   - Kiểm tra cài đặt: `docker --version` và `docker compose version`
   - *Lưu ý trên Windows:* Đảm bảo Docker Desktop đã được kích hoạt chế độ **WSL 2 Backend** (trong Settings → General → Use the WSL 2 based engine). Đảm bảo biểu tượng Docker ở thanh taskbar hiển thị trạng thái màu xanh lá (**Engine running**).

> **Lưu ý:** Bạn **không cần** cài đặt Node.js, npm, pnpm hay PostgreSQL trên máy tính host. Toàn bộ môi trường runtime, dependencies và công cụ biên dịch đều chạy cách ly trong Docker.

---

## 4. Hướng dẫn khởi chạy Local bằng Docker (Ưu tiên)

Đây là cách thiết lập nhanh nhất, an toàn nhất và độc lập 100% với môi trường bên ngoài. Hệ thống sẽ khởi chạy cả database PostgreSQL nội bộ bằng container.

### Bước 1: Clone Repository

Mở terminal (PowerShell trên Windows hoặc Terminal trên macOS/Linux):

```bash
git clone https://github.com/dkhoaaaaa/brew-lite.git
cd brew-lite
```

### Bước 2: Tạo file cấu hình môi trường `.env`

Sao chép file `.env.example` thành file `.env` tại thư mục gốc:

- **Trên Windows PowerShell:**
  ```powershell
  Copy-Item .env.example .env
  ```
- **Trên Linux / macOS:**
  ```bash
  cp .env.example .env
  ```

Mở file `.env` vừa tạo và sử dụng cấu hình mẫu an toàn sau cho môi trường Local Docker:

```env
# ==================================================
# 1. LOCAL POSTGRESQL - DOCKER
# ==================================================
POSTGRES_USER=brewlite
POSTGRES_PASSWORD=brewlite_secure_password_123
POSTGRES_DB=brewlite

# Kết nối nội bộ giữa các container trong mạng Docker
LOCAL_DATABASE_URL="postgresql://brewlite:brewlite_secure_password_123@postgres:5432/brewlite?schema=public"
LOCAL_DIRECT_URL="postgresql://brewlite:brewlite_secure_password_123@postgres:5432/brewlite?schema=public"

# ==================================================
# 2. JWT AUTHENTICATION
# ==================================================
JWT_ACCESS_SECRET=brewlite_dev_access_secret_key_2026
JWT_REFRESH_SECRET=brewlite_dev_refresh_secret_key_2026

# ==================================================
# 3. FRONTEND & BACKEND PORTS
# ==================================================
NEXT_PUBLIC_API_URL=http://localhost:3001
FRONTEND_BASE_URL=http://localhost:3000

# ==================================================
# 4. VNPAY SANDBOX (Tùy chọn khi thanh toán)
# ==================================================
VNPAY_PAYMENT_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_TMN_CODE=your_vnpay_sandbox_tmn_code
VNPAY_HASH_SECRET=your_vnpay_sandbox_hash_secret
VNPAY_RETURN_URL=http://localhost:3001/payments/vnpay/return
PAYMENT_TTL_MINUTES=5
```

### Bước 3: Build và khởi chạy các dịch vụ Docker

Khởi chạy đồng thời cả 3 container: **PostgreSQL Local**, **NestJS Backend** và **Next.js Frontend**:

```bash
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d --build
```

- **Mục đích:** Tải image PostgreSQL 17 Alpine, đóng gói dependencies và chạy backend, frontend ở chế độ nền (`-d`).
- **Kiểm tra trạng thái container:**
  ```bash
  docker compose -f docker-compose.yml -f docker-compose.local.yml ps
  ```
- **Kết quả mong đợi:** Cả 3 service hiển thị trạng thái hoạt động:
  - `postgres`: trạng thái `Up` kèm `(healthy)`
  - `backend`: trạng thái `Up` (port map `0.0.0.0:3001->3000/tcp`)
  - `frontend`: trạng thái `Up` (port map `0.0.0.0:3000->3000/tcp`)

### Bước 4: Đồng bộ CSDL và Nạp dữ liệu mẫu (Seed)

Chạy Prisma migration và seed trực tiếp vào container backend:

1. **Áp dụng các bản cập nhật CSDL (Prisma Migration):**
   ```bash
   docker compose -f docker-compose.yml -f docker-compose.local.yml exec -w /app/backend backend pnpm exec prisma --config prisma7.config.ts migrate deploy
   ```
   *Kết quả mong đợi:* Hiển thị `All migrations have been successfully applied.`

2. **Tạo Prisma Client (nếu cần cập nhật schema):**
   ```bash
   docker compose -f docker-compose.yml -f docker-compose.local.yml exec -w /app/backend backend pnpm exec prisma --config prisma7.config.ts generate
   ```

3. **Nạp dữ liệu mẫu ban đầu (Seed Data):**
   ```bash
   docker compose -f docker-compose.yml -f docker-compose.local.yml exec -w /app/backend backend pnpm exec prisma --config prisma7.config.ts db seed
   ```
   *Kết quả mong đợi:* Hệ thống thông báo nạp thành công:
   - 151 sản phẩm đồ uống và bánh ngọt thuộc các danh mục Cà phê, Trà, Bánh.
   - Bảng định lượng nguyên liệu cho từng kích thước (Size S, M, L).
   - Danh sách topping và 10 mã voucher khuyến mãi.
   - 2 tài khoản demo: `example@gmail.com` và `customer1@gmail.com`.

### Bước 5: Kiểm tra và truy cập ứng dụng

Mở trình duyệt web để kiểm tra các cổng hoạt động:

| Thành phần | Đường dẫn truy cập | Kết quả mong đợi |
|---|---|---|
| **Health Check API** | [http://localhost:3001/health](http://localhost:3001/health) | Trả về JSON: `{"success":true,"status":"ok","database":"connected"}` |
| **Backend API Root** | [http://localhost:3001](http://localhost:3001) | Chuỗi thông báo: `Hello from BrewLite Backend!` |
| **Giao diện Web (Frontend)** | [http://localhost:3000](http://localhost:3000) | Hiển thị trang chủ BrewLite với danh sách sản phẩm đầy đủ |

---

## 5. Hướng dẫn tùy chọn: Kết nối Neon PostgreSQL Cloud

Nếu bạn muốn sử dụng cơ sở dữ liệu điện toán đám mây Neon thay vì chạy container PostgreSQL cục bộ:

1. Đăng ký tài khoản miễn phí tại [Neon.tech](https://neon.tech) và tạo project PostgreSQL mới.
2. Tại bảng điều khiển Neon (mục **Connection Details**), sao chép 2 chuỗi kết nối:
   - **Pooled connection string:** Cập nhật vào biến `DATABASE_URL` trong file `.env`.
   - **Direct connection string:** Cập nhật vào biến `DIRECT_URL` trong file `.env`.
   *(Đảm bảo chuỗi kết nối luôn có tham số `?sslmode=require`)*.
3. Khởi chạy hệ thống bằng cấu hình Docker Compose mặc định (không kèm file local):
   ```bash
   docker compose up -d --build
   ```
4. Chạy migration và seed dữ liệu lên Neon Cloud:
   ```bash
   docker compose exec -w /app/backend backend pnpm exec prisma --config prisma7.config.ts migrate deploy
   docker compose exec -w /app/backend backend pnpm exec prisma --config prisma7.config.ts db seed
   ```

---

## 6. Tài khoản Demo & Quy trình kiểm thử nghiệp vụ

### 6.1. Danh sách tài khoản thử nghiệm (Được tạo tự động từ Seed)

| Vai trò | Email đăng nhập | Mật khẩu | Điểm tích lũy | Mục đích kiểm thử |
|---|---|---|---|---|
| **Khách hàng tiêu chuẩn** | `example@gmail.com` | `Example@123` | 0 điểm | Kiểm tra luồng đặt món, giỏ hàng, áp dụng voucher tân thủ |
| **Khách hàng thân thiết** | `customer1@gmail.com` | `Customer@123` | 200 điểm | Kiểm tra tính năng tích lũy và đổi voucher bằng điểm thưởng |

### 6.2. Kịch bản kiểm thử luồng nghiệp vụ từ đầu đến cuối (E2E Flow)

1. **Khám phá thực đơn (`/menu`):**
   - Truy cập `http://localhost:3000/menu`.
   - Lọc sản phẩm theo danh mục: *Cà phê*, *Trà*, *Bánh* hoặc tìm kiếm theo tên món.
2. **Tùy chỉnh món (`/products/[id]`):**
   - Chọn một sản phẩm (ví dụ: *Cà phê Sữa Đá*).
   - Chọn kích thước (Size S, M hoặc L), thêm các loại Topping (Thạch, Trân châu,...), điều chỉnh mức đá/đường.
   - Nhấn **Thêm vào giỏ hàng**.
3. **Quản lý giỏ hàng (`/cart`):**
   - Bấm vào biểu tượng Giỏ hàng ở góc phải màn hình.
   - Thay đổi số lượng món, kiểm tra công thức tính tổng tiền tạm tính.
   - Bấm **Tiến hành đặt hàng**.
4. **Đăng nhập xác thực (`/login`):**
   - Hệ thống tự động chuyển hướng hoặc yêu cầu đăng nhập.
   - Điền thông tin tài khoản mẫu: `example@gmail.com` / `Example@123`.
5. **Thanh toán & Áp dụng mã giảm giá (`/checkout`):**
   - Nhập thông tin người nhận hàng và địa chỉ giao hàng.
   - Nhập mã khuyến mãi có sẵn từ seed (ví dụ: `BREWLITE10`, `WELCOME15`, `COFFEE5K`) và nhấn áp dụng.
   - Chọn phương thức thanh toán: **VNPay Sandbox**.
   - Bấm **Xác nhận đặt hàng**.
6. **Xác nhận & Theo dõi đơn hàng (`/orders` & `/orders/[id]`):**
   - Sau khi tạo đơn, hệ thống ghi nhận đơn hàng với trạng thái `PENDING`.
   - Vào mục **Lịch sử đơn hàng** (`/orders`) để xem danh sách đơn đã đặt và kiểm tra thông tin chi tiết từng đơn hàng.

---

## 7. Tích hợp cổng thanh toán VNPay Sandbox

### 7.1. Cấu hình thông tin kết nối

Để kích hoạt tính năng thanh toán chuyển hướng qua cổng VNPay:
1. Đăng ký tài khoản thử nghiệm tại cổng [VNPay Sandbox Developers](https://sandbox.vnpayment.vn/devreg/).
2. Lấy thông tin mã kết nối và cập nhật vào file `.env`:
   - `VNPAY_TMN_CODE`: Mã Website (Terminal ID) do VNPay cấp.
   - `VNPAY_HASH_SECRET`: Chuỗi bí mật tạo chữ ký (Secret Key).
   - `VNPAY_PAYMENT_URL`: `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html`
   - `VNPAY_RETURN_URL`: `http://localhost:3001/payments/vnpay/return`

### 7.2. Thông tin thẻ ngân hàng thử nghiệm (NCB Sandbox)

Khi chuyển hướng sang cổng thanh toán VNPay, chọn ngân hàng **NCB** và sử dụng thông tin thẻ thử nghiệm sau:

| Thông tin | Giá trị nhập |
|---|---|
| **Ngân hàng phát hành** | NCB (Ngân hàng Quốc Dân) |
| **Số thẻ** | `9704198526191432198` |
| **Tên chủ thẻ** | `NGUYEN VAN A` |
| **Ngày phát hành** | `07/15` |
| **Mã xác thực OTP** | `123456` |

### 7.3. Các chức năng vẫn kiểm tra được khi CHƯA CÓ tài khoản VNPay

Nếu bạn chưa đăng ký tài khoản VNPay Sandbox, hệ thống **vẫn cho phép kiểm tra đầy đủ** các tính năng nghiệp vụ cốt lõi sau:
- Toàn bộ trải nghiệm xem menu, tìm kiếm, xem chi tiết, chọn size, topping.
- Quản lý giỏ hàng, tính toán tổng tiền và chiết khấu.
- Đăng ký tài khoản mới và đăng nhập JWT.
- Tích điểm thành viên và đổi điểm thưởng lấy voucher.
- **Tạo đơn hàng thành công (`POST /orders`):** Đơn hàng vẫn được tạo thành công trong database, lưu ở trạng thái `PENDING` và kích hoạt logic khóa tồn kho nguyên liệu (Optimistic Locking).
- Chỉ khi nhấn nút chuyển sang cổng thanh toán VNPay, hệ thống mới thông báo cấu hình VNPay chưa hoàn tất (`503 Service Unavailable`).

---

## 8. Kiểm thử tự động (Testing), Lint & Build

Tất cả các bài kiểm thử và công cụ rà soát mã nguồn đều có thể chạy trực tiếp thông qua Docker container:

### 8.1. Kiểm thử Backend (Vitest)

- **Chạy Unit Test & Integration Test:**
  ```bash
  docker compose -f docker-compose.yml -f docker-compose.local.yml exec -w /app/backend backend pnpm test
  ```
  *(Thực thi toàn bộ các file `*.spec.ts` bao gồm kiểm thử dịch vụ giỏ hàng, xác thực auth, tính toán khuyến mãi, thanh toán và kiểm tra tồn kho nguyên liệu)*.

- **Chạy End-to-End (E2E) Test:**
  ```bash
  docker compose -f docker-compose.yml -f docker-compose.local.yml exec -w /app/backend backend pnpm test:e2e
  ```
  *(Thực thi kiểm thử luồng tạo đơn và thanh toán `checkout-flow.e2e-spec.ts`)*.

### 8.2. Kiểm tra quy chuẩn mã nguồn (Linting)

- **Kiểm tra linter Backend (Oxlint):**
  ```bash
  docker compose -f docker-compose.yml -f docker-compose.local.yml exec -w /app/backend backend pnpm run lint
  ```
- **Kiểm tra linter Frontend (ESLint):**
  ```bash
  docker compose -f docker-compose.yml -f docker-compose.local.yml exec -w /app/frontend frontend pnpm run lint
  ```

### 8.3. Kiểm tra Build ứng dụng

- **Build kiểm thử Backend:**
  ```bash
  docker compose -f docker-compose.yml -f docker-compose.local.yml exec -w /app/backend backend pnpm run build
  ```
- **Build kiểm thử Frontend:**
  ```bash
  docker compose -f docker-compose.yml -f docker-compose.local.yml exec -w /app/frontend frontend pnpm run build
  ```

---

## 9. Quản trị Docker & Khắc phục sự cố (Troubleshooting)

### 9.1. Các lệnh quản lý Docker thường dùng

| Thao tác | Lệnh thực thi (Môi trường Local Docker DB) |
|---|---|
| **Xem logs thời gian thực toàn bộ hệ thống** | `docker compose -f docker-compose.yml -f docker-compose.local.yml logs -f` |
| **Xem logs riêng Backend** | `docker compose -f docker-compose.yml -f docker-compose.local.yml logs -f backend` |
| **Xem logs riêng Frontend** | `docker compose -f docker-compose.yml -f docker-compose.local.yml logs -f frontend` |
| **Xem logs riêng PostgreSQL** | `docker compose -f docker-compose.yml -f docker-compose.local.yml logs -f postgres` |
| **Khởi động lại các container** | `docker compose -f docker-compose.yml -f docker-compose.local.yml restart` |
| **Dừng các container** | `docker compose -f docker-compose.yml -f docker-compose.local.yml stop` |
| **Dừng và gỡ bỏ container, giữ nguyên volume dữ liệu** | `docker compose -f docker-compose.yml -f docker-compose.local.yml down` |

### 9.2. Hướng dẫn xử lý các lỗi thường gặp

#### 1. Lỗi: Docker Daemon chưa chạy (`failed to connect to the docker API`)
- **Nguyên nhân:** Ứng dụng Docker Desktop chưa được mở hoặc dịch vụ Docker engine bị dừng.
- **Khắc phục:** Mở ứng dụng Docker Desktop trên máy, đợi 30 giây đến khi biểu tượng cá voi chuyển sang màu xanh lá báo hiệu Docker đã sẵn sàng, sau đó thực thi lại lệnh.

#### 2. Lỗi: Xung đột cổng kết nối (`port is already allocated` - 3000, 3001 hoặc 5432)
- **Nguyên nhân:** Cổng 3000 (Frontend), 3001 (Backend) hoặc 5432 (PostgreSQL) đang bị chiếm dụng bởi ứng dụng khác hoặc dịch vụ PostgreSQL cài trực tiếp trên máy host.
- **Khắc phục:**
  - *Trên Windows:* Kiểm tra tiến trình đang chiếm port:
    ```powershell
    netstat -ano | findstr :3000
    netstat -ano | findstr :5432
    ```
    Nếu dịch vụ PostgreSQL của Windows đang chạy, hãy tạm dừng: `net stop postgresql-x64-17` (hoặc phiên bản tương ứng).
  - Hoặc chỉnh sửa port mapping bên trái trong `docker-compose.yml` (ví dụ: `"3002:3000"`).

#### 3. Lỗi: Không thể kết nối cơ sở dữ liệu (`Can't reach database server at postgres:5432`)
- **Nguyên nhân:** Container `postgres` chưa hoàn tất khởi động hoặc chưa đạt trạng thái `healthy` khi backend cố gắng kết nối.
- **Khắc phục:**
  - Kiểm tra trạng thái postgres: `docker compose -f docker-compose.yml -f docker-compose.local.yml ps`
  - Xem log chi tiết: `docker compose -f docker-compose.yml -f docker-compose.local.yml logs postgres`
  - Đợi khoảng 10-15 giây rồi khởi động lại backend: `docker compose -f docker-compose.yml -f docker-compose.local.yml restart backend`

#### 4. Lỗi: Chưa áp dụng migration trước khi seed dữ liệu
- **Nguyên nhân:** Bảng trong CSDL chưa được khởi tạo dẫn tới script seed báo lỗi quan hệ không tồn tại (`relation does not exist`).
- **Khắc phục:** Luôn chạy lệnh `migrate deploy` trước khi chạy `db seed`:
  ```bash
  docker compose -f docker-compose.yml -f docker-compose.local.yml exec -w /app/backend backend pnpm exec prisma --config prisma7.config.ts migrate deploy
  docker compose -f docker-compose.yml -f docker-compose.local.yml exec -w /app/backend backend pnpm exec prisma --config prisma7.config.ts db seed
  ```

#### 5. Lỗi: Thiếu biến môi trường bắt buộc
- **Nguyên nhân:** File `.env` chưa được tạo hoặc để trống biến `POSTGRES_PASSWORD`, `JWT_ACCESS_SECRET`.
- **Khắc phục:** Kiểm tra file `.env` đã có đầy đủ các biến mẫu như mục 4.2 chưa, sau đó chạy lại lệnh `docker compose up -d`.

#### 6. Lỗi: Chặn truy vấn trình duyệt do CORS (`Access-Control-Allow-Origin`)
- **Nguyên nhân:** URL Frontend gọi vào không khớp với danh sách cho phép của Backend.
- **Khắc phục:** Kiểm tra biến `FRONTEND_BASE_URL` trong file `.env` của backend phải đặt là `http://localhost:3000`. Backend đã được cấu hình tự động cho phép `http://localhost:3000`, `http://127.0.0.1:3000` và domain Vercel.

#### 7. Lỗi: Chuyển hướng thanh toán VNPay không quay về giỏ hàng
- **Nguyên nhân:** Cấu hình `VNPAY_RETURN_URL` trỏ sai địa chỉ.
- **Khắc phục:** Đảm bảo `VNPAY_RETURN_URL` trong `.env` là `http://localhost:3001/payments/vnpay/return`. Endpoint này sẽ nhận kết quả từ VNPay và tự động chuyển hướng người dùng về trang xác nhận frontend `http://localhost:3000/checkout/confirmation`.

### 9.3. Đặt lại toàn bộ dữ liệu CSDL (Database Reset)

> **Cảnh báo:** Thao tác này sẽ xóa toàn bộ dữ liệu hiện có trong CSDL local để tái thiết lập từ đầu. Chỉ thực hiện khi bạn muốn làm sạch môi trường test.

```bash
# 1. Dừng và xóa toàn bộ container cùng volume dữ liệu postgres_data
docker compose -f docker-compose.yml -f docker-compose.local.yml down -v

# 2. Khởi chạy lại hệ thống mới hoàn toàn
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d --build

# 3. Đồng bộ lại cấu trúc và nạp lại dữ liệu seed
docker compose -f docker-compose.yml -f docker-compose.local.yml exec -w /app/backend backend pnpm exec prisma --config prisma7.config.ts migrate deploy
docker compose -f docker-compose.yml -f docker-compose.local.yml exec -w /app/backend backend pnpm exec prisma --config prisma7.config.ts db seed
```

---

## 10. So sánh môi trường Local & Production

| Tiêu chí | Môi trường Phát triển (Local Development) | Môi trường Vận hành thực tế (Production) |
|---|---|---|
| **Cơ chế triển khai** | Docker Compose (`docker compose up`) | Vercel (Frontend) & Render (Backend) |
| **Cơ sở dữ liệu** | PostgreSQL 17 Docker Container (hoặc Neon Cloud) | Neon Serverless PostgreSQL Cloud |
| **Frontend URL** | `http://localhost:3000` | `https://brew-lite-tau.vercel.app` |
| **Backend API URL** | `http://localhost:3001` | `https://your-backend.onrender.com` |
| **Health Check Endpoint** | `http://localhost:3001/health` | `https://your-backend.onrender.com/health` |
| **Mã nguồn Repository** | `https://github.com/dkhoaaaaa/brew-lite` | `https://github.com/dkhoaaaaa/brew-lite` |
| **Cơ chế Hot-Reload** | Hỗ trợ cho cả Next.js (Turbopack) và NestJS (Watch) | Build tối ưu tĩnh, chạy node dist mode |
| **Yêu cầu cài đặt** | Chỉ cần Docker Desktop & Git | Tự động CI/CD qua GitHub Webhooks |
